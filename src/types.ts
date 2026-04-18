
export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  joinedAt?: string;
  followers?: number;
  following?: number;
  isTrending?: boolean;
  isPrivate?: boolean;
  followRequests?: string[];
  bannerUrl?: string;
  isWinner?: boolean; // Daily Challenge Winner
  blockedUsers?: string[]; // List of user IDs blocked by this user
  feedPreferences?: string[]; // Array of preferred categories/tags
  website?: string;
  location?: string;
  onboarded?: boolean;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    inApp?: boolean;
    likesAndComments?: boolean;
    newFollowers?: boolean;
    directMessages?: boolean;
  };
}

export interface Challenge {
  id: string;
  topic: string;
  subtopic: string;
  description: string;
  endsAt: string; // ISO Date
}

export interface ChallengeEntry {
  posterId: string;
  userId: string;
  likes: number;
}

export interface Poster {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  creatorId: string;
  creator: User; // Hydrated on fetch
  tags: string[];
  createdAt: string;
  colors: string[];
  license: 'personal' | 'commercial';
  likes: number;
}

// Normalized Relationships
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Like {
  userId: string;
  posterId: string;
}

export interface Saved {
  userId: string;
  posterId: string;
}

export interface Comment {
  id: string;
  posterId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  posterIds: string[];
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  posterId?: string;
  imageUrl?: string;
  audioUrl?: string;
  replyToId?: string;
}

export interface Story {
  id: string;
  userId: string;
  user?: User; // Hydrated on fetch
  imageUrl: string;
  timestamp: string; // Expires in 24h
  viewers: string[];
}

export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'message' | 'system' | 'comment';
  actorId?: string; // Who did it
  targetUserId?: string; // Who received it
  referenceId?: string; // posterId or messageId
  read: boolean;
  time: string;
  text?: string;
  userAvatar?: string;
  userId?: string;
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  posterId?: string;
  imageUrl?: string;
  audioUrl?: string;
  replyToId?: string;
  read?: boolean;
}

export interface Thread {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: Record<string, number>;
  typing: Record<string, boolean>;
  // Virtual properties for UI
  userId: string;
  user: User;
  unread: number;
  messages: ThreadMessage[];
}
