import React, { useState } from 'react';
import { X, Download, Copy, Check, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { XrayConfig, Translation, ExportFormat } from '../../types';
import { XrayExporter } from '../../services/XrayExporter';

interface ExportModalProps {
  configs: XrayConfig[];
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  configs,
  isOpen,
  onClose,
  onShowToast,
  strings,
  lang
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('clash');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let content = "";
  let fileExt = ".txt";
  let fileNamePrefix = "Xray_Configs";

  if (selectedFormat === 'clash') {
    content = XrayExporter.toClashMetaYaml(configs);
    fileExt = ".yaml";
    fileNamePrefix = "Clash_Meta_Mihomo";
  } else if (selectedFormat === 'singbox') {
    content = XrayExporter.toSingboxJson(configs);
    fileExt = ".json";
    fileNamePrefix = "Singbox_Outbounds";
  } else if (selectedFormat === 'base64') {
    content = XrayExporter.toBase64(configs);
    fileExt = ".txt";
    fileNamePrefix = "Subscription_Base64";
  } else {
    content = XrayExporter.toPlainText(configs);
    fileExt = ".txt";
    fileNamePrefix = "Xray_Plain_URIs";
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    onShowToast(strings.copySuccessMsg);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileNamePrefix}_${new Date().toISOString().slice(0,10)}${fileExt}`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(lang === 'FA' ? "فایل با موفقیت ذخیره شد!" : "File downloaded successfully!");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5 text-[#03DAC6]">
              <Share2 className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-display">
                {strings.exportModalTitle} ({configs.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Format Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
            <button
              onClick={() => setSelectedFormat('clash')}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                selectedFormat === 'clash'
                  ? 'bg-[#6200EE] border-[#03DAC6]/40 text-white shadow'
                  : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {strings.exportClashMeta}
            </button>
            <button
              onClick={() => setSelectedFormat('singbox')}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                selectedFormat === 'singbox'
                  ? 'bg-[#6200EE] border-[#03DAC6]/40 text-white shadow'
                  : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {strings.exportSingbox}
            </button>
            <button
              onClick={() => setSelectedFormat('base64')}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                selectedFormat === 'base64'
                  ? 'bg-[#6200EE] border-[#03DAC6]/40 text-white shadow'
                  : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {strings.exportBase64}
            </button>
            <button
              onClick={() => setSelectedFormat('plaintext')}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                selectedFormat === 'plaintext'
                  ? 'bg-[#6200EE] border-[#03DAC6]/40 text-white shadow'
                  : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {strings.exportPlainText}
            </button>
          </div>

          {/* Content Preview */}
          <div className="flex-1 min-h-[220px] bg-[#121212] rounded-xl border border-neutral-800 p-3 overflow-hidden flex flex-col mb-4">
            <textarea
              readOnly
              value={content}
              className="w-full h-full bg-transparent text-neutral-200 font-mono text-xs resize-none focus:outline-none custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#6200EE] hover:bg-[#5000C8] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (lang === 'FA' ? "کپی شد!" : "Copied!") : strings.copyToClipboardBtn}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-[#03DAC6] font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{strings.downloadFileBtn} ({fileExt})</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-[#1E1E1E] hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
            >
              {strings.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
