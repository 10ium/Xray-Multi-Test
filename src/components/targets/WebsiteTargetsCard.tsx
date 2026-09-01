import React, { useState } from 'react';
import { Globe, Plus, Sliders, X, CheckSquare, Square } from 'lucide-react';
import { TestTarget, Translation } from '../../types';

interface WebsiteTargetsCardProps {
  testTargets: TestTarget[];
  onToggleTarget: (domain: string) => void;
  onAddWebsite: (name: string, domain: string) => void;
  onDeleteWebsite: (domain: string) => void;
  onUpdateWebsite: (oldDomain: string, newName: string, newDomain: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const WebsiteTargetsCard: React.FC<WebsiteTargetsCardProps> = ({
  testTargets,
  onToggleTarget,
  onAddWebsite,
  onDeleteWebsite,
  onUpdateWebsite,
  strings,
  lang
}) => {
  const [newWebsiteName, setNewWebsiteName] = useState('');
  const [newWebsiteDomain, setNewWebsiteDomain] = useState('');
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editDomainInput, setEditDomainInput] = useState('');

  const handleStartEdit = (target: TestTarget) => {
    setEditingDomain(target.domain);
    setEditNameInput(target.displayName);
    setEditDomainInput(target.domain);
  };

  const handleSaveEdit = () => {
    if (!editNameInput.trim() || !editDomainInput.trim() || !editingDomain) return;
    onUpdateWebsite(editingDomain, editNameInput.trim(), editDomainInput.trim().toLowerCase());
    setEditingDomain(null);
  };

  const handleAdd = () => {
    if (!newWebsiteName.trim() || !newWebsiteDomain.trim()) return;
    onAddWebsite(newWebsiteName.trim(), newWebsiteDomain.trim().toLowerCase());
    setNewWebsiteName('');
    setNewWebsiteDomain('');
  };

  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-custom-websites">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[#03DAC6]">
          <Globe className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wide uppercase font-display">{strings.customDomains}</h2>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          {testTargets.filter(t => t.isSelected).length} / {testTargets.length}
        </span>
      </div>

      {/* Edit Form */}
      {editingDomain && (
        <div className="bg-[#6200EE]/10 p-3.5 rounded-xl border border-[#6200EE]/30 mb-4">
          <span className="block text-[11px] font-mono text-neutral-200 uppercase mb-2">
            {lang === 'FA' ? "ویرایش وب‌سایت منتخب" : "Edit Selected Website Target"}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input 
              type="text" 
              value={editNameInput}
              onChange={e => setEditNameInput(e.target.value)}
              placeholder="Name"
              className="px-2.5 py-1.5 bg-[#121212] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#03DAC6]"
            />
            <input 
              type="text" 
              value={editDomainInput}
              onChange={e => setEditDomainInput(e.target.value)}
              placeholder="domain.com"
              className="px-2.5 py-1.5 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#03DAC6]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-1.5 bg-[#6200EE] hover:bg-[#5000C8] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {lang === 'FA' ? "ذخیره تغییرات" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditingDomain(null)}
              className="px-3 py-1.5 bg-[#1E1E1E] border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
            >
              {lang === 'FA' ? "انصراف" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Websites Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 max-h-72 overflow-y-auto pr-1">
        {testTargets.map((target) => (
          <div 
            key={target.domain}
            className={`flex items-center justify-between p-2.5 bg-[#121212] border rounded-xl text-xs transition-all ${
              target.isSelected ? 'border-[#03DAC6]/40 bg-[#03DAC6]/5 text-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <div 
              onClick={() => onToggleTarget(target.domain)}
              className="flex items-center gap-2.5 flex-1 cursor-pointer select-none overflow-hidden"
            >
              <span className="text-[#03DAC6] shrink-0">
                {target.isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </span>
              
              <img 
                src={`https://www.google.com/s2/favicons?sz=32&domain=${target.domain}`} 
                className="w-4 h-4 rounded shrink-0 object-contain bg-neutral-900 border border-neutral-800/80 p-0.5" 
                alt="" 
                referrerPolicy="no-referrer" 
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E`;
                }} 
              />

              <div className="truncate text-right font-sans flex-1 min-w-0">
                <div className="font-bold text-white truncate text-[12px]">{target.displayName}</div>
                <div className="text-[10px] text-neutral-500 truncate font-mono text-left mt-0.5" dir="ltr">{target.domain}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => handleStartEdit(target)}
                className="p-1 text-neutral-500 hover:text-[#03DAC6] hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                title="Edit"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteWebsite(target.domain)}
                className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                title="Delete"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Target Form */}
      <div className="bg-[#121212] p-3.5 rounded-xl border border-neutral-800/80">
        <span className="block text-[11px] font-mono text-neutral-400 uppercase mb-2">
          {lang === 'FA' ? "افزودن وب‌سایت جدید برای تست" : "Add New Test Website Target"}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
          <input 
            type="text" 
            value={newWebsiteName}
            onChange={e => setNewWebsiteName(e.target.value)}
            placeholder={lang === 'FA' ? "نام سایت (مثال: یوتیوب)" : "Site Name (e.g., YouTube)"}
            className="px-2.5 py-1.5 bg-[#1E1E1E] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#03DAC6]"
          />
          <input 
            type="text" 
            value={newWebsiteDomain}
            onChange={e => setNewWebsiteDomain(e.target.value)}
            placeholder={lang === 'FA' ? "دامنه (مثال: youtube.com)" : "Domain (e.g., youtube.com)"}
            className="px-2.5 py-1.5 bg-[#1E1E1E] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#03DAC6]"
          />
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-1.5 bg-[#03DAC6] hover:bg-[#01bfa5] text-neutral-900 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'FA' ? "افزودن سایت" : "Add Website"}</span>
        </button>
      </div>
    </section>
  );
};
