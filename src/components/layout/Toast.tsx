import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  lang: 'FA' | 'EN';
}

export const Toast: React.FC<ToastProps> = ({ message, lang }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 ${lang === 'FA' ? 'right-6' : 'left-6'} z-50 flex items-center gap-3 bg-neutral-900 border border-[#03DAC6]/40 shadow-2xl px-5 py-3.5 rounded-2xl text-xs font-bold text-white backdrop-blur-md`}
        >
          <div className="p-1 rounded-lg bg-[#03DAC6]/10 text-[#03DAC6]">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
