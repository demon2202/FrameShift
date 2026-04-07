import React from 'react';
import { motion } from 'framer-motion';

export const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-40">
      <motion.div
        className="w-10 h-10 border-4 border-glassBorder border-t-accent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};
