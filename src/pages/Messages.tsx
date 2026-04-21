
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useGlobalContext } from '../context/GlobalContext';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { Plus, MessageSquare, X, Trash2, Phone, Video, Info, Camera, Mic, Image as ImageIcon, Smile, CheckCircle2, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '❤️', '🔥', '✨', '💀', '💯'];

export const Messages: React.FC = () => {
  const { user, getConversations, getMessages, sendMessage, deleteMessage, allUsers, getOrCreateThread, posters, setTypingStatus, isFollowing, isFollowedBy, isBlocked, compressImage, searchUsersDB } = useGlobalContext();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchThread, setSearchThread] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch real data
  const threads = getConversations();
  const filteredThreads = useMemo(() => {
    if (!searchThread) return threads;
    const q = searchThread.toLowerCase();
    return threads.filter(t => 
      t.user.name.toLowerCase().includes(q) || 
      t.user.username.toLowerCase().includes(q)
    );
  }, [threads, searchThread]);

  const currentThread = threads.find(t => t.id === selectedThreadId);
  const currentMessages = selectedThreadId ? getMessages(selectedThreadId) : [];
  const selectedUser = currentThread?.user;
  
  const isOtherUserTyping = selectedUser && currentThread?.typing?.[selectedUser.id];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length, isOtherUserTyping]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      if (selectedThreadId) {
          setTypingStatus(selectedThreadId, true);
          if (typingTimeout) clearTimeout(typingTimeout);
          const timeout = setTimeout(() => {
              setTypingStatus(selectedThreadId, false);
          }, 2000);
          setTypingTimeout(timeout);
      }
  };

  const handleSend = async () => {
      if (!newMessage.trim() || !selectedThreadId || isSending) return;
      setIsSending(true);
      if (typingTimeout) clearTimeout(typingTimeout);
      await setTypingStatus(selectedThreadId, false);
      
      let text = newMessage;
      let posterId: string | undefined = undefined;
      
      // Check if the message contains a poster link
      const posterMatch = text.match(/#\/explore\?poster=([a-zA-Z0-9-]+)/);
      if (posterMatch) {
          posterId = posterMatch[1];
          // Optionally remove the link from the text if you just want the poster card
          text = text.replace(posterMatch[0], '').trim();
          if (!text) text = 'Shared a poster';
      }

      const result = await sendMessage(selectedThreadId, text, posterId, undefined, undefined, replyToMessage?.id);
      if (result.success) {
          setNewMessage('');
          setErrorMessage(null);
          setReplyToMessage(null);
      } else {
          setErrorMessage(result.error || 'Failed to send message');
      }
      setIsSending(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedThreadId) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = reader.result as string;
          try {
              const compressedBase64 = await compressImage(base64String, 800, 0.8);
              sendMessage(selectedThreadId, '', undefined, compressedBase64);
          } catch {
              // fallback
              sendMessage(selectedThreadId, '', undefined, base64String);
          }
      };
      reader.readAsDataURL(file);
      
      e.target.value = '';
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                  audioChunksRef.current.push(e.data);
              }
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onloadend = () => {
                  const base64Audio = reader.result as string;
                  if (selectedThreadId) {
                      sendMessage(selectedThreadId, '', undefined, undefined, base64Audio);
                  }
              };
              reader.readAsDataURL(audioBlob);
              
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);
          
          recordingIntervalRef.current = setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (err) {
          toast.error("Microphone access denied or not available");
          console.error("Error accessing microphone", err);
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
          }
      }
  };

  const cancelRecording = () => {
       if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.onstop = null; // Prevent sending
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
          }
          audioChunksRef.current = [];
      }
  };

  const formatRecordingTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startChat = async (otherUserId: string) => {
      setNewChatError(null);
      try {
          const threadId = await getOrCreateThread(otherUserId);
          setSelectedThreadId(threadId);
          setIsNewChatModalOpen(false);
      } catch (error: any) {
          setNewChatError(error.message || 'Failed to start chat');
      }
  };

  const [dbSearchUsers, setDbSearchUsers] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const updateSearch = () => {
      setDbSearchUsers([]);
    };
    if (!searchUser) {
      updateSearch();
      return;
    }
    const timeout = setTimeout(async () => {
       try {
         const res = await searchUsersDB(searchUser);
         if (active) {
            setDbSearchUsers(res.filter(u => u.id !== user?.id));
         }
       } catch (err) {
         console.error(err);
       }
    }, 300);
    return () => { active = false; clearTimeout(timeout); };
  }, [searchUser, searchUsersDB, user]);

  const filteredUsers = searchUser ? dbSearchUsers : allUsers.filter(u => u.id !== user?.id).slice(0, 10);
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pt-24 flex flex-col h-screen overflow-hidden relative">
      <Navbar />
      
      <div className="flex-1 max-w-5xl mx-auto w-full flex h-[calc(100vh-96px)] relative z-10 border-x border-gray-200 dark:border-gray-800 pb-16 md:pb-0">
          {/* Thread List Sidebar */}
          <div className={`w-full md:w-[350px] flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 overflow-hidden ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h1 className="text-xl font-bold">Messages</h1>
                  <button onClick={() => setIsNewChatModalOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                      <Plus size={24} />
                  </button>
              </div>
              
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                  <input 
                      type="text" 
                      placeholder="Search messages..." 
                      value={searchThread}
                      onChange={(e) => setSearchThread(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
              </div>

              {filteredThreads.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                      <MessageSquare size={48} className="mb-4 opacity-50 font-light" strokeWidth={1} />
                      <p className="text-lg font-medium text-black dark:text-white mb-1">Your Messages</p>
                      <p className="text-sm mb-6">Send private photos and messages to a friend or group.</p>
                      <button onClick={() => setIsNewChatModalOpen(true)} className="bg-blue-500 text-white font-semibold text-sm rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors">Send message</button>
                  </div>
              ) : (
                  <div className="flex-1 overflow-y-auto">
                    {filteredThreads.map(thread => (
                        <div 
                            key={thread.id} 
                            onClick={() => setSelectedThreadId(thread.id)}
                            className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${selectedThreadId === thread.id ? 'bg-gray-100 dark:bg-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}
                        >
                            <div className="relative flex-shrink-0">
                                <OptimizedImage src={thread.user.avatar} className="w-14 h-14 rounded-full object-cover" alt={thread.user.username || 'unknown'} containerClassName="w-14 h-14 rounded-full" />
                                {thread.unread > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-black"></div>}
                                {/* Online Indicator Mock */}
                                {thread.user.id.charCodeAt(0) % 2 === 0 && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-black"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                    <h3 className={`text-sm truncate ${thread.unread > 0 ? 'font-bold' : 'font-medium'}`}>{thread.user.name}</h3>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 truncate">
                                    <p className={`truncate ${thread.unread > 0 ? 'font-bold text-black dark:text-white' : ''}`}>
                                        {thread.lastMessage}
                                    </p>
                                    <span className="mx-1">•</span>
                                    <span className="flex-shrink-0">
                                        {/* Simple time formatting for demo */}
                                        {new Date(thread.lastMessageTime).toLocaleDateString() === new Date().toLocaleDateString() 
                                            ? new Date(thread.lastMessageTime).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
                                            : new Date(thread.lastMessageTime).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
              )}
          </div>

          {/* Chat Window */}
          <div className={`flex-1 flex-col bg-white dark:bg-black overflow-hidden relative ${!selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
              {selectedThreadId && selectedUser ? (
                  <>
                    {/* Header */}
                    <div className="h-[72px] px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-black z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <button className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full" onClick={() => setSelectedThreadId(null)}>
                                <svg aria-label="Back" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z" transform="rotate(-90 12 12)"></path></svg>
                            </button>
                            <OptimizedImage src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`} className="w-11 h-11 rounded-full object-cover cursor-pointer" alt={selectedUser.username} onClick={() => navigate(`/profile/${selectedUser.id}`)} containerClassName="w-11 h-11 rounded-full" />
                            <div className="flex flex-col cursor-pointer" onClick={() => navigate(`/profile/${selectedUser.id}`)}>
                                <h3 className="font-semibold text-base leading-tight">{selectedUser.name || 'Unknown User'}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    {selectedUser.id.charCodeAt(0) % 2 === 0 ? (
                                        <><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Active now</>
                                    ) : (
                                        selectedUser.username
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-black dark:text-white">
                            <Phone size={24} className="cursor-pointer hover:opacity-70" onClick={() => toast('Voice calls coming soon!', { icon: '🚧' })} />
                            <Video size={24} className="cursor-pointer hover:opacity-70" onClick={() => toast('Video calls coming soon!', { icon: '🚧' })} />
                            <Info size={24} className="cursor-pointer hover:opacity-70" onClick={() => toast('Chat info coming soon!', { icon: '🚧' })} />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-white dark:bg-black">
                        
                        {/* Messages */}
                        {(() => {
                            let lastDateString = '';
                            return currentMessages.map((msg, index, array) => {
                                const attachedPoster = msg.posterId ? posters.find(p => p.id === msg.posterId) : null;
                                const isLastMessage = index === array.length - 1;
                                const showSeen = isLastMessage && msg.senderId === user?.id && msg.read;
                                const prevMsg = array[index - 1]; 
                                const nextMsg = array[index + 1]; 
                                const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                                const isLastConsecutive = !nextMsg || nextMsg.senderId !== msg.senderId;
                                const showAvatar = isLastConsecutive && msg.senderId !== user?.id;

                                const msgDateObj = new Date(msg.timestamp);
                                const justDate = msgDateObj.toLocaleDateString([], {
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: msgDateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                });
                                const timeStr = msgDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                
                                const showDateSeparator = justDate !== lastDateString;
                                if (showDateSeparator) {
                                    lastDateString = justDate;
                                }

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDateSeparator && (
                                            <div className="flex justify-center my-4">
                                                <span className="text-xs text-gray-400 font-medium">{justDate} {timeStr}</span>
                                            </div>
                                        )}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.1}
                                            onDragEnd={(e, info) => {
                                                if (info.offset.x > 50 || info.offset.x < -50) {
                                                    setReplyToMessage(msg);
                                                }
                                            }}
                                            className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'} ${!isLastConsecutive ? 'mb-[2px]' : 'mb-4'}`}
                                        >
                                    <div className="flex items-end gap-2 max-w-[70%]">
                                        {msg.senderId !== user?.id && (
                                            <div className="w-7 h-7 flex-shrink-0">
                                                {showAvatar && (
                                                    <OptimizedImage src={selectedUser.avatar} className="w-7 h-7 rounded-full object-cover" alt={selectedUser.username} containerClassName="w-7 h-7 rounded-full" />
                                                )}
                                            </div>
                                        )}
                                        <div className={`group relative flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2 text-[15px] leading-[1.3] flex flex-col gap-1 ${msg.senderId === user?.id ? 'bg-[#3797F0] text-white' : 'bg-[#EFEFEF] dark:bg-[#262626] text-black dark:text-white'} ${isConsecutive ? (msg.senderId === user?.id ? 'rounded-l-2xl rounded-tr-sm rounded-br-sm' : 'rounded-r-2xl rounded-tl-sm rounded-bl-sm') : (msg.senderId === user?.id ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm')} ${isLastConsecutive ? (msg.senderId === user?.id ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}>
                                                
                                                {msg.senderId === user?.id && (
                                                    <div className="absolute top-1/2 -translate-y-1/2 -left-12 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                        <button 
                                                            onClick={() => deleteMessage(selectedThreadId, msg.id)}
                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                                                            title="Unsend"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                {msg.replyToId && (() => {
                                                    const repliedMsg = currentMessages.find(m => m.id === msg.replyToId);
                                                    if (!repliedMsg) return null;
                                                    return (
                                                        <div className={`mb-1 pl-2 border-l-2 ${msg.senderId === user?.id ? 'border-white/50 text-white/80' : 'border-black/20 dark:border-white/20 text-black/60 dark:text-white/60'} text-xs bg-black/5 dark:bg-white/5 rounded-r-md p-1.5 max-h-[60px] overflow-hidden`}>
                                                            <span className="font-bold">{repliedMsg.senderId === user?.id ? 'You' : selectedUser.name}</span>
                                                            <p className="truncate opacity-80">{repliedMsg.text || (repliedMsg.imageUrl ? 'Photo' : 'Audio')}</p>
                                                        </div>
                                                    );
                                                })()}
                                                
                                                {attachedPoster && (
                                                    <div 
                                                        className="mb-2 rounded-xl overflow-hidden cursor-pointer bg-black/10 border border-black/5 hover:opacity-90 transition-opacity relative group" 
                                                        onClick={() => navigate(`/explore?poster=${attachedPoster.id}`)}
                                                    >
                                                        <OptimizedImage src={attachedPoster.imageUrl} alt={attachedPoster.title} className="w-full h-40 object-cover" containerClassName="w-full h-40" />
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                            <p className="text-sm font-semibold text-white truncate">{attachedPoster.title}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {msg.imageUrl && (
                                                    <div className="mb-2 rounded-xl overflow-hidden">
                                                        <OptimizedImage src={msg.imageUrl} alt="Uploaded image" className="max-w-xs max-h-64 object-cover rounded-xl" containerClassName="max-w-xs max-h-64 rounded-xl" />
                                                    </div>
                                                )}
                                                {msg.audioUrl && (
                                                    <div className="mb-2">
                                                        <audio controls src={msg.audioUrl} className="max-w-[200px] h-[40px] outline-none" />
                                                    </div>
                                                )}
                                                <span className="break-words">{msg.text}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {showSeen && (
                                        <span className="text-[11px] text-gray-500 mt-1 mr-2">
                                            Seen
                                        </span>
                                    )}
                                </motion.div>
                                </React.Fragment>
                            );
                        })})()}

                        {/* Typing Indicator */}
                        {isOtherUserTyping && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start mt-2"
                            >
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-1 w-fit">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </motion.div>
                        )}

                        {currentMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 h-full">
                                <OptimizedImage src={selectedUser.avatar} className="w-24 h-24 rounded-full object-cover mb-4" alt={selectedUser.username} containerClassName="w-24 h-24 rounded-full mb-4" />
                                <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
                                <p className="text-gray-500 text-sm mb-6">{selectedUser.username} • Instagram</p>
                                <button onClick={() => navigate(`/profile/${selectedUser.id}`)} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white font-semibold text-sm rounded-lg px-4 py-1.5 transition-colors">
                                    View profile
                                </button>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-black z-10 flex flex-col gap-2">
                        {errorMessage && (
                            <div className="text-red-500 text-xs font-bold px-4 py-2 bg-red-500/10 rounded-lg">
                                {errorMessage}
                            </div>
                        )}
                        {isBlocked(selectedUser.id) ? (
                            <div className="text-center text-red-500 font-bold p-4 bg-red-500/10 rounded-xl">
                                You have blocked this user. Unblock to send messages.
                            </div>
                        ) : (
                            (() => {
                                const isMutualFollow = isFollowing(selectedUser.id) && isFollowedBy(selectedUser.id);
                                const lastMessage = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1] : null;
                                const currentUserSentLastMessage = lastMessage?.senderId === user?.id;
                                const canSendMessage = isMutualFollow || !currentUserSentLastMessage;

                                if (!canSendMessage) {
                                    return (
                                        <div className="text-center text-gray-500 text-sm p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                            You can send more messages after they reply.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col gap-2">
                                        {replyToMessage && (
                                            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-3 relative ml-12">
                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                    <Reply size={20} className="text-gray-500" />
                                                    <div className="flex-1 min-w-0 text-sm">
                                                        <div className="font-bold text-black dark:text-white mb-0.5">Replying to {replyToMessage.senderId === user?.id ? 'Yourself' : selectedUser.name}</div>
                                                        <p className="text-gray-500 truncate">{replyToMessage.text || (replyToMessage.imageUrl ? 'Photo' : 'Audio')}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setReplyToMessage(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full ml-3">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-end gap-2 px-2 py-1">
                                            <div className="bg-[#3797F0] p-2 rounded-full text-white cursor-pointer hover:bg-blue-600 transition-colors flex-shrink-0 mb-0.5" onClick={() => toast('Camera coming soon!', { icon: '🚧' })}>
                                                <Camera size={20} />
                                            </div>
                                            <div className="flex-1 relative flex flex-col">
                                            <AnimatePresence>
                                                {showEmojiPicker && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute bottom-full left-0 mb-2 w-full max-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-3 z-50 flex gap-2 flex-wrap"
                                                    >
                                                        {EMOJIS.map(emoji => (
                                                            <button 
                                                                key={emoji}
                                                                onClick={() => {
                                                                    setNewMessage(prev => prev + emoji);
                                                                    // setShowEmojiPicker(false); // Optional: keep open for multiple emojis
                                                                }}
                                                                className="text-2xl hover:scale-125 transition-transform p-1 select-none"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 border border-transparent rounded-3xl md:rounded-full px-4 py-1.5 focus-within:border-gray-300 dark:focus-within:border-gray-600 transition-colors relative z-40 min-h-[44px]">
                                                {isRecording ? (
                                                    <div className="flex-1 flex items-center justify-between w-full anime-fade-in">
                                                        <div className="flex items-center gap-2 text-red-500">
                                                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                                            <span className="font-mono text-sm">{formatRecordingTime(recordingTime)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-black dark:text-white">
                                                            <button onClick={cancelRecording} className="p-1 hover:text-red-500 transition-colors">
                                                                <Trash2 size={20} />
                                                            </button>
                                                            <button onClick={stopRecording} className="p-1 hover:text-[#3797F0] transition-colors bg-white dark:bg-black rounded-full shadow-sm">
                                                                <CheckCircle2 size={24} className="text-[#3797F0]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <textarea 
                                                            placeholder="Message..." 
                                                            className="flex-1 bg-transparent border-none outline-none text-black dark:text-white placeholder-gray-500 min-h-[24px] max-h-[120px] text-[15px] resize-none py-1 block self-end"
                                                            value={newMessage}
                                                            onChange={(e) => {
                                                                handleTyping(e as any);
                                                                e.target.style.height = 'auto';
                                                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleSend();
                                                                    e.currentTarget.style.height = 'auto';
                                                                    setShowEmojiPicker(false);
                                                                }
                                                            }}
                                                            rows={1}
                                                        />
                                                        {!newMessage.trim() ? (
                                                            <div className="flex items-center gap-3 pl-2 text-black dark:text-white self-end pb-1">
                                                                <Mic size={24} className="cursor-pointer hover:opacity-70" onClick={startRecording} />
                                                                <ImageIcon size={24} className="cursor-pointer hover:opacity-70" onClick={() => fileInputRef.current?.click()} />
                                                                <Smile size={24} className={`cursor-pointer hover:opacity-70 ${showEmojiPicker ? 'text-[#3797F0]' : ''}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center pl-2 gap-3 self-end pb-1">
                                                                <Smile size={24} className={`cursor-pointer hover:opacity-70 ${showEmojiPicker ? 'text-[#3797F0]' : 'text-black dark:text-white'}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                                                                <button 
                                                                    onClick={() => { handleSend(); setShowEmojiPicker(false); }}
                                                                    className="text-[#3797F0] font-semibold text-sm hover:text-blue-600 transition-colors ml-1"
                                                                >
                                                                    Send
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-black dark:text-white h-full">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 border-black dark:border-white">
                          <svg aria-label="Direct" color="currentColor" fill="currentColor" height="48" role="img" viewBox="0 0 48 48" width="48"><path d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5ZM5.2 6.1h35.5L18 18.7 5.2 6.1Zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7Z"></path></svg>
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                      <p className="text-gray-500 text-sm mb-6">Send private photos and messages to a friend or group.</p>
                      <button onClick={() => setIsNewChatModalOpen(true)} className="bg-blue-500 text-white font-semibold text-sm rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors">
                          Send message
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* New Chat Modal - Instagram Style */}
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
      />
      <AnimatePresence>
      {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-[#262626] w-full max-w-[400px] rounded-xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
              >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="w-8"></div> {/* Spacer for centering */}
                    <h2 className="text-base font-semibold text-black dark:text-white">New message</h2>
                    <button onClick={() => setIsNewChatModalOpen(false)} className="p-1 hover:opacity-70 transition-opacity">
                        <X size={24} className="text-black dark:text-white" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-base font-semibold text-black dark:text-white">To:</span>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="bg-transparent border-none outline-none flex-1 text-black dark:text-white placeholder-gray-500 font-normal text-sm"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            autoFocus
                        />
                  </div>

                  {newChatError && (
                      <div className="text-red-500 text-xs font-bold px-4 py-2 bg-red-500/10">
                          {newChatError}
                      </div>
                  )}

                  {/* User List */}
                  <div className="flex-1 overflow-y-auto py-2">
                       {filteredUsers.length > 0 ? filteredUsers.map(u => (
                           <div 
                                key={u.id}
                                onClick={() => {
                                    startChat(u.id);
                                    setSearchUser('');
                                }}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                           >
                               <OptimizedImage src={u.avatar} className="w-11 h-11 rounded-full object-cover" alt={u.username} containerClassName="w-11 h-11 rounded-full" />
                               <div className="flex-1">
                                   <p className="font-semibold text-sm text-black dark:text-white leading-tight">{u.name}</p>
                                   <p className="text-sm text-gray-500">{u.username}</p>
                               </div>
                           </div>
                       )) : (
                           <div className="text-center text-gray-500 py-8 text-sm">No account found.</div>
                       )}
                  </div>
              </motion.div>
          </div>
      )}
      </AnimatePresence>
    </div>
  );
};
