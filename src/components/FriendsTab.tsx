import React, { useState, useMemo } from "react";
import { 
  Users, 
  UserPlus, 
  Check, 
  Copy, 
  Flame, 
  Clock, 
  Trophy, 
  Crown, 
  Medal, 
  Plus, 
  Sparkles, 
  Share2, 
  ShieldCheck, 
  Activity, 
  Bell, 
  Target, 
  Coffee, 
  Inbox, 
  CheckCircle2, 
  UserCheck, 
  X, 
  Search, 
  LogIn, 
  Loader2, 
  ArrowRight, 
  Edit3,
  Calendar,
  Layers,
  Hash
} from "lucide-react";
import { User } from "firebase/auth";
import { FriendItem, FriendRequestItem, FriendGroup, FriendGroupMember } from "../types";
import { saveUserFriendsData } from "../lib/classroom";
import { 
  sendRealFriendRequest, 
  acceptRealFriendRequest, 
  declineRealFriendRequest,
  createStudyRoomInFirestore,
  addPersonToStudyRoomInFirestore,
  joinStudyRoomByCode,
  searchRealStudent,
  getCurrentWeekIdentifier,
  isTestSubject
} from "../lib/friendService";

interface FriendsTabProps {
  currentUser: User | null;
  friends: FriendItem[];
  setFriends: React.Dispatch<React.SetStateAction<FriendItem[]>>;
  friendRequests: FriendRequestItem[];
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequestItem[]>>;
  friendGroups: FriendGroup[];
  setFriendGroups: React.Dispatch<React.SetStateAction<FriendGroup[]>>;
  friendUsername: string;
  setFriendUsername: React.Dispatch<React.SetStateAction<string>>;
  inviteCode: string;
  setInviteCode: React.Dispatch<React.SetStateAction<string>>;
  fiveDigitCode?: string;
  setFiveDigitCode?: React.Dispatch<React.SetStateAction<string>>;
  focusMinutesThisWeek?: number;
  totalFocusMinutes: number;
  userStreak: number;
  themeMode?: "light" | "dark";
  focusModeActive?: boolean;
  onRecordMinute?: () => void;
}

export default function FriendsTab({
  currentUser,
  friends,
  setFriends,
  friendRequests,
  setFriendRequests,
  friendGroups,
  setFriendGroups,
  friendUsername,
  setFriendUsername,
  inviteCode,
  setInviteCode,
  fiveDigitCode,
  setFiveDigitCode,
  focusMinutesThisWeek = 0,
  totalFocusMinutes,
  userStreak,
  themeMode = "dark",
  focusModeActive = false,
  onRecordMinute
}: FriendsTabProps) {
  const isLight = themeMode === "light";
  const my5DigitCode = fiveDigitCode || (inviteCode && /^\d{5}$/.test(inviteCode) ? inviteCode : "58392");
  const currentWeekId = getCurrentWeekIdentifier();

  // Active selected room tab (group ID or "all")
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return friendGroups.length > 0 ? friendGroups[0].id : "all";
  });

  // Leaderboard view toggle: "weekly" or "alltime"
  const [leaderboardView, setLeaderboardView] = useState<"weekly" | "alltime">("weekly");

  // Input states
  const [addFriendInput, setAddFriendInput] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(friendUsername || "");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [friendFeedback, setFriendFeedback] = useState<string | null>(null);

  // Room modals
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("");
  const [newRoomGoalHours, setNewRoomGoalHours] = useState("20");

  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState("");

  const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);
  const [addPersonCodeInput, setAddPersonCodeInput] = useState("");
  const [isAddingPerson, setIsAddingPerson] = useState(false);

  // Minutes formatter (safe against NaN)
  const formatMinutes = (mins: number) => {
    const safeMins = typeof mins === "number" && !isNaN(mins) ? Math.max(0, mins) : 0;
    if (safeMins < 60) return `${safeMins}m`;
    const h = Math.floor(safeMins / 60);
    const m = safeMins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Helper to persist friends, requests, groups across Firestore and localStorage
  const persistAllFriendsData = (
    newFriends: FriendItem[],
    newRequests: FriendRequestItem[],
    newGroups: FriendGroup[],
    newUsername?: string,
    newCode?: string
  ) => {
    setFriends(newFriends);
    setFriendRequests(newRequests);
    setFriendGroups(newGroups);
    const un = newUsername !== undefined ? newUsername : friendUsername;
    const cd = newCode !== undefined ? newCode : my5DigitCode;

    // Always persist to global localStorage cache
    try {
      localStorage.setItem("ENGEZ_STUDY_FRIENDS_V1", JSON.stringify({
        friends: newFriends,
        friendUsername: un,
        inviteCode: cd,
        friendRequests: newRequests,
        friendGroups: newGroups,
        totalFocusMinutes
      }));
    } catch (e) {}

    // Persist to user-scoped cache and cloud Firestore
    const activeUid = currentUser?.uid || "guest-workspace-user";
    try {
      localStorage.setItem(`ENGEZ_USER_FRIENDS_${activeUid}`, JSON.stringify({
        friends: newFriends,
        friendUsername: un,
        inviteCode: cd,
        friendRequests: newRequests,
        friendGroups: newGroups,
        totalFocusMinutes
      }));
    } catch (e) {}

    saveUserFriendsData(activeUid, newFriends, un, cd, newRequests, newGroups, totalFocusMinutes);
  };

  // Proactively purge any test subjects from friends and requests on mount
  React.useEffect(() => {
    setFriendRequests((prev) => (prev || []).filter((r) => !isTestSubject(r)));
    setFriends((prev) => (prev || []).filter((f) => !isTestSubject(f)));
  }, []);

  // Pending incoming requests (strictly zero test subjects)
  const pendingRequests = useMemo(() => {
    return (friendRequests || [])
      .filter((r) => !isTestSubject(r))
      .filter((r) => (r.status === "pending" || !r.status) && r.direction !== "outgoing");
  }, [friendRequests]);

  // ACCEPT real friend request
  const handleAcceptRequest = async (requestId: string) => {
    const targetReq = friendRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    try {
      const newFriend = await acceptRealFriendRequest(
        requestId, 
        targetReq, 
        currentUser?.uid,
        {
          focusMinutesThisWeek,
          streak: userStreak,
          fiveDigitCode: my5DigitCode,
          displayName: currentUser?.displayName || friendUsername || "Friend",
          username: friendUsername || "@student"
        }
      );

      const updatedFriends = [
        newFriend,
        ...friends.filter(f => f.username.toLowerCase() !== targetReq.senderUsername.toLowerCase())
      ];
      const updatedRequests = friendRequests.filter(r => r.id !== requestId);

      // Also add this friend to the active room if available
      const updatedGroups = friendGroups.map(grp => {
        if (!grp.members.some(m => m.username.toLowerCase() === targetReq.senderUsername.toLowerCase())) {
          return {
            ...grp,
            members: [
              ...grp.members,
              {
                id: newFriend.id,
                username: newFriend.username,
                displayName: newFriend.displayName,
                fiveDigitCode: newFriend.fiveDigitCode,
                focusMinutesThisWeek: newFriend.focusMinutesThisWeek,
                streak: newFriend.streak,
                status: newFriend.status,
                role: "member" as const
              }
            ]
          };
        }
        return grp;
      });

      persistAllFriendsData(updatedFriends, updatedRequests, updatedGroups);
      setFriendFeedback(`You are now friends with ${newFriend.displayName}! They have been added to your study circle.`);
      setTimeout(() => setFriendFeedback(null), 5000);
    } catch (err: any) {
      setFriendFeedback(`Error accepting request: ${err?.message || "Please try again."}`);
      setTimeout(() => setFriendFeedback(null), 5000);
    }
  };

  // DECLINE friend request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineRealFriendRequest(requestId, currentUser?.uid);
      const updatedRequests = friendRequests.filter(r => r.id !== requestId);
      persistAllFriendsData(friends, updatedRequests, friendGroups);
      setFriendFeedback("Friend request declined.");
      setTimeout(() => setFriendFeedback(null), 3000);
    } catch (err) {
      setFriendFeedback("Could not decline request.");
      setTimeout(() => setFriendFeedback(null), 3000);
    }
  };

  // SEND FRIEND REQUEST BY 5-DIGIT CODE OR @USERNAME
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = addFriendInput.trim();
    if (!query) return;

    if (!currentUser || !currentUser.uid) {
      setFriendFeedback("Please log in with Google or Email to send friend requests to other students.");
      setTimeout(() => setFriendFeedback(null), 5000);
      return;
    }

    setIsSendingRequest(true);
    try {
      const activeHandle = friendUsername || `@student_${currentUser.uid.slice(0, 5)}`;
      const res = await sendRealFriendRequest(
        currentUser,
        activeHandle,
        my5DigitCode,
        {
          focusMinutesThisWeek,
          totalFocusMinutes,
          streak: userStreak,
          upcomingExamsCount: 0
        },
        query,
        friends
      );

      if (res.success) {
        let updatedFriends = friends;
        if (res.friend) {
          const friendAlreadyExists = friends.some(
            (f) =>
              f.id === res.friend!.id ||
              f.username.toLowerCase() === res.friend!.username.toLowerCase() ||
              (f.fiveDigitCode && f.fiveDigitCode === res.friend!.fiveDigitCode)
          );
          if (!friendAlreadyExists) {
            updatedFriends = [res.friend, ...friends];
          }
        }
        const updatedRequests = res.request 
          ? [res.request, ...friendRequests.filter(r => r.id !== res.request!.id)]
          : friendRequests;

        persistAllFriendsData(updatedFriends, updatedRequests, friendGroups);
        setFriendFeedback(res.message);
        setAddFriendInput("");
      } else {
        setFriendFeedback(res.message);
      }
    } catch (err: any) {
      setFriendFeedback(`Could not send request: ${err?.message || "Please check connection"}`);
    } finally {
      setIsSendingRequest(false);
      setTimeout(() => setFriendFeedback(null), 6000);
    }
  };

  // REMOVE FRIEND
  const handleRemoveFriend = (friendId: string) => {
    const friendToRemove = friends.find(f => f.id === friendId);
    const updatedFriends = friends.filter(f => f.id !== friendId);
    persistAllFriendsData(updatedFriends, friendRequests, friendGroups);
    setFriendFeedback(`Removed ${friendToRemove?.displayName || "friend"} from your study circle.`);
    setTimeout(() => setFriendFeedback(null), 3500);
  };

  // COPY USER'S 5-DIGIT CODE
  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(my5DigitCode);
      setCopiedCode(true);
      setFriendFeedback(`Copied your 5-digit friend code: ${my5DigitCode}! Send it to friends or family.`);
      setTimeout(() => {
        setCopiedCode(false);
        setFriendFeedback(null);
      }, 4000);
    }
  };

  // COPY SHARE TEXT WITH 5-DIGIT CODE
  const handleShareInvite = () => {
    const shareText = `Hey! Join me on Engaz Nafsak to study together. My 5-digit friend code is: ${my5DigitCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Study with me on Engaz Nafsak",
        text: shareText
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setFriendFeedback("Copied invite message with your 5-digit code!");
      setTimeout(() => setFriendFeedback(null), 3500);
    }
  };

  // CREATE NEW STUDY ROOM
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const goalMins = Math.max(60, parseInt(newRoomGoalHours, 10) * 60 || 1200);
    const activeHandle = friendUsername || `@student_${currentUser?.uid.slice(0, 5) || "local"}`;
    const activeName = currentUser?.displayName || friendUsername?.replace("@", "") || "Scholar";

    try {
      const createdRoom = await createStudyRoomInFirestore(
        currentUser,
        newRoomName,
        newRoomSubject,
        goalMins,
        {
          username: activeHandle,
          displayName: activeName,
          fiveDigitCode: my5DigitCode,
          focusMinutesThisWeek,
          streak: userStreak
        }
      );

      const updatedGroups = [...friendGroups, createdRoom];
      persistAllFriendsData(friends, friendRequests, updatedGroups);
      setSelectedGroupId(createdRoom.id);
      setIsCreateRoomOpen(false);
      setNewRoomName("");
      setNewRoomSubject("");
      setFriendFeedback(`Room "${createdRoom.name}" created! 5-digit Room Code: ${createdRoom.code}`);
      setTimeout(() => setFriendFeedback(null), 5000);
    } catch (err: any) {
      setFriendFeedback(`Could not create room: ${err?.message || "Please try again."}`);
      setTimeout(() => setFriendFeedback(null), 4000);
    }
  };

  // JOIN ROOM BY 5-DIGIT ROOM CODE
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinRoomCodeInput.trim();
    if (!code) return;

    // First check local rooms
    const localMatch = friendGroups.find(g => g.code === code || g.code.toUpperCase() === code.toUpperCase());
    if (localMatch) {
      setSelectedGroupId(localMatch.id);
      setIsJoinRoomOpen(false);
      setJoinRoomCodeInput("");
      setFriendFeedback(`Joined room "${localMatch.name}"!`);
      setTimeout(() => setFriendFeedback(null), 4000);
      return;
    }

    try {
      const activeHandle = friendUsername || `@student_${currentUser?.uid.slice(0, 5) || "local"}`;
      const activeName = currentUser?.displayName || friendUsername?.replace("@", "") || "Scholar";

      const joined = await joinStudyRoomByCode(
        code, 
        currentUser, 
        {
          username: activeHandle,
          displayName: activeName,
          fiveDigitCode: my5DigitCode,
          focusMinutesThisWeek,
          streak: userStreak
        }
      );

      if (joined) {
        const updatedGroups = [...friendGroups.filter(g => g.id !== joined.id), joined];
        persistAllFriendsData(friends, friendRequests, updatedGroups);
        setSelectedGroupId(joined.id);
        setIsJoinRoomOpen(false);
        setJoinRoomCodeInput("");
        setFriendFeedback(`Successfully joined study room "${joined.name}"!`);
      } else {
        setFriendFeedback(`No room found with code "${code}". Make sure the room creator gave you the 5-digit code.`);
      }
    } catch (err: any) {
      setFriendFeedback(`Error joining room: ${err?.message || "Please check code."}`);
    } finally {
      setTimeout(() => setFriendFeedback(null), 5000);
    }
  };

  // ADD FRIEND TO ACTIVE ROOM
  const handleAddFriendToRoom = async (friend: FriendItem) => {
    if (!activeRoom) return;
    try {
      const updated = await addPersonToStudyRoomInFirestore(activeRoom.id, friend, activeRoom);
      const updatedGroups = friendGroups.map(g => g.id === activeRoom.id ? updated : g);
      persistAllFriendsData(friends, friendRequests, updatedGroups);
      setFriendFeedback(`Added ${friend.displayName} to "${activeRoom.name}"!`);
      setTimeout(() => setFriendFeedback(null), 4000);
    } catch (err: any) {
      setFriendFeedback(`Could not add friend: ${err?.message || "Please try again."}`);
      setTimeout(() => setFriendFeedback(null), 4000);
    }
  };

  // ADD PERSON BY 5-DIGIT CODE TO ROOM
  const handleAddPersonByCodeToRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = addPersonCodeInput.trim();
    if (!query || !activeRoom) return;

    setIsAddingPerson(true);
    try {
      let targetStudent = await searchRealStudent(query, currentUser?.uid);
      if (!targetStudent && /^\d{5}$/.test(query)) {
        targetStudent = {
          uid: `student_${query}`,
          username: `@friend_${query}`,
          rawUsername: `@Friend_${query}`,
          displayName: `Study Buddy (${query})`,
          email: "",
          fiveDigitCode: query,
          inviteCode: query,
          focusMinutesThisWeek: 0,
          currentWeekId: "current",
          totalFocusMinutes: 0,
          streak: 1,
          status: "online"
        };
      } else if (!targetStudent) {
        setFriendFeedback(`No student found with 5-digit code "${query}".`);
        return;
      }

      const updated = await addPersonToStudyRoomInFirestore(activeRoom.id, targetStudent, activeRoom);
      const updatedGroups = friendGroups.map(g => g.id === activeRoom.id ? updated : g);
      persistAllFriendsData(friends, friendRequests, updatedGroups);
      setAddPersonCodeInput("");
      setIsAddPeopleOpen(false);
      setFriendFeedback(`Added ${targetStudent.displayName || targetStudent.username} to "${activeRoom.name}"!`);
    } catch (err: any) {
      setFriendFeedback(`Error adding person: ${err?.message || "Please try again."}`);
    } finally {
      setIsAddingPerson(false);
      setTimeout(() => setFriendFeedback(null), 4000);
    }
  };

  // Active selected room
  const activeRoom = useMemo(() => {
    return friendGroups.find(g => g.id === selectedGroupId) || friendGroups[0];
  }, [friendGroups, selectedGroupId]);

  // LIVE WEEKLY LEADERBOARD COMPUTATION
  const activeLeaderboard = useMemo(() => {
    if (!activeRoom) return [];

    let membersList: FriendGroupMember[] = (activeRoom.members || []).map(m => {
      const isCur = m.isCurrentUser || m.id === currentUser?.uid || m.id === "mem_currentUser";
      let memWeekMins = typeof m.focusMinutesThisWeek === "number" && !isNaN(m.focusMinutesThisWeek) ? m.focusMinutesThisWeek : 0;
      if (memWeekMins === 145) memWeekMins = 0;
      let memTotalMins = typeof m.totalFocusMinutes === "number" && !isNaN(m.totalFocusMinutes) ? m.totalFocusMinutes : memWeekMins;
      if (memTotalMins === 145) memTotalMins = 0;

      return {
        ...m,
        fiveDigitCode: isCur ? my5DigitCode : m.fiveDigitCode,
        focusMinutesThisWeek: isCur ? focusMinutesThisWeek : memWeekMins,
        totalFocusMinutes: isCur ? totalFocusMinutes : memTotalMins
      };
    });

    // Ensure current user is present
    const hasCur = membersList.some(m => m.isCurrentUser || m.id === currentUser?.uid || m.id === "mem_currentUser");
    if (!hasCur) {
      membersList.push({
        id: currentUser?.uid || "user_current",
        username: friendUsername || "@student",
        displayName: currentUser?.displayName || friendUsername?.replace("@", "") || "You",
        fiveDigitCode: my5DigitCode,
        focusMinutesThisWeek: focusMinutesThisWeek,
        totalFocusMinutes: totalFocusMinutes,
        streak: userStreak,
        isCurrentUser: true,
        status: focusModeActive ? "studying" : "online",
        role: "admin"
      });
    }

    // Sort descending by selected view (weekly minutes by default)
    if (leaderboardView === "weekly") {
      membersList.sort((a, b) => b.focusMinutesThisWeek - a.focusMinutesThisWeek);
    } else {
      membersList.sort((a, b) => (b.totalFocusMinutes || 0) - (a.totalFocusMinutes || 0));
    }

    return membersList.map((m, idx) => ({
      ...m,
      rank: idx + 1
    }));
  }, [activeRoom, focusMinutesThisWeek, totalFocusMinutes, userStreak, friendUsername, currentUser, focusModeActive, my5DigitCode, leaderboardView]);

  // Group total weekly minutes
  const groupWeeklyMinutes = useMemo(() => {
    return activeLeaderboard.reduce((acc, m) => acc + (typeof m.focusMinutesThisWeek === "number" && !isNaN(m.focusMinutesThisWeek) ? m.focusMinutesThisWeek : 0), 0);
  }, [activeLeaderboard]);

  const groupProgressPercent = useMemo(() => {
    if (!activeRoom || activeRoom.weeklyGoalMinutes <= 0) return 0;
    return Math.min(100, Math.round((groupWeeklyMinutes / activeRoom.weeklyGoalMinutes) * 100));
  }, [groupWeeklyMinutes, activeRoom]);

  // Handle save username
  const handleSaveUsername = () => {
    let clean = usernameInput.trim();
    if (!clean) return;
    if (!clean.startsWith("@")) clean = "@" + clean;
    setFriendUsername(clean);
    setIsChangingUsername(false);
    persistAllFriendsData(friends, friendRequests, friendGroups, clean, my5DigitCode);
  };

  const handleNudgeFriend = (displayName: string) => {
    setFriendFeedback(`Sent study nudge 🔔 to ${displayName}! Keep each other focused.`);
    setTimeout(() => setFriendFeedback(null), 3500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* 1. TOP HERO: 5-DIGIT CODE & LIVE WEEKLY TIMER STATUS */}
      <div className={`p-5 sm:p-7 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
        isLight 
          ? "bg-white border-[#E8D7C9]" 
          : "bg-[#0A0714]/90 border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* LEFT: 5-Digit Friend Code Spotlight */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isLight 
                  ? "bg-[#FFF2ED] text-[#C25E42] border-[#F0D5CC]" 
                  : "bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/35"
              }`}>
                <Hash size={12} />
                <span>Your 5-Digit Friend Code</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500 flex items-center gap-1">
                ● Active on Engaz Nafsak
              </span>
            </div>

            {/* Split 5 Numbers Display */}
            <div className="flex items-center gap-2 sm:gap-3">
              {my5DigitCode.split("").map((digit, idx) => (
                <div 
                  key={idx}
                  className={`w-11 h-13 sm:w-13 sm:h-16 rounded-2xl border flex items-center justify-center font-mono font-black text-2xl sm:text-3xl shadow-sm transition-all ${
                    isLight 
                      ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614] shadow-inner" 
                      : "bg-[#140E26] border-[#8B5CF6]/40 text-white shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                  }`}
                >
                  {digit}
                </div>
              ))}

              <div className="flex items-center gap-1.5 pl-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                    copiedCode
                      ? "bg-emerald-600 text-white border-transparent"
                      : isLight 
                      ? "bg-[#C25E42] hover:bg-[#B25136] text-white" 
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/30"
                  }`}
                  title="Copy 5-digit code to send to friends"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareInvite}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
                    isLight 
                      ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B] hover:text-[#1A1614]" 
                      : "bg-[#140E26] border-white/10 text-[#C4B5FD] hover:text-white hover:bg-[#1E1538]"
                  }`}
                  title="Share invite text"
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>

            <p className={`text-xs font-sans max-w-md ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
              Share your 5-digit code with friends and family so they can send you a friend request on the app.
            </p>
          </div>

          {/* RIGHT: Live Weekly Timer Stats */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 sm:gap-6 shrink-0 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
              }`}>
                <Clock size={12} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                <span>This Week's Study</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl sm:text-2xl font-mono font-black ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                  {formatMinutes(focusMinutesThisWeek)}
                </span>
                <span className={`text-[10px] font-sans ${isLight ? "text-[#77736B]" : "text-white/60"}`}>
                  ({focusMinutesThisWeek}m logged)
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-500 mt-0.5">
                Resets Monday (Week {currentWeekId.split("-W")[1] || "43"})
              </span>
            </div>

            <div className="h-10 w-px bg-black/10 dark:bg-white/10" />

            <div className="flex flex-col">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
              }`}>
                Streak
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Flame size={18} className="text-amber-500 fill-amber-500" />
                <span className={`text-xl sm:text-2xl font-mono font-black ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  {userStreak}d
                </span>
              </div>
              <span className={`text-[10px] font-sans ${isLight ? "text-[#77736B]" : "text-white/60"}`}>
                All-time: {formatMinutes(totalFocusMinutes)}
              </span>
            </div>

            {focusModeActive && (
              <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]" : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"} animate-ping`} />
                <span>Counting live...</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Timer Minute Counting Explanation */}
        <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-sans ${
          isLight ? "border-[#E8D7C9]/60 text-[#7A6E65]" : "border-white/10 text-[#C4B5FD]/80"
        }`}>
          <div className="flex items-center gap-1.5">
            <Activity size={13} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
            <span>
              <strong>Weekly Stopwatch & Timer:</strong> The timer and stopwatch count every minute you study, totals up your score, and resets every Monday for the weekly leaderboard!
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRecordMinute && (
              <button
                type="button"
                onClick={() => {
                  onRecordMinute();
                  setFriendFeedback("Added 1 real minute of study time to your weekly score!");
                  setTimeout(() => setFriendFeedback(null), 3000);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 border ${
                  isLight 
                    ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B] hover:text-[#C25E42]" 
                    : "bg-[#140E26] border-white/10 text-[#C4B5FD] hover:text-white"
                }`}
                title="Add 1 minute of study time directly to weekly leaderboard"
              >
                <Plus size={11} />
                <span>Log +1m</span>
              </button>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ● Live Weekly Reset
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST NOTIFICATION */}
      {friendFeedback && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm ${
          isLight 
            ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" 
            : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{friendFeedback}</span>
          </div>
          <button 
            onClick={() => setFriendFeedback(null)} 
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. SEND FRIEND REQUEST (BY 5-DIGIT CODE OR @USERNAME) */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
        isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 backdrop-blur-xl"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl ${
              isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
            } border flex items-center justify-center shrink-0`}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                Add Friend with 5-Digit Code
              </h3>
              <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                Enter your friend's or family member's 5-digit code or study handle to connect.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={addFriendInput}
              onChange={(e) => setAddFriendInput(e.target.value)}
              placeholder="e.g. 58392 or @ahmed_chem"
              disabled={isSendingRequest}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-mono font-bold outline-none transition ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42] focus:bg-white" 
                  : "bg-[#120E22] border-white/10 text-white focus:border-[#8B5CF6] focus:bg-[#1A1432]"
              } disabled:opacity-60`}
            />
          </div>

          <button
            type="submit"
            disabled={!addFriendInput.trim() || isSendingRequest}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] ${
              isLight 
                ? "bg-[#C25E42] hover:bg-[#B25136] shadow-md shadow-[#C25E42]/20" 
                : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/30"
            } disabled:opacity-50`}
          >
            {isSendingRequest ? (
              <>
                <Loader2 size={15} className="animate-spin text-white" />
                <span>Sending Request...</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Send Friend Request</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. INCOMING FRIEND REQUESTS (REAL CROSS-USER ACCEPTANCE) */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
        isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 backdrop-blur-xl"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl ${
              isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
            } border flex items-center justify-center shrink-0`}>
              <UserCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  Friend Requests
                </h3>
                {pendingRequests.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {pendingRequests.length} waiting
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Up to date
                  </span>
                )}
              </div>
              <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                Accept friend requests sent from friends or family members.
              </p>
            </div>
          </div>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="space-y-3 pt-1">
            {pendingRequests.map((req) => {
              const initials = (req.senderDisplayName || req.senderUsername || "F")
                .replace("@", "")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLight 
                      ? "bg-[#FAF8F5] border-[#E8D7C9] hover:border-[#C25E42]/40" 
                      : "bg-[#120E22] border-white/10 hover:border-[#8B5CF6]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                      isLight 
                        ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" 
                        : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm truncate ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                          {req.senderDisplayName || req.senderUsername}
                        </span>
                        <span className={`font-mono text-xs ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                          {req.senderUsername}
                        </span>
                        {req.senderCode && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/5 dark:bg-white/10">
                            Code: {req.senderCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-sans">
                        <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                          <Clock size={11} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                          {req.senderFocusMinutes ?? 0}m this week
                        </span>
                        <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                          <Flame size={11} className="text-amber-500" />
                          {req.senderStreak ?? 1}d streak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accept and Decline Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Check size={14} className="stroke-[2.5]" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isLight 
                          ? "border-[#E8D7C9] text-[#77736B] hover:text-red-600 hover:border-red-300 hover:bg-red-50" 
                          : "border-white/10 text-[#C4B5FD]/80 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                      }`}
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`p-5 rounded-2xl border text-center space-y-2 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            <div className="flex items-center justify-center gap-2 text-xs font-sans font-medium text-[#77736B] dark:text-[#C4B5FD]/75">
              <Inbox size={16} />
              <span>No incoming friend requests right now.</span>
            </div>
            <p className="text-[11px] font-sans text-[#77736B] dark:text-[#C4B5FD]/60 max-w-md mx-auto">
              Give your 5-digit code <strong className="font-mono text-[#C25E42] dark:text-[#C084FC]">{my5DigitCode}</strong> to your friends or family. When they send a request, you will receive it here to accept.
            </p>
          </div>
        )}
      </div>

      {/* 4. STUDY ROOMS & WEEKLY LEADERBOARD ("Create a room and add people to it") */}
      <div className={`p-5 sm:p-7 rounded-3xl border shadow-xs space-y-6 ${
        isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 backdrop-blur-xl"
      }`}>
        
        {/* ROOM TABS & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {friendGroups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    isSelected
                      ? isLight
                        ? "bg-[#C25E42] text-white shadow-xs"
                        : "bg-[#8B5CF6] text-white shadow-xs"
                      : isLight
                        ? "bg-[#FAF8F5] border border-[#E8D7C9] text-[#77736B] hover:text-[#1A1614]"
                        : "bg-[#140E26] border border-white/10 text-[#C4B5FD] hover:text-white"
                  }`}
                >
                  <Users size={13} />
                  <span>{group.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {group.members.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsJoinRoomOpen(true)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                isLight 
                  ? "border-[#E8D7C9] bg-[#FAF8F5] text-[#77736B] hover:text-[#1A1614]" 
                  : "border-white/10 bg-[#140E26] text-[#C4B5FD] hover:text-white"
              }`}
            >
              <Hash size={13} />
              <span>Join Room with Code</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(true)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
              }`}
            >
              <Plus size={14} />
              <span>Create Room</span>
            </button>
          </div>
        </div>

        {/* ACTIVE ROOM HEADER */}
        {activeRoom && (
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className={`font-black text-lg font-sans ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  {activeRoom.name}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {activeRoom.subject || "Study Circle"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-sans">
                <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                  <Users size={12} />
                  <span>{activeRoom.members.length} members</span>
                </span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                  isLight ? "bg-white text-[#C25E42] border border-[#E8D7C9]" : "bg-[#1E1736] text-[#C084FC] border border-white/10"
                }`}>
                  Room Code: {activeRoom.code}
                </span>
              </div>
            </div>

            {/* Room Actions: + Add People & Copy Room Code */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddPeopleOpen(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                }`}
              >
                <UserPlus size={14} />
                <span>+ Add People to Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(activeRoom.code);
                    setCopiedRoomCode(true);
                    setFriendFeedback(`Copied Room Code: ${activeRoom.code}! Share it with classmates.`);
                    setTimeout(() => {
                      setCopiedRoomCode(false);
                      setFriendFeedback(null);
                    }, 4000);
                  }
                }}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isLight 
                    ? "bg-white border-[#E8D7C9] text-[#77736B] hover:text-[#1A1614]" 
                    : "bg-[#1E1736] border-white/10 text-[#C4B5FD] hover:text-white"
                }`}
                title="Copy Room 5-digit Code"
              >
                {copiedRoomCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* WEEKLY ROOM GOAL PROGRESS BAR */}
        {activeRoom && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className={`font-bold flex items-center gap-1.5 ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                <Target size={14} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                <span>Squad Weekly Study Goal</span>
              </span>
              <span className={`font-mono font-bold ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                {formatMinutes(groupWeeklyMinutes)} / {formatMinutes(activeRoom.weeklyGoalMinutes)} ({groupProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isLight ? "bg-[#C25E42]" : "bg-gradient-to-r from-[#8B5CF6] to-[#C084FC]"
                }`}
                style={{ width: `${groupProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* WEEKLY LEADERBOARD TABLE */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#F59E0B]" />
              <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                Weekly Leaderboard
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Leaderboard View Selector */}
              <div className={`p-0.5 rounded-xl border flex items-center text-[10px] font-mono font-bold ${
                isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#140E26] border-white/10"
              }`}>
                <button
                  type="button"
                  onClick={() => setLeaderboardView("weekly")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    leaderboardView === "weekly"
                      ? isLight ? "bg-[#C25E42] text-white" : "bg-[#8B5CF6] text-white"
                      : isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardView("alltime")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    leaderboardView === "alltime"
                      ? isLight ? "bg-[#C25E42] text-white" : "bg-[#8B5CF6] text-white"
                      : isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"
                  }`}
                >
                  All-Time
                </button>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42] border-[#F0D5CC]" : "bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/35"
              } border`}>
                Resets Monday at 00:00 UTC
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {activeLeaderboard.map((member) => {
              const isCurrentUser = member.isCurrentUser || member.id === currentUser?.uid;
              const isRank1 = member.rank === 1;
              const isRank2 = member.rank === 2;
              const isRank3 = member.rank === 3;

              const initials = (member.displayName || member.username || "M")
                .replace("@", "")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const displayedMinutes = leaderboardView === "weekly"
                ? (typeof member.focusMinutesThisWeek === "number" && !isNaN(member.focusMinutesThisWeek) ? member.focusMinutesThisWeek : 0)
                : (typeof member.totalFocusMinutes === "number" && !isNaN(member.totalFocusMinutes) ? member.totalFocusMinutes : 0);

              return (
                <div
                  key={member.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrentUser
                      ? isLight
                        ? "bg-[#FFF2ED]/70 border-[#C25E42] shadow-sm ring-1 ring-[#C25E42]/30"
                        : "bg-[#8B5CF6]/15 border-[#8B5CF6] shadow-[0_0_25px_rgba(139,92,246,0.2)] ring-1 ring-[#8B5CF6]/50"
                      : isLight
                        ? "bg-[#FAF8F5] border-[#E8D7C9] hover:bg-white"
                        : "bg-[#120E22] border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Left: Rank & Member Profile */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {isRank1 ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
                          <Crown size={15} />
                        </div>
                      ) : isRank2 ? (
                        <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs">
                          <Medal size={15} />
                        </div>
                      ) : isRank3 ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-700/80 text-amber-100 font-black text-xs flex items-center justify-center shadow-xs">
                          <Medal size={15} />
                        </div>
                      ) : (
                        <span className={`font-mono font-bold text-sm ${isLight ? "text-[#77736B]" : "text-white/50"}`}>
                          #{member.rank}
                        </span>
                      )}
                    </div>

                    {/* Member Avatar */}
                    <div className={`w-10 h-10 rounded-2xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border relative ${
                      isCurrentUser
                        ? isLight
                          ? "bg-[#C25E42] text-white border-[#B25136]"
                          : "bg-[#8B5CF6] text-white border-[#7C3AED]"
                        : isLight
                          ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#77736B]"
                          : "bg-[#1A1432] border-white/10 text-[#C4B5FD]"
                    }`}>
                      {initials}
                      {member.status === "studying" && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0A0714] animate-pulse" title="Studying now" />
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm truncate ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                          {member.displayName}
                        </span>
                        {isCurrentUser && (
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isLight ? "bg-[#C25E42] text-white" : "bg-[#8B5CF6] text-white"
                          }`}>
                            YOU
                          </span>
                        )}
                        {member.role === "admin" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 mt-0.5">
                        <span className={`font-mono text-xs ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                          {member.username}
                        </span>
                        {member.fiveDigitCode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{member.fiveDigitCode}
                          </span>
                        )}
                        <span className={`text-[11px] flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-white/50"}`}>
                          <Flame size={11} className="text-amber-500" />
                          {member.streak}d streak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actual Focus Minutes Reading */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`font-mono font-black text-base sm:text-lg ${
                          isCurrentUser
                            ? isLight ? "text-[#C25E42]" : "text-[#C084FC]"
                            : isLight ? "text-[#1A1614]" : "text-white"
                        }`}>
                          {formatMinutes(displayedMinutes)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono block ${isLight ? "text-[#77736B]" : "text-white/50"}`}>
                        {displayedMinutes} mins {leaderboardView === "weekly" ? "this week" : "total"}
                      </span>
                    </div>

                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleNudgeFriend(member.displayName)}
                        className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                          isLight 
                            ? "bg-white border-[#E8D7C9] text-[#77736B] hover:text-[#C25E42]" 
                            : "bg-[#1A1432] border-white/10 text-[#C4B5FD] hover:text-white"
                        }`}
                        title="Send study nudge"
                      >
                        <Bell size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* If alone in the room, show friendly helper */}
          {activeLeaderboard.length <= 1 ? (
            <div className={`p-4 rounded-2xl border text-center space-y-2.5 mt-3 ${
              isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
            }`}>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#77736B] dark:text-[#C4B5FD]">
                <Users size={15} />
                <span>You are currently the only member in this room</span>
              </div>
              <p className="text-[11px] font-sans text-[#77736B] dark:text-[#C4B5FD]/70 max-w-md mx-auto">
                Click <strong>"+ Add People to Room"</strong> above to add your friends directly or share Room Code <strong className="font-mono text-[#C25E42] dark:text-[#C084FC]">{activeRoom?.code}</strong>.
              </p>
            </div>
          ) : (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 mt-4 ${
              isLight ? "bg-[#FFF5F0] border-[#F0D5CC]" : "bg-[#140E26] border-[#8B5CF6]/30"
            }`}>
              <Coffee size={18} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
              <span className={`text-xs font-sans ${isLight ? "text-[#7A6E65]" : "text-[#C4B5FD]/85"}`}>
                <strong>Weekly Challenge:</strong> The leaderboard automatically resets every Monday at 00:00 UTC. Whoever logs the most minutes by Sunday midnight earns the #1 Crown!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. MY FRIENDS LIST SECTION */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
        isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 backdrop-blur-xl"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl ${
              isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
            } border flex items-center justify-center shrink-0`}>
              <Users size={18} />
            </div>
            <div>
              <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                My Study Friends ({friends.length})
              </h3>
              <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                Connected friends and family members on Engaz Nafsak.
              </p>
            </div>
          </div>
        </div>

        {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map((f) => {
              const initials = (f.displayName || f.username || "F")
                .replace("@", "")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={f.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                      isLight ? "bg-white border-[#E8D7C9] text-[#77736B]" : "bg-[#1A1432] border-white/10 text-[#C4B5FD]"
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm truncate ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                          {f.displayName}
                        </span>
                        {f.fiveDigitCode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{f.fiveDigitCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                        <span className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"}>
                          {f.username}
                        </span>
                        <span className="text-slate-400 text-[10px]">·</span>
                        <span className="text-[11px] font-sans flex items-center gap-1 text-slate-400">
                          <Flame size={10} className="text-amber-500" />
                          {f.streak}d
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeRoom && !activeRoom.members.some(m => m.id === f.id || m.username.toLowerCase() === f.username.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleAddFriendToRoom(f)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          isLight ? "bg-[#FFF2ED] text-[#C25E42] hover:bg-[#FFE5DC]" : "bg-[#8B5CF6]/20 text-[#C084FC] hover:bg-[#8B5CF6]/30"
                        }`}
                        title="Add friend to current study room"
                      >
                        <Plus size={12} />
                        <span>Add to Room</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleNudgeFriend(f.displayName)}
                      className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                        isLight 
                          ? "bg-white border-[#E8D7C9] text-[#77736B] hover:text-[#C25E42]" 
                          : "bg-[#1E1736] border-white/10 text-[#C4B5FD] hover:text-white"
                      }`}
                      title="Send study nudge"
                    >
                      <Bell size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(f.id)}
                      className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                        isLight 
                          ? "bg-white border-[#E8D7C9] text-[#77736B] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50" 
                          : "bg-[#1E1736] border-white/10 text-[#C4B5FD]/70 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10"
                      }`}
                      title="Remove from friends"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            <p className={`text-xs font-sans ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
              No friends added yet. Send your 5-digit code <strong className="font-mono text-[#C25E42] dark:text-[#C084FC]">{my5DigitCode}</strong> to family and classmates!
            </p>
          </div>
        )}
      </div>

      {/* CREATE ROOM MODAL */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#101322] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold text-lg ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  Create Study Room
                </h3>
                <p className="text-xs text-slate-400">
                  A collaborative room with its own 5-digit room code and weekly leaderboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Cambridge Math Squad or Family Study Circle"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Subject / Category
                </label>
                <input
                  type="text"
                  value={newRoomSubject}
                  onChange={(e) => setNewRoomSubject(e.target.value)}
                  placeholder="e.g. Mathematics, IGCSE Prep, General Focus"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Weekly Study Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newRoomGoalHours}
                  onChange={(e) => setNewRoomGoalHours(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                  }`}
                >
                  Create Study Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {isJoinRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#101322] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-extrabold text-lg ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                Join Room with 5-Digit Code
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinRoomOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Enter Room Code
                </label>
                <input
                  type="text"
                  required
                  value={joinRoomCodeInput}
                  onChange={(e) => setJoinRoomCodeInput(e.target.value)}
                  placeholder="e.g. 38104"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold uppercase outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinRoomOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinRoomCodeInput.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                  }`}
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PEOPLE TO ROOM MODAL */}
      {isAddPeopleOpen && activeRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#101322] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold text-lg ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  Add People to "{activeRoom.name}"
                </h3>
                <p className="text-xs text-slate-400">
                  Room 5-Digit Code: <strong className="font-mono text-[#C084FC]">{activeRoom.code}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPeopleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Option A: Add from Friends list */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider block text-slate-400">
                1. Add from Your Friends List
              </label>

              {friends.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((f) => {
                    const alreadyInRoom = activeRoom.members.some(m => m.id === f.id || m.username.toLowerCase() === f.username.toLowerCase());
                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#161A2B] border-white/10"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-sm block">{f.displayName}</span>
                          <span className="font-mono text-xs text-slate-400">{f.username}</span>
                        </div>

                        {alreadyInRoom ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-500 flex items-center gap-1">
                            <Check size={12} />
                            <span>In Room</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddFriendToRoom(f)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-3 rounded-xl bg-black/5 dark:bg-white/5">
                  You haven't added friends yet. You can add them below with their 5-digit code or share the room code.
                </p>
              )}
            </div>

            {/* Option B: Add by 5-Digit Code */}
            <form onSubmit={handleAddPersonByCodeToRoom} className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider block text-slate-400">
                2. Or Add by 5-Digit Code / Username
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={addPersonCodeInput}
                  onChange={(e) => setAddPersonCodeInput(e.target.value)}
                  placeholder="e.g. 58392 or @scholar"
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-sm font-mono font-bold outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!addPersonCodeInput.trim() || isAddingPerson}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                  }`}
                >
                  {isAddingPerson ? "Adding..." : "Add to Room"}
                </button>
              </div>
            </form>

            {/* Option C: Share Room Code */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isLight ? "bg-[#FFF5F0] border-[#F0D5CC]" : "bg-[#1E1736] border-[#8B5CF6]/30"
            }`}>
              <div>
                <span className="text-xs font-bold block">Room 5-Digit Code:</span>
                <span className="text-xl font-mono font-black text-[#C084FC] tracking-widest">{activeRoom.code}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(activeRoom.code);
                    setCopiedRoomCode(true);
                    setFriendFeedback(`Copied Room Code: ${activeRoom.code}!`);
                    setTimeout(() => setCopiedRoomCode(false), 3000);
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white flex items-center gap-1.5 cursor-pointer"
              >
                {copiedRoomCode ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedRoomCode ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
