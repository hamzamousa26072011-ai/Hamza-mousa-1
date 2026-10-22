import React, { useState, useMemo } from "react";
import { User } from "firebase/auth";
import { 
  Users, 
  Trophy, 
  Flame, 
  Clock, 
  Check, 
  X, 
  Plus, 
  Copy, 
  Sparkles, 
  UserCheck, 
  UserPlus, 
  Coffee, 
  ArrowRight, 
  Share2, 
  Edit3, 
  Target, 
  Bell, 
  Shield, 
  Layers, 
  Crown,
  Medal,
  CheckCircle2,
  Inbox
} from "lucide-react";
import { FriendItem, FriendRequestItem, FriendGroup, FriendGroupMember } from "../types";
import { saveUserFriendsData } from "../lib/classroom";

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
  totalFocusMinutes,
  userStreak,
  themeMode = "dark",
  focusModeActive = false,
  onRecordMinute
}: FriendsTabProps) {
  const isLight = themeMode === "light";

  // Active selected group tab (group ID or "all")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("igcse_achievers");

  // Input states
  const [addFriendInput, setAddFriendInput] = useState("");
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(friendUsername || "");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedGroupCode, setCopiedGroupCode] = useState(false);
  const [friendFeedback, setFriendFeedback] = useState<string | null>(null);

  // Group creation modal state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSubject, setNewGroupSubject] = useState("");
  const [newGroupGoalHours, setNewGroupGoalHours] = useState("20");

  // Join group input state
  const [joinGroupCodeInput, setJoinGroupCodeInput] = useState("");
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);

  // Format focus minutes to "Xh Ym" or "Xm"
  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Helper to persist friends, requests, groups
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
    const cd = newCode !== undefined ? newCode : inviteCode;
    if (currentUser?.uid) {
      saveUserFriendsData(currentUser.uid, newFriends, un, cd, newRequests, newGroups, totalFocusMinutes);
    }
  };

  // Pending incoming requests
  const pendingRequests = useMemo(() => {
    return (friendRequests || []).filter(r => r.status === "pending" || !r.status);
  }, [friendRequests]);

  // Option to ACCEPT friend request
  const handleAcceptRequest = (requestId: string) => {
    const targetReq = friendRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    const newFriend: FriendItem = {
      id: "friend_" + Date.now(),
      username: targetReq.senderUsername,
      displayName: targetReq.senderDisplayName || targetReq.senderUsername.replace("@", ""),
      avatarUrl: targetReq.senderAvatarUrl,
      focusMinutesThisWeek: targetReq.senderFocusMinutes ?? Math.floor(90 + Math.random() * 180),
      streak: targetReq.senderStreak ?? Math.floor(2 + Math.random() * 6),
      upcomingExamsCount: targetReq.upcomingExamsCount ?? 2,
      status: "online",
      addedAt: new Date().toISOString()
    };

    const updatedFriends = [
      newFriend,
      ...friends.filter(f => f.username.toLowerCase() !== targetReq.senderUsername.toLowerCase())
    ];
    const updatedRequests = friendRequests.filter(r => r.id !== requestId);

    // Also add this friend to the active groups as a member
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
    setFriendFeedback(`Accepted study friend request from ${targetReq.senderDisplayName || targetReq.senderUsername}! They are now in your Study Circle.`);
    setTimeout(() => setFriendFeedback(null), 5000);
  };

  // Option to DECLINE friend request
  const handleDeclineRequest = (requestId: string) => {
    const targetReq = friendRequests.find(r => r.id === requestId);
    const updatedRequests = friendRequests.filter(r => r.id !== requestId);
    persistAllFriendsData(friends, updatedRequests, friendGroups);
    if (targetReq) {
      setFriendFeedback(`Declined request from ${targetReq.senderDisplayName || targetReq.senderUsername}.`);
      setTimeout(() => setFriendFeedback(null), 4000);
    }
  };

  // Helper to simulate a new incoming request for testing
  const handleSimulateIncomingRequest = () => {
    const samplePeers = [
      { name: "Omar Farooq", username: "@omar_farooq", mins: 245, streak: 7, exams: 2 },
      { name: "Layla Hassan", username: "@layla_hassan", mins: 180, streak: 4, exams: 4 },
      { name: "Zaid Nabil", username: "@zaid_nabil", mins: 310, streak: 9, exams: 3 },
      { name: "Mariam Taha", username: "@mariam_taha", mins: 140, streak: 3, exams: 1 }
    ];
    const pick = samplePeers[Math.floor(Math.random() * samplePeers.length)];
    const newReq: FriendRequestItem = {
      id: "req_" + Date.now(),
      senderUsername: pick.username,
      senderDisplayName: pick.name,
      senderFocusMinutes: pick.mins,
      senderStreak: pick.streak,
      upcomingExamsCount: pick.exams,
      sentAt: new Date().toISOString(),
      status: "pending",
      direction: "incoming"
    };

    const updatedRequests = [newReq, ...friendRequests.filter(r => r.senderUsername.toLowerCase() !== pick.username.toLowerCase())];
    persistAllFriendsData(friends, updatedRequests, friendGroups);
    setFriendFeedback(`New friend request received from ${pick.name}!`);
    setTimeout(() => setFriendFeedback(null), 4000);
  };

  // Send request / add friend by username
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    let query = addFriendInput.trim();
    if (!query) return;
    if (!query.startsWith("@")) query = "@" + query;

    if (query.toLowerCase() === friendUsername.toLowerCase()) {
      setFriendFeedback("That is your own username! Share your link with friends.");
      return;
    }

    if (friends.some(f => f.username.toLowerCase() === query.toLowerCase())) {
      setFriendFeedback(`${query} is already in your study circle!`);
      return;
    }

    const newFriend: FriendItem = {
      id: "friend_" + Date.now(),
      username: query,
      displayName: query.replace("@", ""),
      focusMinutesThisWeek: Math.floor(60 + Math.random() * 240),
      streak: Math.floor(1 + Math.random() * 8),
      upcomingExamsCount: Math.floor(1 + Math.random() * 4),
      status: Math.random() > 0.5 ? "studying" : "online",
      addedAt: new Date().toISOString()
    };

    const updatedFriends = [newFriend, ...friends];
    // Also add to current active group
    const updatedGroups = friendGroups.map(grp => {
      if (grp.id === selectedGroupId || selectedGroupId === "all") {
        return {
          ...grp,
          members: [
            ...grp.members,
            {
              id: newFriend.id,
              username: newFriend.username,
              displayName: newFriend.displayName,
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

    persistAllFriendsData(updatedFriends, friendRequests, updatedGroups);
    setAddFriendInput("");
    setFriendFeedback(`Success! Added ${query} to your study friends leaderboard.`);
    setTimeout(() => setFriendFeedback(null), 4000);
  };

  // Remove a friend
  const handleRemoveFriend = (id: string) => {
    const updatedFriends = friends.filter(f => f.id !== id);
    const updatedGroups = friendGroups.map(grp => ({
      ...grp,
      members: grp.members.filter(m => m.id !== id)
    }));
    persistAllFriendsData(updatedFriends, friendRequests, updatedGroups);
  };

  // Nudge friend
  const handleNudgeFriend = (displayName: string) => {
    setFriendFeedback(`Sent study nudge 🔔 to ${displayName}! Keep each other focused.`);
    setTimeout(() => setFriendFeedback(null), 3500);
  };

  // Save new username
  const handleSaveUsername = () => {
    let clean = usernameInput.trim();
    if (!clean) return;
    if (!clean.startsWith("@")) clean = "@" + clean;
    setFriendUsername(clean);
    setIsChangingUsername(false);
    persistAllFriendsData(friends, friendRequests, friendGroups, clean, inviteCode);
  };

  // Copy personal invite
  const inviteUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/friends/join/${inviteCode}` 
    : `https://www.engeznafsak.com/friends/join/${inviteCode}`;

  const handleCopyInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  // Create new group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const goalHours = parseInt(newGroupGoalHours, 10) || 20;
    const newGroup: FriendGroup = {
      id: "grp_" + Date.now(),
      name: newGroupName.trim(),
      subject: newGroupSubject.trim() || "Study Sprint",
      description: `Weekly study battle for ${newGroupName.trim()}`,
      code: "GRP-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      weeklyGoalMinutes: goalHours * 60,
      createdAt: new Date().toISOString(),
      isCustom: true,
      members: [
        {
          id: currentUser?.uid || "user_current",
          username: friendUsername || "@student",
          displayName: currentUser?.displayName || friendUsername || "You",
          focusMinutesThisWeek: totalFocusMinutes,
          streak: userStreak,
          isCurrentUser: true,
          status: focusModeActive ? "studying" : "online",
          role: "admin"
        },
        ...friends.slice(0, 3).map(f => ({
          id: f.id,
          username: f.username,
          displayName: f.displayName,
          focusMinutesThisWeek: f.focusMinutesThisWeek,
          streak: f.streak,
          status: f.status,
          role: "member" as const
        }))
      ]
    };

    const updatedGroups = [...friendGroups, newGroup];
    persistAllFriendsData(friends, friendRequests, updatedGroups);
    setSelectedGroupId(newGroup.id);
    setIsCreateGroupOpen(false);
    setNewGroupName("");
    setNewGroupSubject("");
    setFriendFeedback(`Created group "${newGroup.name}"! Share code ${newGroup.code} with your friends.`);
    setTimeout(() => setFriendFeedback(null), 5000);
  };

  // Join group by code
  const handleJoinGroupByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinGroupCodeInput.trim().toUpperCase();
    if (!code) return;

    const existingGroup = friendGroups.find(g => g.code.toUpperCase() === code);
    if (existingGroup) {
      setSelectedGroupId(existingGroup.id);
      setIsJoinGroupOpen(false);
      setJoinGroupCodeInput("");
      setFriendFeedback(`Joined group "${existingGroup.name}"!`);
      setTimeout(() => setFriendFeedback(null), 4000);
      return;
    }

    // Create a new joined group representation
    const joinedGroup: FriendGroup = {
      id: "grp_joined_" + Date.now(),
      name: `Study Squad (${code})`,
      subject: "Exam Prep Circle",
      description: `Group joined via code ${code}`,
      code,
      weeklyGoalMinutes: 1200,
      createdAt: new Date().toISOString(),
      isCustom: true,
      members: [
        {
          id: currentUser?.uid || "user_current",
          username: friendUsername || "@student",
          displayName: currentUser?.displayName || friendUsername || "You",
          focusMinutesThisWeek: totalFocusMinutes,
          streak: userStreak,
          isCurrentUser: true,
          status: focusModeActive ? "studying" : "online",
          role: "member"
        },
        {
          id: "peer_lead_" + Date.now(),
          username: "@study_lead",
          displayName: "Group Host",
          focusMinutesThisWeek: Math.floor(180 + Math.random() * 150),
          streak: 8,
          status: "online",
          role: "admin"
        }
      ]
    };

    const updatedGroups = [...friendGroups, joinedGroup];
    persistAllFriendsData(friends, friendRequests, updatedGroups);
    setSelectedGroupId(joinedGroup.id);
    setIsJoinGroupOpen(false);
    setJoinGroupCodeInput("");
    setFriendFeedback(`Success! Joined "${joinedGroup.name}" via code.`);
    setTimeout(() => setFriendFeedback(null), 4000);
  };

  // Find currently active group
  const activeGroup = useMemo(() => {
    return friendGroups.find(g => g.id === selectedGroupId) || friendGroups[0];
  }, [friendGroups, selectedGroupId]);

  // Compute live leaderboard readings for the active group
  // CRITICAL: Always inject the current user's live recorded focus minutes!
  const activeLeaderboard = useMemo(() => {
    if (!activeGroup) return [];

    let membersList = [...activeGroup.members];

    // Ensure current user is in the list with their live recorded focus minutes
    const currentUserIdx = membersList.findIndex(m => m.isCurrentUser || m.id === currentUser?.uid);
    const currentUserMember: FriendGroupMember = {
      id: currentUser?.uid || "user_current",
      username: friendUsername || "@student",
      displayName: currentUser?.displayName || (friendUsername ? friendUsername.replace("@", "") : "You"),
      focusMinutesThisWeek: totalFocusMinutes, // ACTUAL LIVE READING
      streak: userStreak,
      isCurrentUser: true,
      status: focusModeActive ? "studying" : "online",
      role: currentUserIdx >= 0 ? membersList[currentUserIdx].role : "admin"
    };

    if (currentUserIdx >= 0) {
      membersList[currentUserIdx] = currentUserMember;
    } else {
      membersList.push(currentUserMember);
    }

    // Also include connected friends if in "all" or if group has few members
    if (selectedGroupId === "all") {
      friends.forEach(f => {
        if (!membersList.some(m => m.username.toLowerCase() === f.username.toLowerCase())) {
          membersList.push({
            id: f.id,
            username: f.username,
            displayName: f.displayName,
            focusMinutesThisWeek: f.focusMinutesThisWeek,
            streak: f.streak,
            status: f.status,
            role: "member"
          });
        }
      });
    }

    // Sort descending by focus minutes
    membersList.sort((a, b) => b.focusMinutesThisWeek - a.focusMinutesThisWeek);

    return membersList.map((m, idx) => ({
      ...m,
      rank: idx + 1
    }));
  }, [activeGroup, totalFocusMinutes, userStreak, friendUsername, currentUser, focusModeActive, friends, selectedGroupId]);

  // Group total focus minutes
  const groupTotalMinutes = useMemo(() => {
    return activeLeaderboard.reduce((acc, m) => acc + m.focusMinutesThisWeek, 0);
  }, [activeLeaderboard]);

  const groupProgressPercent = useMemo(() => {
    if (!activeGroup || activeGroup.weeklyGoalMinutes <= 0) return 0;
    return Math.min(100, Math.round((groupTotalMinutes / activeGroup.weeklyGoalMinutes) * 100));
  }, [groupTotalMinutes, activeGroup]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & LIVE FOCUS READING BANNER */}
      <div className={`p-5 sm:p-7 rounded-3xl border shadow-sm relative overflow-hidden ${
        isLight
          ? "bg-gradient-to-br from-[#FFF5F0] via-[#FAF8F5] to-[#FFFFFF] border-[#E8D7C9]"
          : "bg-gradient-to-br from-[#1A0E2E] via-[#120A24] to-[#0A0714] border-[#8B5CF6]/35 shadow-[0_12px_45px_rgba(139,92,246,0.18)]"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/25 border-[#8B5CF6]/45 text-[#C084FC]"
              } border shadow-xs`}>
                <Users size={20} />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  Friends & Study Groups
                </h1>
                <p className={`text-xs sm:text-sm font-sans mt-0.5 ${isLight ? "text-[#7A6E65]" : "text-[#C4B5FD]/85"}`}>
                  Form study groups, compete on live minute leaderboards, and hold each other accountable.
                </p>
              </div>
            </div>
          </div>

          {/* Current User Live Focus Reading Card */}
          <div className={`px-4 py-3 rounded-2xl border flex items-center gap-4 shrink-0 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E8D7C9] shadow-xs"
              : "bg-[#140E26] border-white/10 shadow-lg shadow-black/40"
          }`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                Your Live Reading
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-xl sm:text-2xl font-mono font-black ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                  {formatMinutes(totalFocusMinutes)}
                </span>
                <span className={`text-xs font-sans ${isLight ? "text-[#77736B]" : "text-white/60"}`}>
                  this week
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

            <div className="flex flex-col">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                Streak
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Flame size={16} className="text-amber-500 fill-amber-500" />
                <span className={`text-base sm:text-lg font-mono font-bold ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  {userStreak}d
                </span>
              </div>
            </div>

            {focusModeActive && (
              <div className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]" : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"} animate-ping`} />
                <span>Timer Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Live minute counter notice */}
        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-sans ${
          isLight ? "border-[#E8D7C9]/60 text-[#7A6E65]" : "border-white/10 text-[#C4B5FD]/80"
        }`}>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
            <span>
              <strong>Live Tracking Active:</strong> Every minute you spend in the Study Timer or Stopwatch records live directly into your group leaderboard readings.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateIncomingRequest}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B] hover:text-[#C25E42]" 
                  : "bg-white/5 border-white/10 text-[#C4B5FD] hover:text-white"
              }`}
              title="Simulate receiving an incoming friend request to test the Accept flow"
            >
              <Sparkles size={11} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
              <span>Simulate Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST NOTIFICATION */}
      {friendFeedback && (
        <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm ${
          isLight 
            ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" 
            : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{friendFeedback}</span>
          </div>
          <button 
            onClick={() => setFriendFeedback(null)} 
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. PENDING FRIEND REQUESTS SECTION (OPTION TO ACCEPT FRIEND REQUESTS) */}
      {pendingRequests.length > 0 && (
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
          isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
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
                    Pending Friend Requests
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {pendingRequests.length} waiting
                  </span>
                </div>
                <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                  Accept incoming requests to add friends to your Study Circle and group leaderboards.
                </p>
              </div>
            </div>
          </div>

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
                  className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLight 
                      ? "bg-[#FAF8F5] border-[#E8D7C9] hover:border-[#C25E42]/40" 
                      : "bg-[#120E22] border-white/10 hover:border-[#8B5CF6]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
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
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-sans">
                        <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                          <Clock size={11} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                          {req.senderFocusMinutes ?? 0}m focus
                        </span>
                        <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                          <Flame size={11} className="text-amber-500" />
                          {req.senderStreak ?? 1}d streak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clear Accept and Decline Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      title="Accept friend request and add to your Study Circle"
                    >
                      <Check size={14} className="stroke-[2.5]" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isLight 
                          ? "border-[#E8D7C9] text-[#77736B] hover:text-red-600 hover:border-red-300 hover:bg-red-50" 
                          : "border-white/10 text-[#C4B5FD]/80 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                      }`}
                      title="Decline request"
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FRIEND GROUPS SWITCHER & LEADERBOARD SECTION */}
      <div className={`p-5 sm:p-7 rounded-3xl border shadow-xs space-y-6 ${
        isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
      }`}>
        
        {/* GROUP TABS NAVIGATION */}
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
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/10 dark:bg-white/10"
                  }`}>
                    {group.members.length}
                  </span>
                </button>
              );
            })}

            {/* All Friends tab */}
            <button
              onClick={() => setSelectedGroupId("all")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                selectedGroupId === "all"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-xs"
                    : "bg-[#8B5CF6] text-white shadow-xs"
                  : isLight
                    ? "bg-[#FAF8F5] border border-[#E8D7C9] text-[#77736B] hover:text-[#1A1614]"
                    : "bg-[#140E26] border border-white/10 text-[#C4B5FD] hover:text-white"
              }`}
            >
              <Trophy size={13} />
              <span>All Friends</span>
            </button>
          </div>

          {/* Group Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsJoinGroupOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#E8D7C9] hover:bg-[#F0EEE8] text-[#1A1614]" 
                  : "bg-[#140E26] border-white/10 hover:bg-[#1E1735] text-white"
              }`}
            >
              <span>Join with Code</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white transition cursor-pointer ${
                isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
              }`}
            >
              <Plus size={13} />
              <span>Create Group</span>
            </button>
          </div>
        </div>

        {/* ACTIVE GROUP HEADER & DETAILS */}
        {activeGroup && (
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-black text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  {selectedGroupId === "all" ? "All Friends Global Circle" : activeGroup.name}
                </h2>
                {activeGroup.subject && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isLight ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]" : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/35"
                  }`}>
                    {activeGroup.subject}
                  </span>
                )}
              </div>
              <p className={`text-xs font-sans mt-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                {activeGroup.description || "Weekly study battle among members"}
              </p>
            </div>

            {/* Group Code & Share */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                  Group Code
                </span>
                <span className={`font-mono font-bold text-xs sm:text-sm ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                  {activeGroup.code}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(activeGroup.code);
                    setCopiedGroupCode(true);
                    setTimeout(() => setCopiedGroupCode(false), 2000);
                  }
                }}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  copiedGroupCode
                    ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/40"
                    : isLight
                    ? "bg-white border-[#E8D7C9] text-[#77736B] hover:text-[#1A1614]"
                    : "bg-[#1A1432] border-white/10 text-[#C4B5FD] hover:text-white"
                }`}
                title="Copy group code to invite friends"
              >
                {copiedGroupCode ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* GROUP WEEKLY PROGRESS BAR */}
        {activeGroup && activeGroup.weeklyGoalMinutes > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className={`font-bold flex items-center gap-1.5 ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                <Target size={14} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                <span>Group Weekly Goal Progress</span>
              </span>
              <span className={`font-mono font-bold ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                {formatMinutes(groupTotalMinutes)} / {formatMinutes(activeGroup.weeklyGoalMinutes)} ({groupProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isLight ? "bg-[#C25E42]" : "bg-gradient-to-r from-[#8B5CF6] to-[#C084FC]"
                }`}
                style={{ width: `${groupProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 4. ACTUAL READINGS LEADERBOARD TABLE */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#F59E0B]" />
              <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                Weekly Group Leaderboard
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
              isLight ? "bg-[#FFF2ED] text-[#C25E42] border-[#F0D5CC]" : "bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/35"
            } border`}>
              Live Readings · Resets Monday
            </span>
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

                    {/* Member Name and Handle */}
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`font-mono text-xs ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                          {member.username}
                        </span>
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
                          {formatMinutes(member.focusMinutesThisWeek)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono block ${isLight ? "text-[#77736B]" : "text-white/50"}`}>
                        {member.focusMinutesThisWeek} mins logged
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

          {/* Loser owes coffee note */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 mt-4 ${
            isLight ? "bg-[#FFF5F0] border-[#F0D5CC]" : "bg-[#140E26] border-[#8B5CF6]/30"
          }`}>
            <Coffee size={18} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
            <span className={`text-xs font-sans ${isLight ? "text-[#7A6E65]" : "text-[#C4B5FD]/85"}`}>
              <strong>Friendly Wager:</strong> The member at the bottom of the weekly leaderboard owes coffee to the #1 rank when the board resets Sunday midnight!
            </span>
          </div>
        </div>
      </div>

      {/* 5. PROFILE & INVITE CONTROLS CARD */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 ${
        isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
      }`}>
        <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
          Invite Study Buddies
        </h3>

        {/* YOUR USERNAME ROW */}
        <div className="space-y-1.5">
          <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
            isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
          }`}>
            Your username
          </label>
          
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            {isChangingUsername ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="@yourhandle"
                  className={`flex-1 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold outline-none ${
                    isLight 
                      ? "bg-white border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42]" 
                      : "bg-[#0A0714] border-white/20 text-white focus:border-[#8B5CF6]"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
                  } text-white transition cursor-pointer`}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput(friendUsername);
                    setIsChangingUsername(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className={`font-mono font-bold text-sm sm:text-base ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                  {friendUsername || "@student"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingUsername(true)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isLight 
                      ? "bg-white border-[#E8D7C9] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
                      : "bg-[#1A1432] border-white/10 hover:bg-[#231A44] text-white"
                  }`}
                >
                  <Edit3 size={13} />
                  <span>Change</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* INVITE A FRIEND LINK */}
        <div className="space-y-1.5">
          <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
            isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
          }`}>
            Invite link
          </label>

          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
          }`}>
            <span className={`font-mono text-xs sm:text-sm ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/90"} truncate select-all`}>
              {inviteUrl}
            </span>

            <button
              type="button"
              onClick={handleCopyInvite}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                copiedInvite
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : isLight 
                  ? "bg-white border-[#E8D7C9] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
                  : "bg-[#1A1432] border-white/10 hover:bg-[#231A44] text-white"
              }`}
            >
              {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedInvite ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* ADD BY USERNAME (TERRACOTTA ORANGE IN LIGHT THEME, PURPLE IN DARK) */}
        <form onSubmit={handleAddFriend} className="space-y-1.5">
          <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
            isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
          }`}>
            Add by username
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addFriendInput}
              onChange={(e) => setAddFriendInput(e.target.value)}
              placeholder="@username"
              className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm font-mono font-medium outline-none transition ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42] focus:bg-white" 
                  : "bg-[#120E22] border-white/10 text-white focus:border-[#8B5CF6] focus:bg-[#1A1432]"
              }`}
            />
            <button
              type="submit"
              disabled={!addFriendInput.trim()}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
                isLight 
                  ? "bg-[#C25E42] hover:bg-[#B25136] shadow-md shadow-[#C25E42]/20" 
                  : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/30"
              } disabled:opacity-50`}
            >
              <span>Send</span>
              <ArrowRight size={13} className="text-white" />
            </button>
          </div>
        </form>
      </div>

      {/* CREATE GROUP MODAL */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#101322] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-extrabold text-lg ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                Create Friend Study Group
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Cambridge IGCSE Math Crew"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Focus Subject / Category
                </label>
                <input
                  type="text"
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  placeholder="e.g. Mathematics & Sciences"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium outline-none ${
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
                  max="100"
                  value={newGroupGoalHours}
                  onChange={(e) => setNewGroupGoalHours(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
                  }`}
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {isJoinGroupOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#101322] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-extrabold text-lg ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                Join Study Group with Code
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinGroupOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleJoinGroupByCode} className="space-y-4">
              <div>
                <label className={`text-xs font-mono font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? "text-[#77736B]" : "text-slate-400"
                }`}>
                  Enter Group Code
                </label>
                <input
                  type="text"
                  required
                  value={joinGroupCodeInput}
                  onChange={(e) => setJoinGroupCodeInput(e.target.value)}
                  placeholder="e.g. IGCSE-TOP-2026 or GRP-ABC123"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold uppercase outline-none ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1A1614]" : "bg-[#161A2B] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinGroupOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinGroupCodeInput.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
                  }`}
                >
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
