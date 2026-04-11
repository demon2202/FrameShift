import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import { User, Poster, Follow, Message, Story, Like, Saved, Notification, Comment, Challenge, ChallengeEntry, Thread, Collection } from '../types';
import { db, auth, googleProvider } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, arrayUnion, arrayRemove, writeBatch, addDoc, increment } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface GlobalContextType {
  user: User | null;
  isLoading: boolean;
  isDataLoading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, u: string, n: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;

  allUsers: User[]; 
  posters: Poster[];
  getAllPosters: () => Poster[];
  getFeed: () => Poster[];
  getUserPosters: (userId: string) => Poster[];
  getUserStats: (userId: string) => { followers: number; following: number; posts: number };
  getFollowers: (userId: string) => User[];
  getFollowing: (userId: string) => User[];
  getStories: () => (Story & { user: User })[];
  getConversations: () => Thread[];
  getMessages: (threadId: string) => Message[];
  getComments: (posterId: string) => (Comment & { user: User })[];
  
  addPoster: (poster: Poster) => Promise<void>;
  deletePoster: (posterId: string) => void;
  toggleFollow: (targetUserId: string) => void;
  isFollowing: (targetUserId: string) => boolean;
  isFollowedBy: (targetUserId: string) => boolean;
  hasRequestedFollow: (targetUserId: string) => boolean;
  acceptFollowRequest: (requesterId: string) => void;
  declineFollowRequest: (requesterId: string) => void;
  cancelFollowRequest: (targetId: string) => void;
  toggleLike: (posterId: string) => void;
  isLiked: (posterId: string) => boolean;
  getLikeCount: (posterId: string) => number;
  toggleSave: (posterId: string) => void;
  isSaved: (posterId: string) => boolean;
  sendMessage: (threadId: string, text: string, posterId?: string, imageUrl?: string) => Promise<{ success: boolean; error?: string }>;
  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
  addStory: (imageUrl: string) => Promise<void>;
  deleteStory: (storyId: string) => void;
  viewStory: (storyId: string) => Promise<void>;
  addComment: (posterId: string, text: string) => Promise<void>;
  
  updatePassword: (newPass: string) => Promise<void>;
  togglePrivacy: () => void;
  deleteAccount: () => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;

  updateFeedPreferences: (tags: string[]) => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId?: string) => void;

  likedPosters: string[];
  savedPosters: string[];
  
  challenge: Challenge;
  challengeEntries: ChallengeEntry[];
  submitToChallenge: (posterId: string) => void;
  
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  isUploadOpen: boolean;
  setIsUploadOpen: (isOpen: boolean) => void;
  uploadModalMode: 'poster' | 'story';
  setUploadModalMode: (mode: 'poster' | 'story') => void;
  compressImage: (base64Str: string, maxWidth?: number, quality?: number) => Promise<string>;

  // New features
  collections: Collection[];
  createCollection: (name: string, description: string, isPrivate: boolean) => Promise<void>;
  addToCollection: (collectionId: string, posterId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, posterId: string) => Promise<void>;
  setTypingStatus: (threadId: string, isTyping: boolean) => Promise<void>;
  markThreadRead: (threadId: string) => Promise<void>;
  getOrCreateThread: (otherUserId: string) => Promise<string>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [saves, setSaves] = useState<Saved[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [stories, setStories] = useState<Story[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadModalMode, setUploadModalMode] = useState<'poster' | 'story'>('poster');

  const [challenge] = useState<Challenge>(() => ({
    id: 'c_1',
    topic: 'Neon',
    subtopic: 'Noir',
    description: 'Create a poster using only 3 colors and high contrast lighting.',
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  }));
  const [challengeEntries] = useState<ChallengeEntry[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // Create new user profile
            const newUser: User = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0, 5)}`,
              name: firebaseUser.displayName || 'New User',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              bio: '',
              website: '',
              location: '',
              joinedAt: "2026-04-03T11:00:00.000Z",
              followers: 0,
              following: 0,
              isTrending: false,
              isPrivate: false,
              followRequests: [],
              blockedUsers: [],
              feedPreferences: [],
              onboarded: false
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setUser(newUser);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, 'users');
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Global Listeners
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setAllUsers(usersData);
      setUser(prevUser => {
        if (!prevUser) return null;
        const updated = usersData.find(u => u.id === prevUser.id);
        return updated && JSON.stringify(updated) !== JSON.stringify(prevUser) ? updated : prevUser;
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubPosters = onSnapshot(collection(db, 'posters'), (snapshot) => {
      setPosters(snapshot.docs.map(doc => doc.data() as Poster));
      setIsDataLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posters');
      setIsDataLoading(false);
    });

    const unsubComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
      setComments(snapshot.docs.map(doc => doc.data() as Comment));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'comments'));

    const unsubLikes = onSnapshot(collection(db, 'likes'), (snapshot) => {
      setLikes(snapshot.docs.map(doc => doc.data() as Like));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'likes'));

    const unsubFollows = onSnapshot(collection(db, 'follows'), (snapshot) => {
      setFollows(snapshot.docs.map(doc => doc.data() as Follow));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'follows'));

    const unsubStories = onSnapshot(collection(db, 'stories'), (snapshot) => {
      setStories(snapshot.docs.map(doc => doc.data() as Story));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    return () => {
      unsubUsers();
      unsubPosters();
      unsubComments();
      unsubLikes();
      unsubFollows();
      unsubStories();
    };
  }, []);

  const messageUnsubsRef = useRef<{ [threadId: string]: () => void }>({});

  // User-specific Listeners
  useEffect(() => {
    if (!user) return;

    const unsubThreads = onSnapshot(
      query(collection(db, 'threads'), where('participantIds', 'array-contains', user.id)),
      (snapshot) => {
        const newThreads = snapshot.docs.map(doc => doc.data() as Thread);
        setThreads(newThreads);
        
        // Cleanup listeners for threads that are no longer active
        const newThreadIds = new Set(newThreads.map(t => t.id));
        Object.keys(messageUnsubsRef.current).forEach(threadId => {
          if (!newThreadIds.has(threadId)) {
            messageUnsubsRef.current[threadId]();
            delete messageUnsubsRef.current[threadId];
          }
        });

        // Listen to messages for each thread
        newThreads.forEach(thread => {
          if (!messageUnsubsRef.current[thread.id]) {
            messageUnsubsRef.current[thread.id] = onSnapshot(
              query(collection(db, `threads/${thread.id}/messages`), orderBy('timestamp', 'asc')),
              (msgSnapshot) => {
                setMessages(prev => ({
                  ...prev,
                  [thread.id]: msgSnapshot.docs.map(d => d.data() as Message)
                }));
              },
              (error) => handleFirestoreError(error, OperationType.LIST, `threads/${thread.id}/messages`)
            );
          }
        });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'threads')
    );

    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), where('targetUserId', '==', user.id), orderBy('time', 'desc')),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
    );

    const unsubCollections = onSnapshot(
      query(collection(db, 'collections'), where('userId', '==', user.id)),
      (snapshot) => {
        setCollections(snapshot.docs.map(doc => doc.data() as Collection));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'collections')
    );

    const unsubSaves = onSnapshot(
      query(collection(db, 'saves'), where('userId', '==', user.id)),
      (snapshot) => {
        setSaves(snapshot.docs.map(doc => doc.data() as Saved));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'saves')
    );

    return () => {
      unsubThreads();
      unsubNotifs();
      unsubCollections();
      unsubSaves();
      Object.values(messageUnsubsRef.current).forEach(unsub => unsub());
      messageUnsubsRef.current = {};
    };
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      await signInWithEmailAndPassword(auth, e, p);
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const registerWithEmail = async (e: string, p: string, u: string, n: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, p);
      const newUser: User = {
        id: cred.user.uid,
        username: u,
        name: n,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cred.user.uid}`,
        bio: '',
        website: '',
        location: '',
        joinedAt: "2026-04-03T11:00:00.000Z",
        followers: 0,
        following: 0,
        isTrending: false,
        isPrivate: false,
        followRequests: [],
        blockedUsers: [],
        feedPreferences: [],
        onboarded: false
      };
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
    } catch (error) {
      console.error("Email registration failed", error);
      throw error;
    }
  };

  const logout = () => {
    signOut(auth);
    setThreads([]);
    setNotifications([]);
    setCollections([]);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const MOCK_POSTERS: Poster[] = useMemo(() => [
    {
      id: 'mock-1',
      creatorId: 'mock-user-1',
      title: 'Neon Drift',
      description: 'A cyberpunk car drifting through neon streets.',
      imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=1000&auto=format&fit=crop',
      tags: ['Cars', 'Cyberpunk', 'Neon'],
      likes: 120,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff00ff', '#00ffff'],
      license: 'personal',
      creator: { id: 'mock-user-1', username: 'neon_rider', name: 'Neon Rider', avatar: 'https://i.pravatar.cc/150?u=mock-user-1', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-2',
      creatorId: 'mock-user-2',
      title: 'Samurai Soul',
      description: 'A dark anime samurai with a glowing sword.',
      imageUrl: 'https://images.unsplash.com/photo-1580477371194-4593e3c7c6cb?q=80&w=1000&auto=format&fit=crop',
      tags: ['Swords', 'Anime', 'Dark'],
      likes: 340,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#000000', '#ff0000'],
      license: 'personal',
      creator: { id: 'mock-user-2', username: 'blade_master', name: 'Blade Master', avatar: 'https://i.pravatar.cc/150?u=mock-user-2', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-3',
      creatorId: 'mock-user-3',
      title: 'Midnight Run',
      description: 'A black car racing through the night.',
      imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1000&auto=format&fit=crop',
      tags: ['Cars', 'Black', 'Night'],
      likes: 89,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#000000', '#333333'],
      license: 'personal',
      creator: { id: 'mock-user-3', username: 'night_driver', name: 'Night Driver', avatar: 'https://i.pravatar.cc/150?u=mock-user-3', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-4',
      creatorId: 'mock-user-4',
      title: 'Blade Master',
      description: 'A minimal red sword design.',
      imageUrl: 'https://images.unsplash.com/photo-1589652717521-10c0d092dea9?q=80&w=1000&auto=format&fit=crop',
      tags: ['Swords', 'Minimal', 'Red'],
      likes: 210,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff0000', '#ffffff'],
      license: 'personal',
      creator: { id: 'mock-user-4', username: 'red_blade', name: 'Red Blade', avatar: 'https://i.pravatar.cc/150?u=mock-user-4', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-5',
      creatorId: 'mock-user-5',
      title: 'Tokyo Streets',
      description: 'Anime style cyberpunk city streets.',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
      tags: ['Anime', 'Cyberpunk', 'City'],
      likes: 450,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff00ff', '#0000ff'],
      license: 'personal',
      creator: { id: 'mock-user-5', username: 'tokyo_dreamer', name: 'Tokyo Dreamer', avatar: 'https://i.pravatar.cc/150?u=mock-user-5', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-6',
      creatorId: 'mock-user-6',
      title: 'Cyber Ninja',
      description: 'A cyber ninja in action.',
      imageUrl: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1000&auto=format&fit=crop',
      tags: ['Cyberpunk', 'Ninja', 'Action'],
      likes: 560,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#00ff00', '#000000'],
      license: 'personal',
      creator: { id: 'mock-user-6', username: 'cyber_ninja', name: 'Cyber Ninja', avatar: 'https://i.pravatar.cc/150?u=mock-user-6', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-7',
      creatorId: 'mock-user-7',
      title: 'Pixel Art',
      description: 'A beautiful pixel art landscape.',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
      tags: ['Pixel', 'Art', 'Landscape'],
      likes: 320,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff0000', '#00ff00'],
      license: 'personal',
      creator: { id: 'mock-user-7', username: 'pixel_art', name: 'Pixel Art', avatar: 'https://i.pravatar.cc/150?u=mock-user-7', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-8',
      creatorId: 'mock-user-8',
      title: 'Retro Wave',
      description: 'A retro wave sunset.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
      tags: ['Retro', 'Wave', 'Sunset'],
      likes: 410,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff00ff', '#ffff00'],
      license: 'personal',
      creator: { id: 'mock-user-8', username: 'retro_wave', name: 'Retro Wave', avatar: 'https://i.pravatar.cc/150?u=mock-user-8', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-9',
      creatorId: 'mock-user-9',
      title: 'Future Bass',
      description: 'A futuristic bass stage.',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
      tags: ['Future', 'Bass', 'Music'],
      likes: 290,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#0000ff', '#ff00ff'],
      license: 'personal',
      creator: { id: 'mock-user-9', username: 'future_bass', name: 'Future Bass', avatar: 'https://i.pravatar.cc/150?u=mock-user-9', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-10',
      creatorId: 'mock-user-10',
      title: 'Synth Pop',
      description: 'A synth pop concert.',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
      tags: ['Synth', 'Pop', 'Concert'],
      likes: 380,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff0000', '#0000ff'],
      license: 'personal',
      creator: { id: 'mock-user-10', username: 'synth_pop', name: 'Synth Pop', avatar: 'https://i.pravatar.cc/150?u=mock-user-10', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-11',
      creatorId: 'mock-user-11',
      title: 'Vapor Wave',
      description: 'A vapor wave aesthetic.',
      imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1000&auto=format&fit=crop',
      tags: ['Vapor', 'Wave', 'Aesthetic'],
      likes: 470,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#00ffff', '#ff00ff'],
      license: 'personal',
      creator: { id: 'mock-user-11', username: 'vapor_wave', name: 'Vapor Wave', avatar: 'https://i.pravatar.cc/150?u=mock-user-11', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-12',
      creatorId: 'mock-user-12',
      title: 'Lofi Beats',
      description: 'A lofi beats study room.',
      imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1000&auto=format&fit=crop',
      tags: ['Lofi', 'Beats', 'Study'],
      likes: 520,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ffff00', '#00ff00'],
      license: 'personal',
      creator: { id: 'mock-user-12', username: 'lofi_beats', name: 'Lofi Beats', avatar: 'https://i.pravatar.cc/150?u=mock-user-12', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-13',
      creatorId: 'mock-user-13',
      title: 'Chill Hop',
      description: 'A chill hop cafe.',
      imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop',
      tags: ['Chill', 'Hop', 'Cafe'],
      likes: 310,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#ff0000', '#ffff00'],
      license: 'personal',
      creator: { id: 'mock-user-13', username: 'chill_hop', name: 'Chill Hop', avatar: 'https://i.pravatar.cc/150?u=mock-user-13', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-14',
      creatorId: 'mock-user-14',
      title: 'Ambient Sound',
      description: 'An ambient sound landscape.',
      imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop',
      tags: ['Ambient', 'Sound', 'Landscape'],
      likes: 280,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#0000ff', '#00ffff'],
      license: 'personal',
      creator: { id: 'mock-user-14', username: 'ambient_sound', name: 'Ambient Sound', avatar: 'https://i.pravatar.cc/150?u=mock-user-14', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    },
    {
      id: 'mock-15',
      creatorId: 'mock-user-15',
      title: 'Space Cadet',
      description: 'A space cadet exploring the galaxy.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
      tags: ['Space', 'Cadet', 'Galaxy'],
      likes: 600,
      createdAt: "2026-04-03T11:00:00.000Z",
      colors: ['#000000', '#ffffff'],
      license: 'personal',
      creator: { id: 'mock-user-15', username: 'space_cadet', name: 'Space Cadet', avatar: 'https://i.pravatar.cc/150?u=mock-user-15', bio: '', followers: 0, following: 0, joinedAt: "2026-04-03T11:00:00.000Z", isPrivate: false }
    }
  ], []);

  const MOCK_USERS: User[] = [
    {
      id: 'mock-user-1',
      username: 'driftking',
      name: 'Drift King',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=driftking',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-2',
      username: 'ronin',
      name: 'Ronin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ronin',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-3',
      username: 'nightrider',
      name: 'Night Rider',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nightrider',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-4',
      username: 'blademaster',
      name: 'Blade Master',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blademaster',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-5',
      username: 'tokyodreamer',
      name: 'Tokyo Dreamer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tokyodreamer',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-6',
      username: 'cyber_ninja',
      name: 'Cyber Ninja',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber_ninja',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-7',
      username: 'pixel_art',
      name: 'Pixel Art',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_art',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-8',
      username: 'retro_wave',
      name: 'Retro Wave',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retro_wave',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-9',
      username: 'future_bass',
      name: 'Future Bass',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=future_bass',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-10',
      username: 'synth_pop',
      name: 'Synth Pop',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=synth_pop',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-11',
      username: 'vapor_wave',
      name: 'Vapor Wave',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vapor_wave',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-12',
      username: 'lofi_beats',
      name: 'Lofi Beats',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lofi_beats',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-13',
      username: 'chill_hop',
      name: 'Chill Hop',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chill_hop',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-14',
      username: 'ambient_sound',
      name: 'Ambient Sound',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ambient_sound',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    },
    {
      id: 'mock-user-15',
      username: 'space_cadet',
      name: 'Space Cadet',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=space_cadet',
      bio: '', website: '', location: '', joinedAt: "2026-04-03T11:00:00.000Z", followers: 0, following: 0, isTrending: false, isPrivate: false, followRequests: [], blockedUsers: [], feedPreferences: [], onboarded: true
    }
  ];

  const getAllPosters = () => {
    const combinedPosters = [...posters, ...MOCK_POSTERS];
    const combinedUsers = [...allUsers, ...MOCK_USERS];
    
    return combinedPosters.map(p => ({
      ...p,
      creator: combinedUsers.find(u => u.id === p.creatorId) || combinedUsers[0]
    })).filter(p => p.creator).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getFeed = () => {
    if (!user) return getAllPosters();
    const followingIds = follows.filter(f => f.followerId === user.id).map(f => f.followingId);
    let feed = getAllPosters().filter(p => followingIds.includes(p.creatorId) || p.creatorId === user.id);
    
    // If feed is empty or user has preferences, suggest some posters
    if (feed.length < 5 && user.feedPreferences && user.feedPreferences.length > 0) {
      const suggested = getAllPosters().filter(p => 
        !feed.includes(p) && 
        p.tags.some(t => user.feedPreferences?.includes(t))
      );
      feed = [...feed, ...suggested];
    }
    
    // If still empty, just show some recent posters
    if (feed.length === 0) {
      feed = getAllPosters().slice(0, 10);
    }
    
    return feed;
  };

  const getUserPosters = (userId: string) => {
    return getAllPosters().filter(p => p.creatorId === userId);
  };

  const getUserStats = (userId: string) => {
    const followerIds = follows.filter(f => f.followingId === userId).map(f => f.followerId);
    const followingIds = follows.filter(f => f.followerId === userId).map(f => f.followingId);
    
    const validFollowers = allUsers.filter(u => followerIds.includes(u.id)).length;
    const validFollowing = allUsers.filter(u => followingIds.includes(u.id)).length;

    return {
      followers: validFollowers,
      following: validFollowing,
      posts: posters.filter(p => p.creatorId === userId).length
    };
  };

  const getFollowers = (userId: string) => {
    const followerIds = follows.filter(f => f.followingId === userId).map(f => f.followerId);
    return allUsers.filter(u => followerIds.includes(u.id));
  };

  const getFollowing = (userId: string) => {
    const followingIds = follows.filter(f => f.followerId === userId).map(f => f.followingId);
    return allUsers.filter(u => followingIds.includes(u.id));
  };

  const getStories = () => {
    if (!user) return [];
    const now = new Date().getTime();
    const followingIds = follows.filter(f => f.followerId === user.id).map(f => f.followingId);
    
    return stories
      .filter(s => {
        const age = now - new Date(s.timestamp).getTime();
        const isNotExpired = age < 24 * 60 * 60 * 1000;
        const isFollowingOrMe = followingIds.includes(s.userId) || s.userId === user.id;
        return isNotExpired && isFollowingOrMe;
      })
      .map(s => ({
        ...s,
        user: allUsers.find(u => u.id === s.userId) || allUsers[0]
      }))
      .filter(s => s.user)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getConversations = () => {
    if (!user) return [];
    return threads.map(t => {
      const otherUserId = t.participantIds.find(id => id !== user.id) || user.id;
      const otherUser = allUsers.find(u => u.id === otherUserId) || allUsers[0];
      const threadMsgs = messages[t.id] || [];
      return {
        ...t,
        userId: otherUserId,
        user: otherUser,
        unread: t.unreadCount?.[user.id] || 0,
        messages: threadMsgs.map(m => ({
          ...m,
          isMe: m.senderId === user.id
        }))
      };
    }).filter(t => t.user).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  };

  const getMessages = (threadId: string) => {
    return messages[threadId] || [];
  };

  const getComments = (posterId: string) => {
    return comments
      .filter(c => c.posterId === posterId)
      .map(c => ({
        ...c,
        user: allUsers.find(u => u.id === c.userId) || allUsers[0]
      }))
      .filter(c => c.user)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const addPoster = async (poster: Poster) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'posters', poster.id), {
        ...poster,
        creatorId: user.id,
        createdAt: new Date().toISOString(),
        likes: 0
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posters/${poster.id}`);
    }
  };

  const deletePoster = async (posterId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'posters', posterId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posters/${posterId}`);
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const followId = `${user.id}_${targetUserId}`;
    const isF = isFollowing(targetUserId);
    const hasReq = hasRequestedFollow(targetUserId);
    const targetUser = allUsers.find(u => u.id === targetUserId);

    try {
      if (isF) {
        await deleteDoc(doc(db, 'follows', followId));
      } else if (hasReq) {
        await cancelFollowRequest(targetUserId);
      } else {
        if (targetUser?.isPrivate) {
          await updateDoc(doc(db, 'users', targetUserId), {
            followRequests: arrayUnion(user.id)
          });
          await addDoc(collection(db, 'notifications'), {
            type: 'follow',
            actorId: user.id,
            targetUserId: targetUserId,
            read: false,
            time: new Date().toISOString(),
            text: 'requested to follow you'
          });
        } else {
          await setDoc(doc(db, 'follows', followId), {
            id: followId,
            followerId: user.id,
            followingId: targetUserId,
            createdAt: new Date().toISOString()
          });
          await addDoc(collection(db, 'notifications'), {
            type: 'follow',
            actorId: user.id,
            targetUserId: targetUserId,
            read: false,
            time: new Date().toISOString(),
            text: 'started following you'
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `follows/${followId}`);
    }
  };

  const isFollowing = (targetUserId: string) => {
    if (!user) return false;
    return follows.some(f => f.followerId === user.id && f.followingId === targetUserId);
  };

  const isFollowedBy = (targetUserId: string) => {
    if (!user) return false;
    return follows.some(f => f.followerId === targetUserId && f.followingId === user.id);
  };

  const hasRequestedFollow = (targetUserId: string) => {
    const targetUser = allUsers.find(u => u.id === targetUserId);
    return targetUser?.followRequests?.includes(user?.id || '') || false;
  };

  const acceptFollowRequest = async (requesterId: string) => {
    if (!user) return;
    const followId = `${requesterId}_${user.id}`;
    try {
      await setDoc(doc(db, 'follows', followId), {
        id: followId,
        followerId: requesterId,
        followingId: user.id,
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', user.id), {
        followRequests: arrayRemove(requesterId)
      });
      await addDoc(collection(db, 'notifications'), {
        type: 'follow',
        actorId: user.id,
        targetUserId: requesterId,
        read: false,
        time: new Date().toISOString(),
        text: 'accepted your follow request'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `follows/${followId}`);
    }
  };

  const declineFollowRequest = async (requesterId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        followRequests: arrayRemove(requesterId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const cancelFollowRequest = async (targetId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', targetId), {
        followRequests: arrayRemove(user.id)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetId}`);
    }
  };

  const toggleLike = async (posterId: string) => {
    if (!user) return;
    const likeId = `${user.id}_${posterId}`;
    const isL = isLiked(posterId);
    const poster = posters.find(p => p.id === posterId);
    
    try {
      if (isL) {
        await deleteDoc(doc(db, 'likes', likeId));
        if (poster) {
          await updateDoc(doc(db, 'posters', posterId), { likes: increment(-1) });
        }
      } else {
        await setDoc(doc(db, 'likes', likeId), {
          userId: user.id,
          posterId: posterId,
          createdAt: new Date().toISOString()
        });
        if (poster) {
          await updateDoc(doc(db, 'posters', posterId), { likes: increment(1) });
          if (poster.creatorId !== user.id) {
            await addDoc(collection(db, 'notifications'), {
              type: 'like',
              actorId: user.id,
              targetUserId: poster.creatorId,
              referenceId: posterId,
              read: false,
              time: new Date().toISOString(),
              text: 'liked your poster'
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
    }
  };

  const isLiked = (posterId: string) => {
    if (!user) return false;
    return likes.some(l => l.userId === user.id && l.posterId === posterId);
  };

  const getLikeCount = (posterId: string) => {
    return likes.filter(l => l.posterId === posterId).length;
  };

  const toggleSave = async (posterId: string) => {
    if (!user) return;
    const saveId = `${user.id}_${posterId}`;
    const isS = isSaved(posterId);
    
    try {
      if (isS) {
        await deleteDoc(doc(db, 'saves', saveId));
        toast.success('Removed from saved');
      } else {
        await setDoc(doc(db, 'saves', saveId), {
          userId: user.id,
          posterId: posterId,
          createdAt: new Date().toISOString()
        });
        toast.success('Saved to collection');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `saves/${saveId}`);
    }
  };

  const isSaved = (posterId: string) => {
    if (!user) return false;
    return saves.some(s => s.userId === user.id && s.posterId === posterId);
  };

  const getOrCreateThread = async (otherUserId: string) => {
    if (!user) throw new Error("Not logged in");
    const existingThread = threads.find(t => t.participantIds.includes(otherUserId));
    if (existingThread) return existingThread.id;

    const newThreadRef = doc(collection(db, 'threads'));
    await setDoc(newThreadRef, {
      id: newThreadRef.id,
      participantIds: [user.id, otherUserId],
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: { [user.id]: 0, [otherUserId]: 0 },
      typing: { [user.id]: false, [otherUserId]: false }
    });
    return newThreadRef.id;
  };

  const sendMessage = async (threadId: string, text: string, posterId?: string, imageUrl?: string) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const thread = threads.find(t => t.id === threadId);
    const otherUserId = thread?.participantIds.find(id => id !== user.id);
    
    if (otherUserId) {
        const otherFollowsMe = follows.some(f => f.followerId === otherUserId && f.followingId === user.id);
        const iFollowThem = follows.some(f => f.followerId === user.id && f.followingId === otherUserId);
        const isMutualFollow = otherFollowsMe && iFollowThem;
        
        const threadMsgs = messages[threadId] || [];
        const sortedMsgs = [...threadMsgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const lastMessage = sortedMsgs.length > 0 ? sortedMsgs[sortedMsgs.length - 1] : null;
        const currentUserSentLastMessage = lastMessage?.senderId === user.id;

        if (!isMutualFollow) {
            if (iFollowThem || otherFollowsMe) {
                if (currentUserSentLastMessage) {
                    return { success: false, error: 'You can send more messages after they reply.' };
                }
            } else {
                if (currentUserSentLastMessage || sortedMsgs.length === 0) {
                    return { success: false, error: 'You must follow each other to send messages.' };
                }
            }
        }
    }

    try {
      const msgRef = doc(collection(db, `threads/${threadId}/messages`));

      const msgData: any = {
        id: msgRef.id,
        threadId,
        senderId: user.id,
        text,
        timestamp: new Date().toISOString(),
        read: false
      };
      if (posterId) msgData.posterId = posterId;
      if (imageUrl) msgData.imageUrl = imageUrl;

      await setDoc(msgRef, msgData);

      const updateData: any = {
        lastMessage: text,
        lastMessageTime: new Date().toISOString()
      };
      if (otherUserId) {
        updateData[`unreadCount.${otherUserId}`] = (thread?.unreadCount?.[otherUserId] || 0) + 1;
      }

      await updateDoc(doc(db, 'threads', threadId), updateData);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `threads/${threadId}/messages`);
      return { success: false, error: 'Failed to send message' };
    }
  };

  const setTypingStatus = async (threadId: string, isTyping: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'threads', threadId), {
        [`typing.${user.id}`]: isTyping
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${threadId}`);
    }
  };

  const markThreadRead = async (threadId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'threads', threadId), {
        [`unreadCount.${user.id}`]: 0
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${threadId}`);
    }
  };

  const addStory = async (imageUrl: string) => {
    if (!user) return;
    try {
      const storyRef = doc(collection(db, 'stories'));
      await setDoc(storyRef, {
        id: storyRef.id,
        userId: user.id,
        imageUrl,
        timestamp: new Date().toISOString(),
        viewers: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stories');
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stories/${storyId}`);
    }
  };

  const viewStory = async (storyId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'stories', storyId), {
        viewers: arrayUnion(user.id)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stories/${storyId}`);
    }
  };

  const addComment = async (posterId: string, text: string) => {
    if (!user) return;
    try {
      const commentRef = doc(collection(db, 'comments'));
      await setDoc(commentRef, {
        id: commentRef.id,
        posterId,
        userId: user.id,
        text,
        createdAt: new Date().toISOString()
      });
      
      const poster = posters.find(p => p.id === posterId);
      if (poster && poster.creatorId !== user.id) {
        await addDoc(collection(db, 'notifications'), {
          type: 'comment',
          actorId: user.id,
          targetUserId: poster.creatorId,
          referenceId: posterId,
          read: false,
          time: new Date().toISOString(),
          text: `commented: "${text.substring(0, 20)}..."`
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  const deleteMessage = async (threadId: string, messageId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'threads', threadId, 'messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `threads/${threadId}/messages/${messageId}`);
    }
  };

  const createCollection = async (name: string, description: string, isPrivate: boolean) => {
    if (!user) return;
    try {
      const collRef = doc(collection(db, 'collections'));
      await setDoc(collRef, {
        id: collRef.id,
        userId: user.id,
        name,
        description,
        isPrivate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        posterIds: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'collections');
    }
  };

  const addToCollection = async (collectionId: string, posterId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'collections', collectionId), {
        posterIds: arrayUnion(posterId),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `collections/${collectionId}`);
    }
  };

  const removeFromCollection = async (collectionId: string, posterId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'collections', collectionId), {
        posterIds: arrayRemove(posterId),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `collections/${collectionId}`);
    }
  };

  const updatePassword = async () => {};
  const togglePrivacy = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isPrivate: !user.isPrivate
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };
  const deleteAccount = () => {};
  const blockUser = async (userId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        blockedUsers: arrayUnion(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const unblockUser = async (userId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        blockedUsers: arrayRemove(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const isBlocked = (userId: string) => {
    return user?.blockedUsers?.includes(userId) || false;
  };
  const updateFeedPreferences = async (tags: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        feedPreferences: tags
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAsRead = async (notificationId?: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      if (notificationId) {
        batch.update(doc(db, 'notifications', notificationId), { read: true });
      } else {
        notifications.filter(n => !n.read).forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const compressImage = async (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  return (
    <GlobalContext.Provider value={{
      user, isLoading, isDataLoading, login, loginWithEmail, registerWithEmail, logout, updateUserProfile,
      allUsers, posters, getAllPosters, getFeed, getUserPosters, getUserStats,
      getFollowers, getFollowing, getStories, getConversations, getMessages, getComments,
      addPoster, deletePoster, toggleFollow, isFollowing, isFollowedBy, hasRequestedFollow,
      acceptFollowRequest, declineFollowRequest, cancelFollowRequest, toggleLike, isLiked, getLikeCount,
      toggleSave, isSaved, sendMessage, deleteMessage, addStory, deleteStory, viewStory, addComment,
      updatePassword, togglePrivacy, deleteAccount, blockUser, unblockUser, isBlocked,
      updateFeedPreferences, notifications, unreadCount, markAsRead,
      likedPosters: likes.filter(l => l.userId === user?.id).map(l => l.posterId),
      savedPosters: saves.filter(s => s.userId === user?.id).map(s => s.posterId),
      challenge, challengeEntries, submitToChallenge: () => {},
      theme, toggleTheme, isUploadOpen, setIsUploadOpen, uploadModalMode, setUploadModalMode, compressImage,
      collections, createCollection, addToCollection, removeFromCollection,
      setTypingStatus, markThreadRead, getOrCreateThread
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};
