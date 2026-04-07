import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type InfoType = 'About' | 'Manifesto' | 'Terms' | 'Privacy';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InfoType | null;
}

const content: Record<InfoType, { title: string; body: React.ReactNode }> = {
  About: {
    title: "About FrameShift",
    body: (
      <div className="space-y-4 text-olive-dark/80 dark:text-cream/80 font-serif">
        <p>
          FrameShift is a curated digital gallery and community for visual designers, 3D artists, and creative coders.
          We believe in the power of visual experimentation and the intersection of technology and art.
        </p>
        <p>
          Born from a desire to showcase work that breaks the mold, FrameShift provides a platform for creators
          to share their most innovative posters, renders, and visual studies.
        </p>
        <p>
          Our mission is to inspire the next generation of designers by highlighting the unseen and the unconventional.
        </p>
      </div>
    )
  },
  Manifesto: {
    title: "The Manifesto",
    body: (
      <div className="space-y-6 text-olive-dark/80 dark:text-cream/80 font-serif">
        <div className="border-l-2 border-neon-lime pl-4">
          <h4 className="font-bold font-display uppercase text-lg mb-2">01. Create Daily</h4>
          <p>Consistency is the key to mastery. We celebrate the daily grind and the rough sketches.</p>
        </div>
        <div className="border-l-2 border-neon-lime pl-4">
          <h4 className="font-bold font-display uppercase text-lg mb-2">02. Break The Grid</h4>
          <p>Rules are meant to be understood, then shattered. Experimentation over perfection.</p>
        </div>
        <div className="border-l-2 border-neon-lime pl-4">
          <h4 className="font-bold font-display uppercase text-lg mb-2">03. Open Source</h4>
          <p>Share your process, your tools, and your knowledge. We grow faster together.</p>
        </div>
      </div>
    )
  },
  Terms: {
    title: "Terms of Service",
    body: (
      <div className="space-y-4 text-olive-dark/80 dark:text-cream/80 font-mono text-sm">
        <p><strong>1. Acceptance of Terms</strong><br/>By accessing FrameShift, you agree to be bound by these terms.</p>
        <p><strong>2. Content Ownership</strong><br/>You retain all rights to the content you post. By posting, you grant FrameShift a license to display your work.</p>
        <p><strong>3. Community Guidelines</strong><br/>Respect other artists. No hate speech, harassment, or stolen content will be tolerated.</p>
        <p><strong>4. Termination</strong><br/>We reserve the right to suspend accounts that violate these terms.</p>
      </div>
    )
  },
  Privacy: {
    title: "Privacy Policy",
    body: (
      <div className="space-y-4 text-olive-dark/80 dark:text-cream/80 font-mono text-sm">
        <p><strong>Data Collection</strong><br/>We collect minimal data necessary to provide our service (username, email, interaction data).</p>
        <p><strong>Cookies</strong><br/>We use cookies to maintain your session and preferences.</p>
        <p><strong>Third Parties</strong><br/>We do not sell your personal data to third parties.</p>
        <p><strong>Security</strong><br/>We implement industry-standard security measures to protect your information.</p>
      </div>
    )
  }
};

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, type }) => {
  if (!type) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-cream dark:bg-neutral-900 border border-olive-dark/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-olive-dark/10 dark:border-white/10 bg-olive-dark/5 dark:bg-white/5">
              <h3 className="font-display font-black text-2xl uppercase text-olive-dark dark:text-cream tracking-tight">
                {content[type].title}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-olive-dark/10 dark:hover:bg-white/10 transition-colors text-olive-dark dark:text-cream"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {content[type].body}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-olive-dark/10 dark:border-white/10 bg-olive-dark/5 dark:bg-white/5 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-olive-dark dark:bg-cream text-cream dark:text-olive-dark font-bold uppercase text-xs tracking-widest rounded-lg hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
