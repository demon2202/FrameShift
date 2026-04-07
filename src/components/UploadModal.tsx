import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Type, Smile, Film, Grid, Maximize, Square, Edit2, Sparkles, Check, RotateCw } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { Poster } from '../types';
import { ImageEditor } from './ImageEditor';
import { OptimizedImage } from './ui/OptimizedImage';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { user, addPoster, addStory, compressImage, submitToChallenge, challenge, uploadModalMode, setUploadModalMode } = useGlobalContext();
  
  // Poster State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'original' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16'>('original');
  const [rotation, setRotation] = useState<number>(0);
  const [addWatermark, setAddWatermark] = useState(false);
  const [isEditingPoster, setIsEditingPoster] = useState(false);
  
  // Story State
  const [storyImages, setStoryImages] = useState<string[]>([]);
  const [layout, setLayout] = useState<'full' | 'frame' | 'split'>('full');
  const [bgColor, setBgColor] = useState('#1a1a1a');
  
  // Multi-element State
  const [storyTexts, setStoryTexts] = useState<Array<{id: string, text: string, x: number, y: number, animation: string, color: string}>>([]);
  const [storyEmojis, setStoryEmojis] = useState<Array<{id: string, char: string, x: number, y: number, animation: string}>>([]);
  const [storyOverlays, setStoryOverlays] = useState<Array<{id: string, src: string, x: number, y: number, scale: number, rotation: number}>>([]);
  
  // UI State
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [activeEmojiId, setActiveEmojiId] = useState<string | null>(null);
  const [currentInputText, setCurrentInputText] = useState('');
  const [currentAnimation, setCurrentAnimation] = useState<'none' | 'pulse' | 'bounce' | 'spin' | 'wiggle' | 'float'>('none');
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [gifSearch, setGifSearch] = useState('');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Image Editing
  const [editingStoryIndex, setEditingStoryIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const targetImageIndex = useRef<number | null>(null);

  const EMOJIS = [
    '🔥', '✨', '💀', '🎨', '👀', '🚀', '💻', '💯', '❤️', '🎉', '😎', '🤔', '🌈', '⚡',
    '🍕', '🍔', '🍟', '🍺', '🍷', '🍸', '🎵', '🎶', '🎸', '🎹', '📷', '📹', '🎬', '🎭',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎲', '🎮', '🕹️', '👾', '👽', '👻', '🤖',
    '🌍', '🌎', '🌏', '🗺️', '🧭', '🏔️', '🌋', 'camping', '🏖️', '🏝️', '🏜️', '🏰', '🏯',
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', 'cow', '🐷', '🐸',
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌',
    '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓',
    '👋', 'QwQ', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙'
  ];

  const GIFS = [
    { id: '1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp1Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4/3o7TKSjRrfIPjeiVyM/giphy.gif', tags: ['funny', 'cat'] },
    { id: '2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp1Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4/l0HlHFRb68qJKyiy4/giphy.gif', tags: ['dance', 'party'] },
    { id: '3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp1Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4/3o6Zxp9s5y78955236/giphy.gif', tags: ['wow', 'surprise'] },
    { id: '4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp1Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4Z2J0a3Z5eGZ4/l0MYt5qxb6d3y7a6k/giphy.gif', tags: ['cool', 'sunglasses'] },
    { id: '5', url: 'https://media.giphy.com/media/26tPplGWjN0xLyqwU/giphy.gif', tags: ['happy', 'smile'] },
    { id: '6', url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', tags: ['confused', 'what'] },
    { id: '7', url: 'https://media.giphy.com/media/l0HlO3BJ8LALPW4sE/giphy.gif', tags: ['laugh', 'lol'] },
    { id: '8', url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif', tags: ['yes', 'agree'] },
    { id: '9', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', tags: ['no', 'stop'] },
    { id: '10', url: 'https://media.giphy.com/media/l2JhtVkTPkd7q3lQc/giphy.gif', tags: ['love', 'heart'] },
    { id: '11', url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', tags: ['cat', 'cute'] },
    { id: '12', url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', tags: ['dog', 'funny'] },
    { id: '13', url: 'https://media.giphy.com/media/3o7TKr3nzbh5QiTt2Q/giphy.gif', tags: ['sad', 'cry'] },
    { id: '14', url: 'https://media.giphy.com/media/l0HlO3BJ8LALPW4sE/giphy.gif', tags: ['angry', 'mad'] },
    { id: '15', url: 'https://media.giphy.com/media/3o7TKsQ8gC3t3t3t3t/giphy.gif', tags: ['shocked', 'omg'] },
    { id: '16', url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', tags: ['excited', 'yay'] },
    { id: '17', url: 'https://media.giphy.com/media/3o7TKsQ8gC3t3t3t3t/giphy.gif', tags: ['bored', 'meh'] },
    { id: '18', url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', tags: ['tired', 'sleepy'] },
    { id: '19', url: 'https://media.giphy.com/media/3o7TKsQ8gC3t3t3t3t/giphy.gif', tags: ['hungry', 'food'] },
    { id: '20', url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', tags: ['thirsty', 'drink'] },
    { id: '21', url: 'https://media.giphy.com/media/3o7TKsQ8gC3t3t3t3t/giphy.gif', tags: ['work', 'busy'] },
    { id: '22', url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', tags: ['study', 'school'] },
    { id: '23', url: 'https://media.giphy.com/media/3o7TKsQ8gC3t3t3t3t/giphy.gif', tags: ['gym', 'workout'] },
    { id: '24', url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', tags: ['travel', 'vacation'] },
  ];
  
  const filteredGifs = GIFS.filter(g => g.tags.some(t => t.includes(gifSearch.toLowerCase())));
  
  const COLORS = ['#1a1a1a', '#ffffff', '#ccff00', '#ff0055', '#00ccff', '#ffcc00', '#8a2be2'];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Security: Close modal if user logs out or is not logged in
  useEffect(() => {
      if (isOpen && !user) {
          onClose();
      }
  }, [isOpen, user, onClose]);

  const triggerImageUpload = (index: number | null = null) => {
      targetImageIndex.current = index;
      fileInputRef.current?.click();
  };

  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      try {
        for (const file of Array.from(files)) {
          const rawBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          const compressed = await compressImage(rawBase64, 800, 0.7);
          
          if (uploadModalMode === 'poster') {
            setPosterImage(compressed);
            setIsEditingPoster(true);
          } else {
            if (layout === 'split') {
                setStoryImages(prev => {
                    const newImages = [...prev];
                    const limit = 2;
                    
                    if (targetImageIndex.current !== null) {
                        // Explicit replacement of a specific slot
                        if (targetImageIndex.current < limit) {
                            newImages[targetImageIndex.current] = compressed;
                        }
                        return newImages;
                    } else {
                        // "Add Image" button logic for split
                        if (!newImages[0]) {
                            newImages[0] = compressed;
                            return newImages;
                        }
                        if (!newImages[1]) {
                            newImages[1] = compressed;
                            return newImages;
                        }
                        newImages[1] = compressed;
                        return newImages;
                    }
                });
            } else {
                // Full/Frame mode
                if (targetImageIndex.current !== null) {
                    // Explicit replacement of background
                    setStoryImages(prev => {
                        const newImages = [...prev];
                        newImages[0] = compressed;
                        return newImages;
                    });
                } else {
                    // "Add Image" button logic
                    setStoryImages(prev => {
                        if (prev.length === 0) {
                            // First image becomes background
                            return [compressed];
                        } else {
                            // Subsequent images become overlays
                            const newOverlay = { 
                                id: `o_${Date.now()}_${Math.random()}`, 
                                src: compressed, 
                                x: 0.5, 
                                y: 0.5, 
                                scale: 0.3, // Start small (30% width)
                                rotation: 0 
                            };
                            setStoryOverlays(prevOverlays => [...prevOverlays, newOverlay]);
                            setActiveOverlayId(newOverlay.id);
                            return prev; // Don't change background
                        }
                    });
                }
            }
          }
        }
      } finally {
        setIsCompressing(false);
      }
    }
    e.target.value = '';
    targetImageIndex.current = null;
  };

  const addText = () => {
      const newId = `t_${Date.now()}`;
      // Randomize position slightly to avoid overlap
      const x = 0.5 + (Math.random() * 0.2 - 0.1);
      const y = 0.5 + (Math.random() * 0.2 - 0.1);
      const newText = { id: newId, text: 'New Text', x, y, animation: 'none', color: '#ffffff' };
      setStoryTexts(prev => [...prev, newText]);
      setActiveTextId(newId);
      setCurrentInputText('New Text');
      setCurrentAnimation('none');
  };

  const updateActiveText = (text: string) => {
      if (!activeTextId) return;
      setCurrentInputText(text);
      setStoryTexts(prev => prev.map(t => t.id === activeTextId ? { ...t, text } : t));
  };

  const updateActiveAnimation = (anim: string) => {
      if (!activeTextId) return;
      setCurrentAnimation(anim as any);
      setStoryTexts(prev => prev.map(t => t.id === activeTextId ? { ...t, animation: anim } : t));
  };

  const addEmoji = useCallback((char: string) => {
      // Randomize position slightly
      const x = 0.5 + (Math.random() * 0.2 - 0.1);
      const y = 0.5 + (Math.random() * 0.2 - 0.1);
      const newEmoji = { id: `e_${Date.now()}`, char, x, y, animation: 'none' };
      setStoryEmojis(prev => [...prev, newEmoji]);
  }, []);

  const addTimeOverlay = useCallback(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `t_${Date.now()}`;
    const newText = { id: newId, text: timeString, x: 0.5, y: 0.5, animation: 'none', color: '#ffffff' };
    setStoryTexts(prev => [...prev, newText]);
    setActiveTextId(newId);
    setCurrentInputText(timeString);
    setCurrentAnimation('none');
  }, []);

  const addDateOverlay = useCallback(() => {
    const now = new Date();
    const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const newId = `t_${Date.now()}`;
    const newText = { id: newId, text: dateString, x: 0.5, y: 0.5, animation: 'none', color: '#ffffff' };
    setStoryTexts(prev => [...prev, newText]);
    setActiveTextId(newId);
    setCurrentInputText(dateString);
    setCurrentAnimation('none');
  }, []);

  const addDayOverlay = useCallback(() => {
    const now = new Date();
    const dayString = now.toLocaleDateString([], { weekday: 'long' });
    const newId = `t_${Date.now()}`;
    const newText = { id: newId, text: dayString, x: 0.5, y: 0.5, animation: 'none', color: '#ffffff' };
    setStoryTexts(prev => [...prev, newText]);
    setActiveTextId(newId);
    setCurrentInputText(dayString);
    setCurrentAnimation('none');
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setBgColor(color);
    if (!recentColors.includes(color)) {
        setRecentColors(prev => [color, ...prev].slice(0, 5));
    }
  }, [recentColors]);

  const addGifOverlay = useCallback((url: string) => {
      const newOverlay = { 
          id: `o_${Date.now()}_${Math.random()}`, 
          src: url, 
          x: 0.5, 
          y: 0.5, 
          scale: 0.3, 
          rotation: 0 
      };
      setStoryOverlays(prevOverlays => [...prevOverlays, newOverlay]);
      setActiveOverlayId(newOverlay.id);
      setShowGifPicker(false);
  }, []);

  const handleSaveEditedStoryImage = (editedImage: string) => {
      if (editingStoryIndex !== null) {
          setStoryImages(prev => {
              const newImages = [...prev];
              newImages[editingStoryIndex] = editedImage;
              return newImages;
          });
          setEditingStoryIndex(null);
      }
  };

  const generateCompositeStory = async (): Promise<string | null> => {
    if (storyImages.length === 0 && storyTexts.length === 0) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set standard story dimensions (9:16 aspect ratio)
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Images based on Layout
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    try {
        if (storyImages.length > 0) {
            if (layout === 'full') {
                const img = await loadImage(storyImages[0]);
                // Cover fit
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else if (layout === 'frame') {
                const img = await loadImage(storyImages[0]);
                // Contain fit with margin
                const margin = 100;
                const availWidth = canvas.width - (margin * 2);
                const availHeight = canvas.height - (margin * 2);
                const scale = Math.min(availWidth / img.width, availHeight / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;
                
                // Drop shadow
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 50;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 20;
                ctx.drawImage(img, x, y, w, h);
                ctx.shadowColor = "transparent";
            } else if (layout === 'split') {
                // Top Image
                if (storyImages[0]) {
                    const img1 = await loadImage(storyImages[0]);
                    const h = canvas.height / 2;
                    const scale = Math.max(canvas.width / img1.width, h / img1.height);
                    const x = (canvas.width - img1.width * scale) / 2;
                    const y = (h - img1.height * scale) / 2;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, 0, canvas.width, h);
                    ctx.clip();
                    ctx.drawImage(img1, x, y, img1.width * scale, img1.height * scale);
                    ctx.restore();
                }
                // Bottom Image
                if (storyImages[1]) {
                    const img2 = await loadImage(storyImages[1]);
                    const h = canvas.height / 2;
                    const scale = Math.max(canvas.width / img2.width, h / img2.height);
                    const x = (canvas.width - img2.width * scale) / 2;
                    const y = h + (h - img2.height * scale) / 2;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, h, canvas.width, h);
                    ctx.clip();
                    ctx.drawImage(img2, x, y, img2.width * scale, img2.height * scale);
                    ctx.restore();
                }
                // Split line
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, canvas.height / 2 - 2, canvas.width, 4);
            }
        }

        // 3. Image Overlays
        for (const overlay of storyOverlays) {
            const img = await loadImage(overlay.src);
            const w = canvas.width * overlay.scale;
            const h = (img.height / img.width) * w;
            const x = canvas.width * overlay.x;
            const y = canvas.height * overlay.y;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((overlay.rotation * Math.PI) / 180);
            ctx.drawImage(img, -w/2, -h/2, w, h);
            ctx.restore();
        }

        // 4. Text Overlay
        storyTexts.forEach(textObj => {
            ctx.fillStyle = textObj.color;
            ctx.font = "900 80px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            const x = canvas.width * textObj.x;
            const y = canvas.height * textObj.y;

            ctx.fillText(textObj.text, x, y); 
        });

        // 4. Emoji
        storyEmojis.forEach(emojiObj => {
            ctx.font = "150px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const x = canvas.width * emojiObj.x;
            const y = canvas.height * emojiObj.y;
            ctx.fillText(emojiObj.char, x, y);
        });

    } catch (e) {
        console.error("Composition failed", e);
        return storyImages[0] || null; // Fallback
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const processPosterImage = useCallback(async (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageSrc);

        // 1. Calculate rotated dimensions
        const isRotated = rotation % 180 !== 0;
        const rotWidth = isRotated ? img.height : img.width;
        const rotHeight = isRotated ? img.width : img.height;

        // 2. Calculate aspect ratio crop
        let targetWidth = rotWidth;
        let targetHeight = rotHeight;

        if (aspectRatio !== 'original') {
            const [wRatio, hRatio] = aspectRatio.split(':').map(Number);
            const targetRatio = wRatio / hRatio;
            const currentRatio = rotWidth / rotHeight;

            if (currentRatio > targetRatio) {
                // Image is wider than target. Crop width.
                targetWidth = rotHeight * targetRatio;
            } else {
                // Image is taller than target. Crop height.
                targetHeight = rotWidth / targetRatio;
            }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 3. Draw with rotation and crop
        ctx.save();
        // Move to center of canvas
        ctx.translate(targetWidth / 2, targetHeight / 2);
        // Rotate
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Draw image centered
        // The source image needs to be drawn so its center aligns with the canvas center
        // We also need to account for the crop.
        // If we just draw the whole image centered, the canvas will clip it correctly.
        ctx.drawImage(
            img, 
            -img.width / 2, 
            -img.height / 2, 
            img.width, 
            img.height
        );
        ctx.restore();

        if (addWatermark && user) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`@${user.username || 'unknown'}`, targetWidth - 20, targetHeight - 20);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageSrc;
    });
  }, [aspectRatio, rotation, addWatermark, user]);

  useEffect(() => {
    if (posterImage) {
        processPosterImage(posterImage).then(setPreviewImage);
    } else {
        setPreviewImage(null);
    }
  }, [posterImage, processPosterImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (uploadModalMode === 'poster') {
        if (!posterImage) return;
        const finalImage = await processPosterImage(posterImage);
        const newPoster: Poster = {
            id: `p-${Date.now()}`,
            title,
            description: desc,
            imageUrl: finalImage,
            creatorId: user.id,
            creator: user,
            likes: 0,
            tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            createdAt: new Date().toISOString(),
            colors: ['#000000', '#ffffff'],
            license: 'personal'
        };
        await addPoster(newPoster);
        submitToChallenge(newPoster.id);
    } else {
        const finalImage = await generateCompositeStory();
        if (finalImage) {
            await addStory(finalImage);
        }
    }

    setIsLoading(false);
    setIsSuccess(true);
    
    // Wait for success animation
    setTimeout(() => {
        setIsSuccess(false);
        onClose();
        
        // Reset
        setTitle('');
        setDesc('');
        setTags('');
        setPosterImage(null);
        setStoryImages([]);
        setStoryTexts([]);
        setStoryEmojis([]);
        setActiveTextId(null);
        setCurrentInputText('');
        setCurrentAnimation('none');
        setSelectedGif(null);
        setLayout('full');
        setBgColor('#1a1a1a');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          {isEditingPoster && posterImage ? (
              <ImageEditor 
                  imageSrc={posterImage}
                  aspectRatio={
                      aspectRatio === '1:1' ? 1 :
                      aspectRatio === '4:3' ? 4/3 :
                      aspectRatio === '3:4' ? 3/4 :
                      aspectRatio === '16:9' ? 16/9 :
                      aspectRatio === '9:16' ? 9/16 : 
                      'original'
                  }
                  onSave={(editedImage) => {
                      setPosterImage(editedImage);
                      setIsEditingPoster(false);
                      setAspectRatio('original');
                      setRotation(0);
                  }}
                  onCancel={() => setIsEditingPoster(false)}
              />
          ) : editingStoryIndex !== null && storyImages[editingStoryIndex] ? (
              <ImageEditor 
                  imageSrc={storyImages[editingStoryIndex]}
                  aspectRatio={layout === 'split' ? 9/8 : 9/16} // Approx ratios
                  onSave={handleSaveEditedStoryImage}
                  onCancel={() => setEditingStoryIndex(null)}
              />
          ) : (
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl bg-olive-dark border-2 border-neon-lime/20 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
            >
                {isSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-olive-dark/95 backdrop-blur-xl"
                    >
                        <div className="text-center">
                            <motion.div 
                                initial={{ scale: 0, rotate: -180 }} 
                                animate={{ scale: 1, rotate: 0 }} 
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="w-24 h-24 bg-neon-lime rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(204,255,0,0.4)]"
                            >
                                <Check size={48} className="text-olive-dark stroke-[3]" />
                            </motion.div>
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-display font-black text-white uppercase mb-2 tracking-tight"
                            >
                                Published!
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-cream/60 font-mono uppercase tracking-widest text-sm"
                            >
                                Your masterpiece is live.
                            </motion.p>
                        </div>
                    </motion.div>
                )}

                {/* Left Side: Preview */}
                <div className="w-full md:w-1/2 bg-black/40 relative flex items-center justify-center p-4 overflow-hidden min-h-[400px]">
                    {isCompressing && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="w-12 h-12 border-4 border-neon-lime border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-neon-lime font-bold uppercase tracking-widest text-sm">Processing Image...</p>
                        </div>
                    )}
                    {uploadModalMode === 'poster' ? (
                        <div 
                            onClick={() => triggerImageUpload(null)}
                            className={`relative w-full rounded-xl border-2 border-dashed border-white/20 hover:border-neon-lime/50 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-white/5 ${previewImage ? 'border-none' : 'aspect-[3/4]'}`}
                        >
                            {previewImage ? (
                                <div className="relative w-full h-full group">
                                    <OptimizedImage src={previewImage} className="w-full h-auto object-contain max-h-[600px]" containerClassName="w-full h-auto" alt="Preview" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsEditingPoster(true); }}
                                        className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-lime hover:text-black shadow-lg"
                                        title="Edit Focus / Crop"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center p-6">
                                    <Upload size={32} className="text-cream/60 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-cream uppercase">Upload Poster</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Story Preview Canvas
                        <div 
                            ref={previewRef}
                            className="relative w-full aspect-[9/16] max-h-[600px] bg-white shadow-2xl overflow-hidden rounded-lg"
                            style={{ backgroundColor: bgColor }}
                            onClick={() => { setActiveTextId(null); setActiveOverlayId(null); setActiveEmojiId(null); }} // Deselect text and overlay on background click
                        >
                            {/* Layout Rendering */}
                            {layout === 'full' && storyImages[0] && (
                                <div className="relative w-full h-full group">
                                    <OptimizedImage src={storyImages[0]} className="w-full h-full object-cover" containerClassName="w-full h-full" alt="Story Image" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingStoryIndex(0); }}
                                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-lime hover:text-black"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                            
                            {layout === 'frame' && storyImages[0] && (
                                <div className="absolute inset-8 shadow-2xl group">
                                    <OptimizedImage src={storyImages[0]} className="w-full h-full object-cover" containerClassName="w-full h-full" alt="Story Image" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingStoryIndex(0); }}
                                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-lime hover:text-black"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}

                            {layout === 'split' && (
                                <div className="flex flex-col h-full">
                                    <div className="h-1/2 w-full relative border-b-2 border-white overflow-hidden bg-white/10 group">
                                        {storyImages[0] ? (
                                            <>
                                                <OptimizedImage src={storyImages[0]} className="w-full h-full object-cover" containerClassName="w-full h-full" alt="Story Image 1" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingStoryIndex(0); }}
                                                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-lime hover:text-black"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); triggerImageUpload(0); }}
                                                className="absolute inset-0 flex items-center justify-center text-white/20 font-black text-4xl cursor-pointer hover:bg-white/20 transition-colors"
                                            >
                                                <Upload size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-1/2 w-full relative overflow-hidden bg-white/10 group">
                                        {storyImages[1] ? (
                                            <>
                                                <OptimizedImage src={storyImages[1]} className="w-full h-full object-cover" containerClassName="w-full h-full" alt="Story Image 2" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingStoryIndex(1); }}
                                                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-lime hover:text-black"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); triggerImageUpload(1); }}
                                                className="absolute inset-0 flex items-center justify-center text-white/20 font-black text-4xl cursor-pointer hover:bg-white/20 transition-colors"
                                            >
                                                <Upload size={32} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Image Overlays - Draggable */}
                            {storyOverlays.map((overlay) => (
                                <motion.div 
                                    key={overlay.id}
                                    drag
                                    dragMomentum={false}
                                    dragConstraints={previewRef}
                                    onDragEnd={(e, info) => {
                                        if (previewRef.current) {
                                            const rect = previewRef.current.getBoundingClientRect();
                                            // Calculate new position based on pointer, clamped to 0-1
                                            const rawX = (info.point.x - rect.left) / rect.width;
                                            const rawY = (info.point.y - rect.top) / rect.height;
                                            const x = Math.max(0, Math.min(1, rawX));
                                            const y = Math.max(0, Math.min(1, rawY));
                                            setStoryOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, x, y } : o));
                                        }
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setActiveOverlayId(overlay.id); setActiveTextId(null); setActiveEmojiId(null); }}
                                    className={`absolute cursor-move group ${activeOverlayId === overlay.id ? 'ring-2 ring-neon-lime' : ''}`}
                                    style={{ 
                                        left: `${overlay.x * 100}%`, 
                                        top: `${overlay.y * 100}%`,
                                        x: '-50%',
                                        y: '-50%',
                                        width: `${overlay.scale * 100}%`,
                                        rotate: overlay.rotation
                                    }}
                                >
                                    <OptimizedImage src={overlay.src} className="w-full h-auto pointer-events-none drop-shadow-lg" containerClassName="w-full h-auto" alt="Overlay" />
                                    
                                    {/* Controls for Overlay (Only when active) */}
                                    {activeOverlayId === overlay.id && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-2 py-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStoryOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, scale: Math.max(0.1, o.scale - 0.05) } : o));
                                                }}
                                                className="text-white hover:text-neon-lime text-xs font-bold"
                                            >-</button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStoryOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, scale: Math.min(1, o.scale + 0.05) } : o));
                                                }}
                                                className="text-white hover:text-neon-lime text-xs font-bold"
                                            >+</button>
                                            <div className="w-px h-3 bg-white/20 self-center" />
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStoryOverlays(prev => prev.filter(o => o.id !== overlay.id));
                                                    setActiveOverlayId(null);
                                                }}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Overlays - Draggable */}
                            {storyTexts.map((textObj) => (
                                <motion.div 
                                    key={textObj.id}
                                    drag
                                    dragMomentum={false}
                                    dragConstraints={previewRef}
                                    onDragEnd={(e, info) => {
                                        if (previewRef.current) {
                                            const rect = previewRef.current.getBoundingClientRect();
                                            const rawX = (info.point.x - rect.left) / rect.width;
                                            const rawY = (info.point.y - rect.top) / rect.height;
                                            const x = Math.max(0, Math.min(1, rawX));
                                            const y = Math.max(0, Math.min(1, rawY));
                                            setStoryTexts(prev => prev.map(t => t.id === textObj.id ? { ...t, x, y } : t));
                                        }
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setActiveTextId(textObj.id); setCurrentInputText(textObj.text); setCurrentAnimation(textObj.animation as any); setActiveOverlayId(null); setActiveEmojiId(null); }}
                                    className={`absolute cursor-move flex items-center justify-center ${
                                        textObj.animation === 'pulse' ? 'animate-pulse' : 
                                        textObj.animation === 'bounce' ? 'animate-bounce' : 
                                        textObj.animation === 'spin' ? 'animate-spin' : 
                                        textObj.animation === 'wiggle' ? 'animate-wiggle' :
                                        textObj.animation === 'float' ? 'animate-float' : ''
                                    } ${activeTextId === textObj.id ? 'ring-2 ring-neon-lime' : ''}`}
                                    style={{ 
                                        left: `${textObj.x * 100}%`, 
                                        top: `${textObj.y * 100}%`,
                                        x: '-50%',
                                        y: '-50%'
                                    }}
                                >
                                    <span className="text-3xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase font-display text-center px-4 break-words max-w-full select-none">
                                        {textObj.text}
                                    </span>
                                </motion.div>
                            ))}
                            
                            {storyEmojis.map((emojiObj) => (
                                <motion.div 
                                    key={emojiObj.id}
                                    drag
                                    dragMomentum={false}
                                    dragConstraints={previewRef}
                                    onDragEnd={(e, info) => {
                                        if (previewRef.current) {
                                            const rect = previewRef.current.getBoundingClientRect();
                                            const rawX = (info.point.x - rect.left) / rect.width;
                                            const rawY = (info.point.y - rect.top) / rect.height;
                                            const x = Math.max(0, Math.min(1, rawX));
                                            const y = Math.max(0, Math.min(1, rawY));
                                            setStoryEmojis(prev => prev.map(e => e.id === emojiObj.id ? { ...e, x, y } : e));
                                        }
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setActiveEmojiId(emojiObj.id); setActiveTextId(null); setActiveOverlayId(null); }}
                                    className={`absolute cursor-move text-6xl select-none group ${
                                        emojiObj.animation === 'pulse' ? 'animate-pulse' : 
                                        emojiObj.animation === 'bounce' ? 'animate-bounce' : 
                                        emojiObj.animation === 'spin' ? 'animate-spin' : 
                                        emojiObj.animation === 'wiggle' ? 'animate-wiggle' :
                                        emojiObj.animation === 'float' ? 'animate-float' : ''
                                    } ${activeEmojiId === emojiObj.id ? 'ring-2 ring-neon-lime rounded-lg' : ''}`}
                                    style={{ 
                                        left: `${emojiObj.x * 100}%`, 
                                        top: `${emojiObj.y * 100}%`,
                                        x: '-50%',
                                        y: '-50%'
                                    }}
                                >
                                    {emojiObj.char}
                                    
                                    {/* Delete Button for Emoji */}
                                    {activeEmojiId === emojiObj.id && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStoryEmojis(prev => prev.filter(e => e.id !== emojiObj.id));
                                                setActiveEmojiId(null);
                                            }}
                                            className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-50"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                            
                            {selectedGif && (
                                <div className="absolute bottom-4 right-4 w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                                    <OptimizedImage src={selectedGif} className="w-full h-full object-cover" containerClassName="w-full h-full" alt="Selected GIF" />
                                </div>
                            )}

                            {/* Empty State Overlay */}
                            {storyImages.length === 0 && layout !== 'split' && (
                                <div 
                                    onClick={() => triggerImageUpload(null)}
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center mx-auto mb-2 text-white">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-xs font-bold text-white/50 uppercase">Tap to Upload</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Controls */}
                <div className="w-full md:w-1/2 flex flex-col h-full max-h-[90vh]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setUploadModalMode('poster')}
                                className={`text-sm font-bold uppercase tracking-widest transition-colors ${uploadModalMode === 'poster' ? 'text-neon-lime' : 'text-cream/40'}`}
                            >
                                Poster
                            </button>
                            <button 
                                onClick={() => setUploadModalMode('story')}
                                className={`text-sm font-bold uppercase tracking-widest transition-colors ${uploadModalMode === 'story' ? 'text-neon-lime' : 'text-cream/40'}`}
                            >
                                Story
                            </button>
                        </div>
                        <button onClick={onClose} className="text-cream/40 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Challenge Banner */}
                    {uploadModalMode === 'poster' && challenge && (
                        <div className="px-6 pt-4">
                            <div className="p-4 bg-neon-lime/5 border border-neon-lime/20 rounded-xl flex items-start gap-3">
                                <div className="p-2 bg-neon-lime/10 rounded-full text-neon-lime flex-shrink-0">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-neon-lime uppercase font-bold mb-1 tracking-widest">Daily Challenge</p>
                                    <p className="text-sm font-bold text-white uppercase tracking-tight mb-1">{challenge.topic} <span className="text-white/60 font-normal normal-case">- {challenge.subtopic}</span></p>
                                    <p className="text-[10px] text-white/60 leading-relaxed font-mono">{challenge.description}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {uploadModalMode === 'story' ? (
                            <>
                                {/* Layout Selector */}
                                <div>
                                    <label className="text-xs font-bold text-cream/40 uppercase tracking-widest block mb-3">Layout</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setLayout('full')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 flex-1 transition-all ${layout === 'full' ? 'bg-neon-lime text-black border-neon-lime' : 'bg-white/5 text-cream border-white/10'}`}>
                                            <Maximize size={20} />
                                            <span className="text-[10px] font-bold uppercase">Full</span>
                                        </button>
                                        <button onClick={() => setLayout('frame')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 flex-1 transition-all ${layout === 'frame' ? 'bg-neon-lime text-black border-neon-lime' : 'bg-white/5 text-cream border-white/10'}`}>
                                            <Square size={20} />
                                            <span className="text-[10px] font-bold uppercase">Frame</span>
                                        </button>
                                        <button onClick={() => setLayout('split')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 flex-1 transition-all ${layout === 'split' ? 'bg-neon-lime text-black border-neon-lime' : 'bg-white/5 text-cream border-white/10'}`}>
                                            <Grid size={20} />
                                            <span className="text-[10px] font-bold uppercase">Split</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Background Color */}
                                {(layout === 'frame' || layout === 'split') && (
                                    <div>
                                        <label className="text-xs font-bold text-cream/40 uppercase tracking-widest block mb-3">Background</label>
                                        <div className="flex gap-2 flex-wrap items-center">
                                            <label className="w-8 h-8 rounded-full cursor-pointer border border-white/20 relative overflow-hidden group hover:border-neon-lime transition-colors">
                                                <input 
                                                    type="color" 
                                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0"
                                                    onChange={(e) => handleColorSelect(e.target.value)}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-white/10 to-transparent">
                                                    <div className="w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-50" />
                                                </div>
                                            </label>
                                            {recentColors.map(c => (
                                                <button 
                                                    key={`recent-${c}`}
                                                    onClick={() => setBgColor(c)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                            {COLORS.map(c => (
                                                <button 
                                                    key={c}
                                                    onClick={() => setBgColor(c)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tools */}
                                <div>
                                    <label className="text-xs font-bold text-cream/40 uppercase tracking-widest block mb-3">Tools</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={addText} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all bg-white/5 text-cream border-white/10 hover:bg-white/10`}>
                                            <Type size={18} />
                                            <span className="text-[10px] font-bold">TEXT</span>
                                        </button>
                                        <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${showEmojiPicker ? 'bg-neon-lime text-black border-neon-lime' : 'bg-white/5 text-cream border-white/10'}`}>
                                            <Smile size={18} />
                                            <span className="text-[10px] font-bold">EMOJI</span>
                                        </button>
                                        <button onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${showGifPicker ? 'bg-neon-lime text-black border-neon-lime' : 'bg-white/5 text-cream border-white/10'}`}>
                                            <Film size={18} />
                                            <span className="text-[10px] font-bold">GIF</span>
                                        </button>
                                        <button onClick={() => triggerImageUpload(null)} className="p-3 rounded-xl border border-white/10 bg-white/5 text-cream flex flex-col items-center gap-1 hover:bg-white/10">
                                            <Upload size={18} />
                                            <span className="text-[10px] font-bold">IMAGE</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <button onClick={addTimeOverlay} className="p-3 rounded-xl border border-white/10 bg-white/5 text-cream flex flex-col items-center gap-1 hover:bg-white/10">
                                            <div className="relative">
                                                <div className="absolute inset-0 border-2 border-current rounded-full opacity-30" />
                                                <div className="w-[18px] h-[18px] flex items-center justify-center font-mono text-[10px] font-bold">
                                                    {new Date().getHours()}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold">TIME</span>
                                        </button>
                                        <button onClick={addDateOverlay} className="p-3 rounded-xl border border-white/10 bg-white/5 text-cream flex flex-col items-center gap-1 hover:bg-white/10">
                                            <Grid size={18} />
                                            <span className="text-[10px] font-bold">DATE</span>
                                        </button>
                                        <button onClick={addDayOverlay} className="p-3 rounded-xl border border-white/10 bg-white/5 text-cream flex flex-col items-center gap-1 hover:bg-white/10">
                                            <Square size={18} />
                                            <span className="text-[10px] font-bold">DAY</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Text Controls */}
                                {activeTextId && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-cream/40 uppercase tracking-widest">Edit Text</label>
                                            <button onClick={() => {
                                                setStoryTexts(prev => prev.filter(t => t.id !== activeTextId));
                                                setActiveTextId(null);
                                            }} className="text-[10px] text-red-400 font-bold uppercase hover:text-red-300">Delete</button>
                                        </div>
                                        <input 
                                            type="text" 
                                            value={currentInputText}
                                            onChange={(e) => updateActiveText(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-cream focus:border-neon-lime outline-none text-sm"
                                            placeholder="Type your story..."
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                            {['none', 'pulse', 'bounce', 'spin', 'wiggle', 'float'].map(anim => (
                                                <button 
                                                    key={anim}
                                                    onClick={() => updateActiveAnimation(anim)} 
                                                    className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase ${currentAnimation === anim ? 'bg-neon-lime text-black border-neon-lime' : 'border-white/10 text-cream'}`}
                                                >
                                                    {anim}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Pickers */}
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="flex gap-2 flex-wrap p-3 bg-white/5 rounded-xl border border-white/10">
                                                {EMOJIS.map(emoji => (
                                                    <button key={emoji} onClick={() => addEmoji(emoji)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>
                                                ))}
                                            </div>
                                            <div className="text-[10px] text-cream/40 uppercase font-mono mt-2">Drag emoji in preview to position</div>
                                        </motion.div>
                                    )}
                                    {showGifPicker && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                                <input 
                                                    type="text" 
                                                    placeholder="Search GIFs..." 
                                                    value={gifSearch}
                                                    onChange={(e) => setGifSearch(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-cream focus:border-neon-lime outline-none text-xs mb-3"
                                                />
                                                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                    {filteredGifs.map((gif) => (
                                                        <button key={gif.id} onClick={() => addGifOverlay(gif.url)} className="aspect-square rounded-md overflow-hidden border border-white/10 hover:border-neon-lime transition-colors relative group">
                                                            <OptimizedImage src={gif.url} className="w-full h-full object-cover" containerClassName="w-full h-full" alt="GIF" />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white text-xs font-bold">+</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            // Poster Form
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none font-medium"
                                        placeholder="e.g. Neon Dreams"
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Aspect Ratio</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['original', '1:1', '4:3', '3:4', '16:9', '9:16'].map(ratio => (
                                                <button 
                                                    key={ratio}
                                                    onClick={() => setAspectRatio(ratio as any)}
                                                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${aspectRatio === ratio ? 'bg-neon-lime text-olive-dark' : 'bg-white/5 text-cream/60 hover:bg-white/10'}`}
                                                >
                                                    {ratio}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Rotation</label>
                                        <button 
                                            onClick={() => setRotation(r => (r + 90) % 360)}
                                            className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors bg-white/5 text-cream hover:bg-white/10 flex items-center justify-center gap-2"
                                        >
                                            <RotateCw size={16} /> Rotate 90°
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${addWatermark ? 'bg-neon-lime border-neon-lime text-olive-dark' : 'border-white/20 bg-white/5'}`}>
                                            {addWatermark && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <span className="text-sm font-bold text-cream/80 uppercase tracking-widest">Add Watermark (@{user?.username})</span>
                                        <input 
                                            type="checkbox" 
                                            checked={addWatermark} 
                                            onChange={(e) => setAddWatermark(e.target.checked)} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Description</label>
                                    <textarea 
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none resize-none h-24 font-medium"
                                        placeholder="Tell us about your artwork..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-cream/60 uppercase tracking-widest block mb-2">Tags</label>
                                    <input 
                                        type="text" 
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-neon-lime outline-none font-medium"
                                        placeholder="cyberpunk, 3d, abstract"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/10 bg-olive-dark">
                        <button 
                            onClick={handleSubmit}
                            disabled={isLoading || (uploadModalMode === 'poster' && (!posterImage || !title)) || (uploadModalMode === 'story' && storyImages.length === 0 && storyTexts.length === 0)}
                            className="w-full py-4 bg-neon-lime text-olive-dark font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:shadow-[0_0_30px_rgba(204,255,0,0.4)]"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : uploadModalMode === 'poster' ? 'Publish Poster' : 'Share Story'}
                        </button>
                    </div>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    multiple={uploadModalMode === 'story'}
                    className="hidden" 
                />
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
