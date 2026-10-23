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
import { FriendItem, FriendRequestItem } from "../types";

export interface UserPublicProfile {
  uid: string;
  username: string; // Lowercase with @, e.g. "@ahmed"
  rawUsername: string; // Original casing, e.g. "@Ahmed"
  displayName: string;
  email: string;
  inviteCode: string;
  totalFocusMinutes: number;
  streak: number;
  upcomingExamsCount?: number;
  updatedAt?: any;
}

export interface SendFriendRequestResult {
  success: boolean;
  message: string;
  request?: FriendRequestItem;
}

/**
 * Register or update the user's public discoverable profile in Firestore.
 * Allows other students to find them by @username, email, or invite code.
 */
export async function syncUserProfileToFirestore(
  user: User | null,
  username: string,
  inviteCode: string,
  totalFocusMinutes: number,
  streak: number,
  upcomingExamsCount = 0
): Promise<void> {
  if (!user || !user.uid) return;

  const cleanHandle = username.startsWith("@") ? username : `@${username}`;
  const profileData: UserPublicProfile = {
    uid: user.uid,
    username: cleanHandle.toLowerCase(),
    rawUsername: cleanHandle,
    displayName: user.displayName || cleanHandle.replace("@", ""),
    email: user.email ? user.email.toLowerCase() : "",
    inviteCode: inviteCode.trim().toUpperCase(),
    totalFocusMinutes: totalFocusMinutes || 0,
    streak: streak || 0,
    upcomingExamsCount: upcomingExamsCount || 0,
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
 * Search for an actual student by @username, invite code, or email.
 */
export async function searchRealStudent(
  identifier: string,
  currentUserId?: string
): Promise<UserPublicProfile | null> {
  const clean = identifier.trim();
  if (!clean) return null;

  try {
    const profilesCol = collection(db, "user_profiles");

    // 1. Check exact username match
    const handleQuery = clean.startsWith("@") ? clean.toLowerCase() : `@${clean.toLowerCase()}`;
    const usernameQuery = query(profilesCol, where("username", "==", handleQuery));
    const userSnap = await getDocs(usernameQuery);
    if (!userSnap.empty) {
      const match = userSnap.docs[0].data() as UserPublicProfile;
      return match;
    }

    // 2. Check invite code match
    const codeQuery = query(profilesCol, where("inviteCode", "==", clean.toUpperCase()));
    const codeSnap = await getDocs(codeQuery);
    if (!codeSnap.empty) {
      const match = codeSnap.docs[0].data() as UserPublicProfile;
      return match;
    }

    // 3. Check email match
    if (clean.includes("@") && !clean.startsWith("@")) {
      const emailQuery = query(profilesCol, where("email", "==", clean.toLowerCase()));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const match = emailSnap.docs[0].data() as UserPublicProfile;
        return match;
      }
    }
  } catch (err) {
    console.warn("Error querying student profile in Firestore:", err);
  }

  return null;
}

/**
 * Send an authentic, live friend request to a real person.
 */
export async function sendRealFriendRequest(
  currentUser: User | null,
  senderUsername: string,
  senderStats: { totalFocusMinutes: number; streak: number; upcomingExamsCount: number },
  targetIdentifier: string,
  existingFriends: FriendItem[]
): Promise<SendFriendRequestResult> {
  if (!currentUser || !currentUser.uid) {
    return {
      success: false,
      message: "Please sign in with Google or Email to send friend requests to other students."
    };
  }

  const cleanTarget = targetIdentifier.trim();
  if (!cleanTarget) {
    return { success: false, message: "Please enter a valid @username, invite code, or student email." };
  }

  // Prevent sending to self
  const senderHandle = senderUsername.startsWith("@") ? senderUsername.toLowerCase() : `@${senderUsername.toLowerCase()}`;
  const targetHandle = cleanTarget.startsWith("@") ? cleanTarget.toLowerCase() : `@${cleanTarget.toLowerCase()}`;
  if (senderHandle === targetHandle || (currentUser.email && cleanTarget.toLowerCase() === currentUser.email.toLowerCase())) {
    return {
      success: false,
      message: "That is your own study handle! Share your invite link with classmates instead."
    };
  }

  // Check if already friends
  if (existingFriends.some(f => f.username.toLowerCase() === targetHandle)) {
    return {
      success: false,
      message: `${targetHandle} is already in your study circle!`
    };
  }

  // Look up real student in Firestore
  const targetStudent = await searchRealStudent(cleanTarget, currentUser.uid);
  if (!targetStudent) {
    return {
      success: false,
      message: `No registered student found with "${cleanTarget}". Make sure they have signed in and set up their study profile!`
    };
  }

  if (targetStudent.uid === currentUser.uid) {
    return {
      success: false,
      message: "That is your own study account! Share your invite code with friends."
    };
  }

  // Compose deterministic request ID
  const requestId = `${currentUser.uid}_${targetStudent.uid}`;
  const reqDocRef = doc(db, "friend_requests", requestId);

  try {
    // Check if request already exists
    const existingSnap = await getDoc(reqDocRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      if (data.status === "pending") {
        return {
          success: false,
          message: `You already have a pending friend request sent to ${targetStudent.rawUsername || targetStudent.username}.`
        };
      }
    }

    const newRequestPayload = {
      id: requestId,
      fromUserId: currentUser.uid,
      fromUsername: senderUsername.startsWith("@") ? senderUsername : `@${senderUsername}`,
      fromDisplayName: currentUser.displayName || senderUsername.replace("@", ""),
      fromFocusMinutes: senderStats.totalFocusMinutes || 0,
      fromStreak: senderStats.streak || 0,
      upcomingExamsCount: senderStats.upcomingExamsCount || 0,
      toUserId: targetStudent.uid,
      toUsername: targetStudent.rawUsername || targetStudent.username,
      toDisplayName: targetStudent.displayName || targetStudent.username.replace("@", ""),
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(reqDocRef, newRequestPayload, { merge: true });

    const localItem: FriendRequestItem = {
      id: requestId,
      senderUsername: newRequestPayload.fromUsername,
      senderDisplayName: newRequestPayload.fromDisplayName,
      senderFocusMinutes: newRequestPayload.fromFocusMinutes,
      senderStreak: newRequestPayload.fromStreak,
      upcomingExamsCount: newRequestPayload.upcomingExamsCount,
      sentAt: new Date().toISOString(),
      status: "pending",
      direction: "outgoing"
    };

    return {
      success: true,
      message: `Friend request successfully sent to ${targetStudent.displayName || targetStudent.username}! They will see it in real time when they log in.`,
      request: localItem
    };
  } catch (err: any) {
    console.error("Failed to send real friend request:", err);
    return {
      success: false,
      message: `Could not send request: ${err?.message || "Firestore connection error. Please try again."}`
    };
  }
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
        items.push({
          id: d.id,
          senderUsername: data.fromUsername || "@student",
          senderDisplayName: data.fromDisplayName || data.fromUsername || "Study Buddy",
          senderAvatarUrl: data.fromAvatarUrl,
          senderFocusMinutes: data.fromFocusMinutes || 0,
          senderStreak: data.fromStreak || 0,
          upcomingExamsCount: data.upcomingExamsCount || 0,
          sentAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          status: "pending",
          direction: "incoming"
        });
      });
      onIncomingChange(items);
    },
    (err) => {
      console.warn("Real-time friend requests listener error:", err);
    }
  );
}

/**
 * Accept a real friend request: updates the Firestore document and yields new FriendItem.
 */
export async function acceptRealFriendRequest(
  requestId: string,
  requestItem: FriendRequestItem,
  currentUserId?: string
): Promise<FriendItem> {
  // Update Firestore record if user is authenticated
  if (currentUserId) {
    try {
      const reqRef = doc(db, "friend_requests", requestId);
      await updateDoc(reqRef, {
        status: "accepted",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not update friend request status in Firestore:", err);
    }
  }

  const newFriend: FriendItem = {
    id: "friend_" + (requestItem.id || Date.now()),
    username: requestItem.senderUsername,
    displayName: requestItem.senderDisplayName || requestItem.senderUsername.replace("@", ""),
    avatarUrl: requestItem.senderAvatarUrl,
    focusMinutesThisWeek: requestItem.senderFocusMinutes || 0,
    streak: requestItem.senderStreak || 1,
    upcomingExamsCount: requestItem.upcomingExamsCount || 0,
    status: "online",
    addedAt: new Date().toISOString()
  };

  return newFriend;
}

/**
 * Decline a real friend request.
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
