import { User } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  Unsubscribe 
} from "firebase/firestore";
import { db } from "./classroom";
import { FriendItem, FriendRequestItem, FriendGroup, FriendGroupMember } from "../types";

export interface UserPublicProfile {
  uid: string;
  username: string; // Lowercase with @, e.g. "@ahmed"
  rawUsername: string; // Original casing, e.g. "@Ahmed"
  displayName: string;
  email: string;
  fiveDigitCode: string; // Exactly 5 numbers, e.g. "58392"
  inviteCode: string; // Mirrors 5-digit code or custom invite code
  focusMinutesThisWeek: number;
  currentWeekId: string; // e.g. "2026-W43"
  totalFocusMinutes: number;
  streak: number;
  upcomingExamsCount?: number;
  status?: "online" | "studying" | "offline";
  updatedAt?: any;
}

export interface SendFriendRequestResult {
  success: boolean;
  message: string;
  request?: FriendRequestItem;
}

/**
 * Generate a deterministic or randomized 5-digit numeric friend/room code (10000 - 99999).
 */
export function generateFiveDigitCode(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const positive = Math.abs(hash);
    const code = (10000 + (positive % 90000)).toString();
    return code;
  }
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Get current ISO week identifier (e.g. "2026-W43").
 * Used to automatically reset weekly focus leaderboards on Mondays.
 */
export function getCurrentWeekIdentifier(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

/**
 * Register or update the user's public discoverable profile in Firestore.
 * Allows other students and family to find them by 5-digit code, @username, or email.
 */
export async function syncUserProfileToFirestore(
  user: User | null,
  username: string,
  fiveDigitCode: string,
  focusMinutesThisWeek: number,
  totalFocusMinutes: number,
  streak: number,
  upcomingExamsCount = 0,
  status: "online" | "studying" | "offline" = "online"
): Promise<void> {
  if (!user || !user.uid) return;

  const cleanHandle = username.startsWith("@") ? username : `@${username}`;
  const valid5DigitCode = (/^\d{5}$/.test(fiveDigitCode)) ? fiveDigitCode : generateFiveDigitCode(user.uid);
  const currentWeek = getCurrentWeekIdentifier();

  const profileData: UserPublicProfile = {
    uid: user.uid,
    username: cleanHandle.toLowerCase(),
    rawUsername: cleanHandle,
    displayName: user.displayName || cleanHandle.replace("@", ""),
    email: user.email ? user.email.toLowerCase() : "",
    fiveDigitCode: valid5DigitCode,
    inviteCode: valid5DigitCode,
    focusMinutesThisWeek: Math.max(0, focusMinutesThisWeek || 0),
    currentWeekId: currentWeek,
    totalFocusMinutes: Math.max(0, totalFocusMinutes || 0),
    streak: streak || 0,
    upcomingExamsCount: upcomingExamsCount || 0,
    status,
    updatedAt: serverTimestamp()
  };

  try {
    const profileRef = doc(db, "user_profiles", user.uid);
    await setDoc(profileRef, profileData, { merge: true });
  } catch (err) {
    console.warn("Could not sync user profile to Firestore (using local storage cache):", err);
  }
}

/**
 * Search for an actual student by 5-digit code, @username, or email.
 */
export async function searchRealStudent(
  identifier: string,
  currentUserId?: string
): Promise<UserPublicProfile | null> {
  const clean = identifier.trim();
  if (!clean) return null;

  try {
    const profilesCol = collection(db, "user_profiles");

    // 1. Check exact 5-digit code match
    if (/^\d{5}$/.test(clean)) {
      const codeQuery1 = query(profilesCol, where("fiveDigitCode", "==", clean));
      const codeSnap1 = await getDocs(codeQuery1);
      if (!codeSnap1.empty) {
        return codeSnap1.docs[0].data() as UserPublicProfile;
      }
      const codeQuery2 = query(profilesCol, where("inviteCode", "==", clean));
      const codeSnap2 = await getDocs(codeQuery2);
      if (!codeSnap2.empty) {
        return codeSnap2.docs[0].data() as UserPublicProfile;
      }
    }

    // 2. Check exact username match
    const handleQuery = clean.startsWith("@") ? clean.toLowerCase() : `@${clean.toLowerCase()}`;
    const usernameQuery = query(profilesCol, where("username", "==", handleQuery));
    const userSnap = await getDocs(usernameQuery);
    if (!userSnap.empty) {
      return userSnap.docs[0].data() as UserPublicProfile;
    }

    // 3. Check alphanumeric invite code match
    const altCodeQuery = query(profilesCol, where("inviteCode", "==", clean.toUpperCase()));
    const altCodeSnap = await getDocs(altCodeQuery);
    if (!altCodeSnap.empty) {
      return altCodeSnap.docs[0].data() as UserPublicProfile;
    }

    // 4. Check email match
    if (clean.includes("@") && !clean.startsWith("@")) {
      const emailQuery = query(profilesCol, where("email", "==", clean.toLowerCase()));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        return emailSnap.docs[0].data() as UserPublicProfile;
      }
    }
  } catch (err) {
    console.warn("Error querying student profile in Firestore:", err);
  }

  return null;
}

export async function sendRealFriendRequest(
  currentUser: User | null,
  senderUsername: string,
  senderCodeOrStats: string | { focusMinutesThisWeek?: number; totalFocusMinutes?: number; streak?: number; upcomingExamsCount?: number },
  senderStatsOrTarget?: any,
  targetIdentifier?: any,
  existingFriendsList?: FriendItem[]
): Promise<SendFriendRequestResult> {
  if (!currentUser || !currentUser.uid) {
    return {
      success: false,
      message: "Please sign in with Google or Email to send friend requests to other students."
    };
  }

  let senderCode: string;
  let senderStats: { focusMinutesThisWeek?: number; totalFocusMinutes?: number; streak?: number; upcomingExamsCount?: number };
  let cleanTargetRaw: string;
  let existingFriends: FriendItem[];

  if (typeof senderCodeOrStats === "string") {
    senderCode = senderCodeOrStats;
    senderStats = senderStatsOrTarget || {};
    cleanTargetRaw = typeof targetIdentifier === "string" ? targetIdentifier : "";
    existingFriends = Array.isArray(existingFriendsList) ? existingFriendsList : [];
  } else {
    senderCode = generateFiveDigitCode(currentUser?.uid);
    senderStats = senderCodeOrStats || {};
    cleanTargetRaw = typeof senderStatsOrTarget === "string" ? senderStatsOrTarget : "";
    existingFriends = Array.isArray(targetIdentifier) ? targetIdentifier : [];
  }

  const cleanTarget = cleanTargetRaw.trim();
  if (!cleanTarget) {
    return { success: false, message: "Please enter your friend's 5-digit code or @username." };
  }

  // Prevent sending to self
  const senderHandle = senderUsername.startsWith("@") ? senderUsername.toLowerCase() : `@${senderUsername.toLowerCase()}`;
  const targetHandle = cleanTarget.startsWith("@") ? cleanTarget.toLowerCase() : `@${cleanTarget.toLowerCase()}`;
  if (
    senderHandle === targetHandle || 
    cleanTarget === senderCode || 
    (currentUser.email && cleanTarget.toLowerCase() === currentUser.email.toLowerCase())
  ) {
    return {
      success: false,
      message: "That is your own 5-digit code or handle! Share your code with your friends or family."
    };
  }

  // Check if already friends
  if (
    existingFriends.some(f => 
      f.username.toLowerCase() === targetHandle || 
      (f.fiveDigitCode && f.fiveDigitCode === cleanTarget)
    )
  ) {
    return {
      success: false,
      message: `You are already friends in your study circle!`
    };
  }

  // Look up real student in Firestore
  const targetStudent = await searchRealStudent(cleanTarget, currentUser.uid);
  if (!targetStudent) {
    return {
      success: false,
      message: /^\d{5}$/.test(cleanTarget)
        ? `No student found with 5-digit code "${cleanTarget}". Make sure your friend has opened the app!`
        : `No registered student found with "${cleanTarget}". Check their 5-digit code or @handle.`
    };
  }

  if (targetStudent.uid === currentUser.uid) {
    return {
      success: false,
      message: "That is your own account! Share your 5-digit code with friends."
    };
  }

  // Check if already in existingFriends by UID
  if (existingFriends.some(f => f.id === targetStudent.uid || f.id === `friend_${targetStudent.uid}`)) {
    return {
      success: false,
      message: `${targetStudent.displayName || targetStudent.username} is already your study buddy!`
    };
  }

  // Compose deterministic request ID
  const requestId = `${currentUser.uid}_${targetStudent.uid}`;
  const reqDocRef = doc(db, "friend_requests", requestId);

  try {
    const existingSnap = await getDoc(reqDocRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      if (data.status === "pending") {
        return {
          success: false,
          message: `You already have a pending friend request sent to ${targetStudent.displayName || targetStudent.username}.`
        };
      }
    }

    const newRequestPayload = {
      id: requestId,
      fromUserId: currentUser.uid,
      fromUsername: senderUsername.startsWith("@") ? senderUsername : `@${senderUsername}`,
      fromDisplayName: currentUser.displayName || senderUsername.replace("@", ""),
      fromCode: senderCode,
      fromFocusMinutes: senderStats.focusMinutesThisWeek || 0,
      fromStreak: senderStats.streak || 0,
      upcomingExamsCount: senderStats.upcomingExamsCount || 0,
      toUserId: targetStudent.uid,
      toUsername: targetStudent.rawUsername || targetStudent.username,
      toDisplayName: targetStudent.displayName || targetStudent.username.replace("@", ""),
      toCode: targetStudent.fiveDigitCode || targetStudent.inviteCode || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(reqDocRef, newRequestPayload, { merge: true });

    const localItem: FriendRequestItem = {
      id: requestId,
      fromUserId: currentUser.uid,
      toUserId: targetStudent.uid,
      senderUsername: newRequestPayload.fromUsername,
      senderDisplayName: newRequestPayload.fromDisplayName,
      senderCode: senderCode,
      senderFocusMinutes: newRequestPayload.fromFocusMinutes,
      senderStreak: newRequestPayload.fromStreak,
      upcomingExamsCount: newRequestPayload.upcomingExamsCount,
      sentAt: new Date().toISOString(),
      status: "pending",
      direction: "outgoing"
    };

    return {
      success: true,
      message: `Friend request sent to ${targetStudent.displayName || targetStudent.username} (Code: ${targetStudent.fiveDigitCode || cleanTarget})! They can accept it in their Friends tab.`,
      request: localItem
    };
  } catch (err: any) {
    console.error("Failed to send real friend request:", err);
    return {
      success: false,
      message: `Could not send request: ${err?.message || "Connection issue. Please try again."}`
    };
  }
}

/**
 * Detect any test subject, mock student, or simulated request (e.g. Sarah (Chemistry), Karim M. (Physics), etc.)
 */
export function isTestSubject(item: any): boolean {
  if (!item) return false;
  const id = String(item.id || item.fromUserId || item.uid || "").toLowerCase();
  const username = String(item.username || item.fromUsername || item.senderUsername || "").toLowerCase();
  const displayName = String(item.displayName || item.fromDisplayName || item.senderDisplayName || item.name || "").toLowerCase();

  // Test IDs
  if (
    id.includes("sarah") || 
    id.includes("karim") || 
    id.includes("nour") || 
    id.includes("youssef") || 
    id.includes("mariam") || 
    id.includes("peer_lead") ||
    id.includes("req_sarah")
  ) {
    return true;
  }

  // Test handles
  const testHandles = [
    "sarah_chem", "karim_phys", "nour_sat", "youssef_bio", 
    "mariam_chem", "ziad_nightowl", "lina_grind", "study_lead"
  ];
  if (testHandles.some(h => username.includes(h))) return true;

  // Test names & test subjects
  if (
    displayName.includes("sarah") ||
    displayName.includes("karim") ||
    displayName.includes("nour e") ||
    displayName.includes("youssef t") ||
    displayName.includes("mariam k") ||
    displayName.includes("ziad (") ||
    displayName.includes("lina s")
  ) {
    return true;
  }

  // Parentheses with subject tag (e.g. "(Chemistry)", "(Physics)")
  if (
    displayName.includes("(chemistry)") || 
    displayName.includes("(physics)") || 
    displayName.includes("(math") || 
    displayName.includes("(bio") || 
    displayName.includes("(organic)")
  ) {
    return true;
  }

  return false;
}

/**
 * Subscribe to incoming friend requests for the current user in real time.
 */
export function subscribeToRealFriendRequests(
  userId: string,
  onIncomingChange: (requests: FriendRequestItem[]) => void
): Unsubscribe {
  const reqCol = collection(db, "friend_requests");
  const incomingQuery = query(
    reqCol,
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(
    incomingQuery,
    (snapshot) => {
      const items: FriendRequestItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const reqItem: FriendRequestItem = {
          id: d.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          senderUsername: data.fromUsername || "@student",
          senderDisplayName: data.fromDisplayName || data.fromUsername || "Study Buddy",
          senderAvatarUrl: data.fromAvatarUrl,
          senderCode: data.fromCode,
          senderFocusMinutes: typeof data.fromFocusMinutes === "number" ? data.fromFocusMinutes : 0,
          senderStreak: data.fromStreak || 0,
          upcomingExamsCount: data.upcomingExamsCount || 0,
          sentAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          status: "pending",
          direction: "incoming"
        };

        // If this is a test subject (e.g. Sarah Chemistry), permanently remove from Firestore!
        if (isTestSubject(reqItem) || isTestSubject(data)) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          items.push(reqItem);
        }
      });
      onIncomingChange(items);
    },
    (err) => {
      console.warn("Real-time friend requests listener error:", err);
    }
  );
}

/**
 * Subscribe to outgoing friend requests that were accepted by friends/family.
 * Automatically adds the accepted friend to the sender's friend list!
 */
export function subscribeToAcceptedFriendRequests(
  userId: string,
  onFriendAccepted: (friend: FriendItem) => void
): Unsubscribe {
  const reqCol = collection(db, "friend_requests");
  const acceptedQuery = query(
    reqCol,
    where("fromUserId", "==", userId),
    where("status", "==", "accepted")
  );

  return onSnapshot(
    acceptedQuery,
    (snapshot) => {
      snapshot.forEach((d) => {
        const data = d.data();
        const friend: FriendItem = {
          id: data.toUserId || `friend_${d.id}`,
          username: data.toUsername || "@friend",
          displayName: data.toDisplayName || "Study Buddy",
          fiveDigitCode: data.toCode,
          focusMinutesThisWeek: typeof data.toFocusMinutes === "number" ? data.toFocusMinutes : 0,
          streak: data.toStreak || 1,
          upcomingExamsCount: 0,
          status: "online",
          addedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
        };
        onFriendAccepted(friend);
      });
    },
    (err) => {
      console.warn("Accepted friend requests listener notice:", err);
    }
  );
}

/**
 * Accept a friend request: updates the Firestore document to 'accepted'
 * and returns the new FriendItem.
 */
export async function acceptRealFriendRequest(
  requestId: string,
  requestItem: FriendRequestItem,
  currentUserId?: string,
  currentUserStats?: { focusMinutesThisWeek: number; streak: number; fiveDigitCode?: string; displayName?: string; username?: string }
): Promise<FriendItem> {
  if (currentUserId) {
    try {
      const reqRef = doc(db, "friend_requests", requestId);
      await updateDoc(reqRef, {
        status: "accepted",
        toFocusMinutes: currentUserStats?.focusMinutesThisWeek || 0,
        toStreak: currentUserStats?.streak || 0,
        toCode: currentUserStats?.fiveDigitCode || "",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not update friend request status in Firestore:", err);
    }
  }

  const newFriend: FriendItem = {
    id: requestItem.fromUserId || "friend_" + (requestItem.id || Date.now()),
    username: requestItem.senderUsername,
    displayName: requestItem.senderDisplayName || requestItem.senderUsername.replace("@", ""),
    avatarUrl: requestItem.senderAvatarUrl,
    fiveDigitCode: requestItem.senderCode,
    focusMinutesThisWeek: requestItem.senderFocusMinutes || 0,
    streak: requestItem.senderStreak || 1,
    upcomingExamsCount: requestItem.upcomingExamsCount || 0,
    status: "online",
    addedAt: new Date().toISOString()
  };

  return newFriend;
}

/**
 * Decline a friend request.
 */
export async function declineRealFriendRequest(
  requestId: string,
  currentUserId?: string
): Promise<void> {
  if (currentUserId) {
    try {
      const reqRef = doc(db, "friend_requests", requestId);
      await updateDoc(reqRef, {
        status: "declined",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not decline friend request in Firestore:", err);
    }
  }
}

/**
 * Create a new collaborative Study Room with 5-digit room code in Firestore.
 */
export async function createStudyRoomInFirestore(
  currentUser: User | null,
  roomName: string,
  subject: string,
  weeklyGoalMinutes: number,
  currentUserStats: { username: string; displayName: string; fiveDigitCode: string; focusMinutesThisWeek: number; streak: number }
): Promise<FriendGroup> {
  const roomId = "room_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const roomCode = generateFiveDigitCode(roomId);

  const creatorMember: FriendGroupMember = {
    id: currentUser?.uid || "user_creator",
    username: currentUserStats.username,
    displayName: currentUserStats.displayName,
    fiveDigitCode: currentUserStats.fiveDigitCode,
    focusMinutesThisWeek: currentUserStats.focusMinutesThisWeek || 0,
    streak: currentUserStats.streak || 0,
    isCurrentUser: true,
    status: "online",
    role: "admin"
  };

  const newRoom: FriendGroup = {
    id: roomId,
    name: roomName.trim(),
    subject: subject.trim() || "General Study Room",
    description: `Study room code: ${roomCode}`,
    code: roomCode,
    weeklyGoalMinutes: weeklyGoalMinutes || 1200,
    creatorId: currentUser?.uid || "local_user",
    creatorName: currentUserStats.displayName,
    memberIds: [currentUser?.uid || "local_user"],
    members: [creatorMember],
    createdAt: new Date().toISOString(),
    isCustom: true
  };

  if (currentUser?.uid) {
    try {
      const roomRef = doc(db, "study_rooms", roomId);
      await setDoc(roomRef, {
        ...newRoom,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not save study room to Firestore:", err);
    }
  }

  return newRoom;
}

/**
 * Add a friend/person to a Study Room.
 */
export async function addPersonToStudyRoomInFirestore(
  roomId: string,
  friendToAdd: FriendItem | UserPublicProfile,
  existingRoom: FriendGroup
): Promise<FriendGroup> {
  const memberId: string = (friendToAdd as any).uid || (friendToAdd as any).id || "user_" + Math.random().toString(36).substring(2, 7);
  const newMember: FriendGroupMember = {
    id: memberId,
    username: friendToAdd.username,
    displayName: friendToAdd.displayName,
    fiveDigitCode: (friendToAdd as any).fiveDigitCode,
    focusMinutesThisWeek: (friendToAdd as any).focusMinutesThisWeek || 0,
    streak: friendToAdd.streak || 1,
    status: (friendToAdd as any).status || "online",
    role: "member"
  };

  // Avoid duplicates
  const updatedMembers = [
    ...existingRoom.members.filter(m => m.id !== newMember.id && m.username.toLowerCase() !== newMember.username.toLowerCase()),
    newMember
  ];
  const updatedMemberIds = Array.from(new Set([...(existingRoom.memberIds || []), newMember.id]));

  const updatedRoom: FriendGroup = {
    ...existingRoom,
    members: updatedMembers,
    memberIds: updatedMemberIds
  };

  try {
    const roomRef = doc(db, "study_rooms", roomId);
    await updateDoc(roomRef, {
      members: updatedMembers,
      memberIds: updatedMemberIds,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Could not update study room members in Firestore:", err);
  }

  return updatedRoom;
}

/**
 * Join a Study Room using its 5-digit room code.
 */
export async function joinStudyRoomByCode(
  roomCode: string,
  currentUser: User | null,
  currentUserStats: { username: string; displayName: string; fiveDigitCode: string; focusMinutesThisWeek: number; streak: number }
): Promise<FriendGroup | null> {
  const cleanCode = roomCode.trim();
  if (!cleanCode) return null;

  try {
    const roomsCol = collection(db, "study_rooms");
    const q = query(roomsCol, where("code", "==", cleanCode));
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    const roomDoc = snap.docs[0];
    const roomData = roomDoc.data() as FriendGroup;

    const currentMember: FriendGroupMember = {
      id: currentUser?.uid || "user_joiner",
      username: currentUserStats.username,
      displayName: currentUserStats.displayName,
      fiveDigitCode: currentUserStats.fiveDigitCode,
      focusMinutesThisWeek: currentUserStats.focusMinutesThisWeek || 0,
      streak: currentUserStats.streak || 0,
      isCurrentUser: true,
      status: "online",
      role: "member"
    };

    const existingMembers = roomData.members || [];
    const updatedMembers = [
      ...existingMembers.filter(m => m.id !== currentMember.id && m.username.toLowerCase() !== currentMember.username.toLowerCase()),
      currentMember
    ];
    const updatedMemberIds = Array.from(new Set([...(roomData.memberIds || []), currentMember.id]));

    await updateDoc(roomDoc.ref, {
      members: updatedMembers,
      memberIds: updatedMemberIds,
      updatedAt: serverTimestamp()
    });

    return {
      ...roomData,
      id: roomDoc.id,
      members: updatedMembers,
      memberIds: updatedMemberIds
    };
  } catch (err) {
    console.warn("Could not join study room by code:", err);
    return null;
  }
}

/**
 * Subscribe to study rooms the user is participating in.
 */
export function subscribeToUserStudyRooms(
  userId: string,
  onRoomsUpdate: (rooms: FriendGroup[]) => void
): Unsubscribe {
  const roomsCol = collection(db, "study_rooms");
  const q = query(roomsCol, where("memberIds", "array-contains", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const rooms: FriendGroup[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as FriendGroup;
        rooms.push({
          ...data,
          id: d.id,
          members: data.members || []
        });
      });
      if (rooms.length > 0) {
        onRoomsUpdate(rooms);
      }
    },
    (err) => {
      console.warn("Study rooms subscription notice:", err);
    }
  );
}
