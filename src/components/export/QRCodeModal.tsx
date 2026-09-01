import React from 'react';
import { X, QrCode, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { XrayConfig, Translation } from '../../types';

interface QRCodeModalProps {
  config: XrayConfig | null;
  onClose: () => void;
  onCopy: (text: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  config,
  onClose,
  onCopy,
  strings,
  lang
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!config) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(config.raw)}`;

  const handleCopy = () => {
    onCopy(config.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 text-[#03DAC6] mb-4">
            <QrCode className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-display">
              {strings.showQrCode}
            </h3>
          </div>

          <div className="text-center mb-4">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#6200EE]/20 text-[#03DAC6] border border-[#6200EE]/30 uppercase">
              {config.protocol}
            </span>
            <p className="text-xs font-bold text-white mt-1.5 truncate max-w-xs mx-auto" title={config.remarks}>
              {config.remarks}
            </p>
          </div>

          {/* QR Container */}
          <div className="bg-white p-4 rounded-xl flex items-center justify-center shadow-inner mx-auto mb-5 w-64 h-64">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-[#6200EE] hover:bg-[#5000C8] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (lang === 'FA' ? "کپی شد!" : "Copied!") : strings.copyToClipboardBtn}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-[#121212] hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-neutral-800"
            >
              {strings.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
