"use client";

import React, { useState, useRef, useEffect } from "react";

/* ── Categories ─────────────────────────────────────── */
const CATEGORIES = [
  { id: "recent",  label: "Recent",            icon: "🕐" },
  { id: "smileys", label: "Smileys & People",  icon: "😀" },
  { id: "animals", label: "Animals & Nature",  icon: "🐶" },
  { id: "food",    label: "Food & Drink",       icon: "🍔" },
  { id: "travel",  label: "Travel & Places",   icon: "✈️" },
  { id: "activity",label: "Activities",        icon: "⚽" },
  { id: "objects", label: "Objects",           icon: "💡" },
  { id: "symbols", label: "Symbols",           icon: "🔣" },
  { id: "flags",   label: "Flags",             icon: "🏳️" },
];

const EMOJIS: Record<string, string[]> = {
  recent:  ["😂", "🥹", "🤣", "😊", "🔥", "❤️", "👍", "🙏", "😭", "💀"],
  smileys: [
    "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
    "😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔",
    "🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷",
    "🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","💫","🤯","🤠","🥸","😎","🤓","🧐",
    "😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭",
    "😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️",
    "💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
  ],
  animals: [
    "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
    "🙈","🙉","🙊","🐒","🦆","🐔","🐧","🐦","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝",
    "🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑",
    "🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧",
    "🦣","🐘","🦛","🦏","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐",
  ],
  food: [
    "🍏","🍎","🍊","🍋","🍌","🍉","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅",
    "🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨",
    "🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥙",
    "🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪",
    "🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩",
    "🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🍵","🫖","🧉","🍺","🍻","🥂","🍷","🥃",
  ],
  travel: [
    "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵",
    "🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚨","🚥","🚦","🛑","🚧","⚓","🛟",
    "⛵","🚤","🛥️","🛳️","⛴️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡",
    "🛰️","🚀","🛸","🏖️","🌋","🗻","🏕️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🪨","🪵",
    "🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯",
  ],
  activity: [
    "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏑",
    "🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛷","🏂","🪂","🏋️","🤼",
    "🤸","⛹️","🤺","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉",
    "🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹","🎭","🩩","🎨","🎬","🎤","🎧","🎼","🎵",
  ],
  objects: [
    "⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","💽","💾","💿","📀","📷","📸","📹","🎥",
    "📽️","🎞️","📞","☎️","📟","📠","📺","📻","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡",
    "🔋","🪫","🔌","💡","🔦","🕯️","🪔","🧯","🗑️","💰","💴","💵","💶","💷","💸","💳",
    "🪙","💹","📈","📉","📊","📋","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️",
    "🔒","🔓","🔏","🔐","🔑","🗝️","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️","🔪","🪃","🛡️",
  ],
  symbols: [
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓",
    "💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐",
    "♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎","🔀","🔁","🔂",
    "▶️","⏩","⏭️","⏯️","◀️","⏪","⏮️","🔼","⏫","🔽","⏬","⏸️","⏹️","⏺️","🎦","🔅",
    "🔆","📶","📳","📴","📵","📞","🔇","🔈","🔉","🔊","📢","📣","📯","🔔","🔕","🎵",
    "✅","❌","❎","✳️","✴️","❇️","💠","🔘","🔳","🔲","🔷","🔶","🔹","🔸","🔺","🔻",
  ],
  flags: [
    "🏳️","🏴","🏁","🚩","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇺🇳",
    "🇦🇫","🇦🇱","🇩🇿","🇦🇩","🇦🇴","🇦🇶","🇦🇬","🇦🇷","🇦🇲","🇦🇺","🇦🇹","🇦🇿",
    "🇧🇸","🇧🇭","🇧🇩","🇧🇧","🇧🇾","🇧🇪","🇧🇿","🇧🇯","🇧🇹","🇧🇴","🇧🇦","🇧🇼",
    "🇧🇷","🇧🇳","🇧🇬","🇧🇫","🇧🇮","🇨🇻","🇰🇭","🇨🇲","🇨🇦","🇨🇫","🇹🇩","🇨🇱",
    "🇨🇳","🇨🇴","🇰🇲","🇨🇬","🇨🇩","🇨🇷","🇨🇮","🇭🇷","🇨🇺","🇨🇾","🇨🇿","🇩🇰",
    "🇩🇯","🇩🇲","🇩🇴","🇪🇨","🇪🇬","🇸🇻","🇬🇶","🇪🇷","🇪🇪","🇸🇿","🇪🇹","🇫🇯",
    "🇫🇮","🇫🇷","🇬🇦","🇬🇲","🇬🇪","🇩🇪","🇬🇭","🇬🇷","🇬🇩","🇬🇹","🇬🇳","🇬🇼",
    "🇬🇾","🇭🇹","🇭🇳","🇭🇺","🇮🇸","🇮🇳","🇮🇩","🇮🇷","🇮🇶","🇮🇪","🇮🇱","🇮🇹",
    "🇯🇲","🇯🇵","🇯🇴","🇰🇿","🇰🇪","🇰🇮","🇰🇵","🇰🇷","🇽🇰","🇰🇼","🇰🇬","🇱🇦",
    "🇱🇻","🇱🇧","🇱🇸","🇱🇷","🇱🇾","🇱🇮","🇱🇹","🇱🇺","🇲🇬","🇲🇼","🇲🇾","🇲🇻",
    "🇲🇱","🇲🇹","🇲🇭","🇲🇷","🇲🇺","🇲🇽","🇫🇲","🇲🇩","🇲🇨","🇲🇳","🇲🇪","🇲🇦",
    "🇲🇿","🇲🇲","🇳🇦","🇳🇷","🇳🇵","🇳🇱","🇳🇿","🇳🇮","🇳🇪","🇳🇬","🇳🇴","🇴🇲",
    "🇵🇰","🇵🇼","🇵🇸","🇵🇦","🇵🇬","🇵🇾","🇵🇪","🇵🇭","🇵🇱","🇵🇹","🇶🇦","🇷🇴",
    "🇷🇺","🇷🇼","🇼🇸","🇸🇲","🇸🇦","🇸🇳","🇷🇸","🇸🇱","🇸🇬","🇸🇰","🇸🇮","🇸🇧",
    "🇸🇴","🇿🇦","🇸🇸","🇪🇸","🇱🇰","🇸🇩","🇸🇷","🇸🇪","🇨🇭","🇸🇾","🇹🇼","🇹🇯",
    "🇹🇿","🇹🇭","🇹🇱","🇹🇬","🇹🇴","🇹🇹","🇹🇳","🇹🇷","🇹🇲","🇹🇻","🇺🇬","🇺🇦",
    "🇦🇪","🇬🇧","🇺🇸","🇺🇾","🇺🇿","🇻🇺","🇻🇦","🇻🇪","🇻🇳","🇾🇪","🇿🇲","🇿🇼",
  ],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [search, setSearch] = useState("");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(EMOJIS.recent);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Focus search on open
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 20);
    });
  };

  // Search filter
  const searchResults = search.trim()
    ? Object.values(EMOJIS).flat().filter((e, i, arr) => arr.indexOf(e) === i).slice(0, 80)
    : null;

  const displayEmojis = searchResults ?? (activeCategory === "recent" ? recentEmojis : EMOJIS[activeCategory] ?? []);

  const categoryLabel = search.trim()
    ? "Search Results"
    : CATEGORIES.find(c => c.id === activeCategory)?.label ?? "";

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-3 left-0 w-[340px] bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-[#2A2A31] rounded-[16px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 flex flex-col"
      style={{ height: 420 }}
    >
      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-gray-100 dark:border-[#2A2A31] shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
            title={cat.label}
            className={`flex-1 flex items-center justify-center h-8 rounded-[8px] text-[17px] transition-colors relative ${
              activeCategory === cat.id && !search
                ? "bg-black/5 dark:bg-white/10"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <span>{cat.icon}</span>
            {activeCategory === cat.id && !search && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-[#34C759]" />
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 pt-2.5 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#2A2A31] rounded-[10px] px-3 py-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-500 dark:text-[#8E8E93] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emoji"
            className="flex-1 bg-transparent text-[14px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#636366] focus:outline-none"
          />
        </div>
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 emoji-scrollbar">
        {displayEmojis.length > 0 ? (
          <>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-[#8E8E93] px-1.5 mb-2 uppercase tracking-wider">
              {categoryLabel}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {displayEmojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => handleSelect(emoji)}
                  className="flex items-center justify-center h-9 w-9 text-[20px] rounded-[8px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-90"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-[#636366]">
            <span className="text-[32px] mb-2">🔍</span>
            <span className="text-[13px]">No emojis found</span>
          </div>
        )}
      </div>
    </div>
  );
}
