"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MoreVertical, Plus, Mic, MapPin, Users, Play, Pause, Square, X, FileText, Image as ImageIcon, Camera, Headphones, User, ListTodo, Calendar, Sticker, ChevronRight, Bell, Clock, Shield, Lock, Trash2, Ban, Star, ThumbsDown } from "lucide-react";
import EmojiPicker from "@/components/EmojiPicker";
import { createClient } from "@/utils/supabase/client";

/* ─── Types ─────────────────────────────────────────── */
type FilterTab = "All" | "Groups" | "Unread" | "Marked";
type ConvType  = "dm" | "group";

interface Participant {
  name: string;
  initials: string;
  color: string;
  bg: string;
}

interface Conversation {
  id: number;
  type: ConvType;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
  marked?: boolean;
  color?: string;
  bg?: string;
  initials?: string;
  members?: Participant[];
  memberCount?: number;
}

type MsgType = "text" | "trip-card" | "voice";

interface Message {
  id: string | number;
  type: MsgType;
  sender: "me" | "them";
  senderName?: string;
  text?: string;
  html?: string;  // rich formatted HTML
  time: string;
  from?: string; fromTime?: string;
  to?: string;   toTime?: string;
  duration?: string; tripTitle?: string;
  // voice
  voiceDuration?: string;
  waveform?: number[];
}

/* ─── Mock Data ─────────────────────────────────────── */
const CONVERSATIONS: Conversation[] = [
  {
    id: 1, type: "dm",
    name: "KrishnaKumar", preview: "Sent: Hello How Are You", time: "Yesterday",
    online: false, marked: false, unread: 0,
    initials: "KK", color: "#5856D6", bg: "#5856D640",
  },
  {
    id: 2, type: "dm",
    name: "Surya Kumar Yadav", preview: "I am Fine About You?", time: "Nov",
    online: true, marked: false, unread: 2,
    initials: "SK", color: "var(--user-accent)", bg: "#007AFF40",
  },
  {
    id: 3, type: "dm",
    name: "MS Dhoni", preview: "I am Fine About You?", time: "12 Jan 2026",
    online: false, marked: false, unread: 0,
    initials: "MD", color: "#FF9500", bg: "#FF950040",
  },
  {
    id: 4, type: "dm",
    name: "Priya Sharma", preview: "Can you review the report?", time: "10:32 AM",
    online: true, marked: false, unread: 3,
    initials: "PS", color: "#FF2D55", bg: "#FFE5EA",
  },
  {
    id: 5, type: "dm",
    name: "Arun Raj", preview: "Meeting at 3pm confirmed ✓", time: "Tue",
    online: false, marked: false, unread: 0,
    initials: "AR", color: "#34C759", bg: "#E5F9EC",
  },
  {
    id: 6, type: "dm",
    name: "Deepika Nair", preview: "Okay, I'll send the files.", time: "Mon",
    online: true, marked: false, unread: 1,
    initials: "DN", color: "#AF52DE", bg: "#F5EAFF",
  },
  {
    id: 101, type: "group",
    name: "Engineering Team", preview: "Arun: Check the PR #42", time: "9:14 AM",
    marked: false, unread: 5,
    memberCount: 8,
    members: [
      { name: "Arun Raj",       initials: "AR", color: "#34C759", bg: "#E5F9EC" },
      { name: "Priya Sharma",   initials: "PS", color: "#FF2D55", bg: "#FFE5EA" },
      { name: "KrishnaKumar",   initials: "KK", color: "#5856D6", bg: "#5856D640" },
    ],
  },
  {
    id: 102, type: "group",
    name: "HR Department", preview: "Deepika: Leave approvals done", time: "Yesterday",
    marked: false, unread: 0,
    memberCount: 5,
    members: [
      { name: "Deepika Nair",   initials: "DN", color: "#AF52DE", bg: "#F5EAFF" },
      { name: "Surya Kumar",    initials: "SK", color: "var(--user-accent)", bg: "#007AFF40" },
      { name: "Priya Sharma",   initials: "PS", color: "#FF2D55", bg: "#FFE5EA" },
    ],
  },
  {
    id: 103, type: "group",
    name: "Project Alpha", preview: "You: Sprint review tomorrow", time: "Tue",
    marked: false, unread: 0,
    memberCount: 6,
    members: [
      { name: "MS Dhoni",       initials: "MD", color: "#FF9500", bg: "#FF950040" },
      { name: "Arun Raj",       initials: "AR", color: "#34C759", bg: "#E5F9EC" },
      { name: "KrishnaKumar",   initials: "KK", color: "#5856D6", bg: "#5856D640" },
    ],
  },
  {
    id: 104, type: "group",
    name: "Daily Standup", preview: "Meeting started – join now", time: "8:00 AM",
    marked: false, unread: 12, // 9+ visually
    memberCount: 12,
    members: [
      { name: "Priya Sharma",   initials: "PS", color: "#FF2D55", bg: "#FFE5EA" },
      { name: "Deepika Nair",   initials: "DN", color: "#AF52DE", bg: "#F5EAFF" },
      { name: "KrishnaKumar",   initials: "KK", color: "#5856D6", bg: "#5856D640" },
    ],
  },
];

/* helper – generate a fake waveform array */
function genWaveform(seed: number = 42): number[] {
  const bars: number[] = [];
  let s = seed;
  for (let i = 0; i < 36; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    bars.push(0.2 + (Math.abs(s) % 100) / 125);
  }
  return bars;
}

const DEMO_WAVEFORM = genWaveform(7);

/* ─── Chat Histories ─────────────────────────────────── */
const CHAT_HISTORY: Record<number, Message[]> = {
  1: [
    { id: 1, type: "text", sender: "them", text: "Hey, Krishna How Are You !", time: "12:47 PM" },
    { id: 2, type: "text", sender: "me",   text: "I am Fine Mister, How was the work", time: "12:47 PM" },
    { id: 3, type: "trip-card", sender: "them", time: "1:15 PM",
      from: "Thiruvarur", fromTime: "9:30 AM",
      to: "Tiruchirapalli", toTime: "1:15 PM",
      duration: "3:20 Hrs", tripTitle: "Trip to Visit Site Conditions",
    },
    {
      id: 4, type: "voice", sender: "them", time: "1:30 PM",
      voiceDuration: "0:24",
      waveform: genWaveform(13),
    },
  ],
  2: [
    { id: 1, type: "text", sender: "them", text: "Hey! Are you free for a quick call?", time: "Nov 3" },
    { id: 2, type: "text", sender: "me",   text: "Sure, give me 5 minutes.", time: "Nov 3" },
    { id: 3, type: "text", sender: "them", text: "I am Fine About You?", time: "Nov 3" },
  ],
  3: [
    { id: 1, type: "text", sender: "them", text: "I am Fine About You?", time: "12 Jan" },
    { id: 2, type: "text", sender: "me",   text: "Yes all good! You?", time: "12 Jan" },
  ],
  4: [
    { id: 1, type: "text", sender: "them", text: "Hi Krishna, can you review the Q4 report?", time: "10:28 AM" },
    { id: 2, type: "text", sender: "me",   text: "Sure Priya, sending my notes shortly.", time: "10:29 AM" },
    { id: 3, type: "text", sender: "them", text: "Can you review the report?", time: "10:32 AM" },
  ],
  5: [
    { id: 1, type: "text", sender: "them", text: "Krishna, meeting has been moved to 3 PM.", time: "Tue" },
    { id: 2, type: "text", sender: "me",   text: "Got it, thanks!", time: "Tue" },
    { id: 3, type: "text", sender: "them", text: "Meeting at 3pm confirmed ✓", time: "Tue" },
  ],
  6: [
    { id: 1, type: "text", sender: "me",   text: "Deepika, can you share the onboarding files?", time: "Mon" },
    { id: 2, type: "text", sender: "them", text: "Okay, I'll send the files.", time: "Mon" },
  ],
  101: [
    { id: 1, type: "text", sender: "them", senderName: "Arun Raj",     text: "PR #42 is ready for review. Please check.", time: "9:00 AM" },
    { id: 2, type: "text", sender: "me",                               text: "On it, will review by lunch.", time: "9:02 AM" },
    { id: 3, type: "text", sender: "them", senderName: "Priya Sharma", text: "Also the staging deploy is done.", time: "9:10 AM" },
    { id: 4, type: "text", sender: "them", senderName: "Arun Raj",     text: "Check the PR #42", time: "9:14 AM" },
  ],
  102: [
    { id: 1, type: "text", sender: "them", senderName: "Deepika Nair", text: "All leave approvals for March are done.", time: "Yesterday" },
    { id: 2, type: "text", sender: "them", senderName: "Surya Kumar",  text: "Thank you Deepika 🙌", time: "Yesterday" },
    { id: 3, type: "text", sender: "me",                               text: "Great work everyone!", time: "Yesterday" },
  ],
  103: [
    { id: 1, type: "text", sender: "me",                               text: "Sprint review is scheduled for tomorrow 10 AM.", time: "Tue" },
    { id: 2, type: "text", sender: "them", senderName: "MS Dhoni",     text: "Perfect, I'll prepare the demo.", time: "Tue" },
    { id: 3, type: "text", sender: "them", senderName: "Arun Raj",     text: "I'll have the metrics ready.", time: "Tue" },
  ],
  104: [
    { id: 1, type: "text", sender: "them", senderName: "Priya Sharma", text: "Good morning everyone! Stand-up starting now.", time: "8:00 AM" },
    { id: 2, type: "text", sender: "them", senderName: "Deepika Nair", text: "Present!", time: "8:01 AM" },
    { id: 3, type: "text", sender: "me",                               text: "Joining in a min.", time: "8:02 AM" },
    { id: 4, type: "text", sender: "them", senderName: "Priya Sharma", text: "Meeting started – join now", time: "8:03 AM" },
  ],
  105: [
    { id: 1, type: "text", sender: "them", senderName: "Surya Kumar",  text: "Q1 financial reports have been uploaded to the drive.", time: "Mon" },
    { id: 2, type: "text", sender: "me",                               text: "Thanks Surya, reviewing now.", time: "Mon" },
    { id: 3, type: "text", sender: "them", senderName: "Arun Raj",     text: "The claims summary looks good.", time: "Mon" },
  ],
};

/* ─── SVG Tails ──────────────────────────────────────── */
const TailThem = () => (
  <svg className="absolute top-0 -left-[8px] w-[9px] h-[14px]" viewBox="0 0 9 14" fill="none">
    <path d="M8.5 0H0C0 0 8.5 4 8.5 14V0Z" className="fill-white dark:fill-[#1C1C22]" />
  </svg>
);
const TailMe = () => (
  <svg className="absolute top-0 -right-[8px] w-[9px] h-[14px] text-[var(--user-accent)]" viewBox="0 0 9 14" fill="none">
    <path d="M0.5 0H9C9 0 0.5 4 0.5 14V0Z" fill="currentColor" />
  </svg>
);

/* ─── Emoji helper ───────────────────────────────────── */
const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic})|\uFE0F|[\u{1F3FB}-\u{1F3FF}]|\u20E3)*$/u;
function isEmojiOnly(text: string): boolean {
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(s => s.segment);
  if (graphemes.length === 0 || graphemes.length > 5) return false;
  return graphemes.every(g => EMOJI_REGEX.test(g.trim()) && g.trim().length > 0);
}

/** Renders plain text runs with emojis at larger size */
function renderEmojiRuns(text: string, keyOffset: number): React.ReactNode[] {
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(s => s.segment);
  const runs: { isEmoji: boolean; content: string }[] = [];
  for (const g of graphemes) {
    const isEmoji = EMOJI_REGEX.test(g);
    const last = runs[runs.length - 1];
    if (last && last.isEmoji === isEmoji) last.content += g;
    else runs.push({ isEmoji, content: g });
  }
  return runs.map((r, i) =>
    r.isEmoji
      ? <span key={keyOffset + i} style={{ fontSize: '26px', lineHeight: 1, verticalAlign: 'middle' }}>{r.content}</span>
      : <span key={keyOffset + i}>{r.content}</span>
  );
}

/** Parses inline markdown (*bold*, _italic_, ~strike~, `code`) with emoji sizing */
function renderInlineMd(text: string, baseKey = 0): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Order matters: longer markers checked first
  const pattern = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~|`([^`]+)`)/g;
  let pos = 0, key = baseKey, m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > pos) tokens.push(...renderEmojiRuns(text.slice(pos, m.index), key));
    key += 100;
    const [full, , bold, italic, strike, code] = m;
    if (bold   !== undefined) tokens.push(<strong key={key++} className="font-semibold">{bold}</strong>);
    else if (italic !== undefined) tokens.push(<em key={key++} className="italic">{italic}</em>);
    else if (strike !== undefined) tokens.push(<span key={key++} className="line-through opacity-75">{strike}</span>);
    else if (code   !== undefined) tokens.push(
      <code key={key++} className="font-mono text-[13px] bg-black/[0.12] dark:bg-white/[0.12] px-[5px] py-[2px] rounded-[5px] tracking-tight">
        {code}
      </code>
    );
    pos = m.index + full.length;
  }
  if (pos < text.length) tokens.push(...renderEmojiRuns(text.slice(pos), key));
  return tokens;
}

/** Top-level renderer — handles blockquote  (> ...) and code blocks (```...```) then inline */
function renderMsgText(text: string): React.ReactNode {
  // Code block: ```...```
  if (text.startsWith('```') && text.endsWith('```') && text.length > 6) {
    const code = text.slice(3, -3).trim();
    return (
      <code className="block font-mono text-[13px] bg-black/[0.12] dark:bg-white/[0.12] px-3 py-2 rounded-[8px] whitespace-pre-wrap tracking-tight leading-relaxed">
        {code}
      </code>
    );
  }
  // Blockquote: > ...
  if (text.startsWith('> ')) {
    const content = text.slice(2);
    return (
      <span className="flex items-stretch gap-[8px]">
        <span className="w-[3.5px] shrink-0 self-stretch rounded-full bg-current opacity-50" />
        <span className="italic opacity-90 leading-snug">{renderInlineMd(content)}</span>
      </span>
    );
  }
  return <>{renderInlineMd(text)}</>;
}


function VoiceBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveform = msg.waveform ?? DEMO_WAVEFORM;

  const togglePlay = () => {
    if (playing) {
      clearInterval(intervalRef.current!);
      setPlaying(false);
    } else {
      setPlaying(true);
      setProgress(0);
      const steps = 80;
      let tick = 0;
      intervalRef.current = setInterval(() => {
        tick++;
        setProgress(tick / steps);
        if (tick >= steps) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          setProgress(0);
        }
      }, 37);
    }
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const filledBars = Math.floor(progress * waveform.length);

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-[10px] rounded-[8px] shadow-sm ${
        isMe
          ? "bg-[var(--user-accent)] text-white shadow-[0_1px_0.5px_rgba(11,20,26,.13)] rounded-tr-none"
          : "bg-white dark:bg-[#1C1C22] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] rounded-tl-none"
      }`}
      style={{ minWidth: 220, maxWidth: 280 }}
    >
      {!isMe && <TailThem />}
      {isMe  && <TailMe  />}

      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        className={`h-[36px] w-[36px] rounded-full flex items-center justify-center shrink-0 transition-all ${
          isMe
            ? "bg-white/25 hover:bg-white/40"
            : "bg-[var(--user-accent)] hover:bg-[#0062CC] shadow-[0_4px_12px_rgba(0,122,255,0.3)]"
        }`}
      >
        {playing
          ? <Pause  className={`h-[15px] w-[15px] ${isMe ? "text-white" : "text-white"}`} strokeWidth={2.5} />
          : <Play   className={`h-[15px] w-[15px] ${isMe ? "text-white" : "text-white"}`} strokeWidth={2.5} fill="currentColor" />
        }
      </button>

      {/* Waveform + duration */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Waveform bars */}
        <div className="flex items-center gap-[2px] h-[28px]">
          {waveform.map((h, i) => {
            const filled = i < filledBars;
            const height = Math.round(h * 28);
            return (
              <div
                key={i}
                className="rounded-full transition-colors duration-75"
                style={{
                  width: 2,
                  minWidth: 2,
                  flexShrink: 0,
                  height: Math.max(4, height),
                  background: isMe
                    ? (filled ? "#ffffff" : "rgba(255,255,255,0.35)")
                    : (filled ? "var(--user-accent)" : "#D1D1D6"),
                }}
              />
            );
          })}
        </div>

        {/* Duration + time */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-semibold ${isMe ? "text-white/80" : "text-[#8E8E93]"}`}>
            {playing
              ? formatSecs(Math.round(progress * parseDuration(msg.voiceDuration ?? "0:10")))
              : msg.voiceDuration ?? "0:10"}
          </span>
          <span className={`text-[9px] font-semibold ${isMe ? "text-white/60" : "text-[#A1A1A6]"}`}>
            {msg.time}
          </span>
        </div>
      </div>
    </div>
  );
}

function parseDuration(s: string): number {
  const [m, sec] = s.split(":").map(Number);
  return (m ?? 0) * 60 + (sec ?? 0);
}
function formatSecs(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ─── Trip Card ──────────────────────────────────────── */
function TripCard({ msg }: { msg: Message }) {
  return (
    <div className="bg-white dark:bg-[#1C1C22] rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] w-[380px] mt-3 border border-transparent dark:border-[#2A2A31]">
      <div className="pt-6 pb-4 px-6">
        <div className="flex items-center w-full relative h-6">
          <div className="h-[22px] w-[22px] bg-[#F1F3F5] dark:bg-[#2A2A31] rounded-full shrink-0 relative z-10" />
          <div className="flex-1 flex flex-col items-center justify-center -mx-[4px] relative z-0">
            <div className="w-full border-t-[1.5px] border-dashed border-[#E5E7EB] dark:border-[#2A2A31]" />
            <p className="text-[10px] font-semibold text-[#86868b] absolute top-[5px] bg-white dark:bg-[#1C1C22] px-2">{msg.duration}</p>
          </div>
          <div className="h-[28px] w-[28px] bg-[var(--user-accent)] rounded-full flex items-center justify-center shrink-0 relative z-10 shadow-[0_4px_12px_rgba(0,122,255,0.35)]">
            <MapPin className="text-white h-[14px] w-[14px]" strokeWidth={3} />
          </div>
        </div>
        <div className="flex justify-between items-start mt-3">
          <div>
            <p className="text-[12px] font-bold text-[#1d1d1f] dark:text-white mb-0.5">{msg.from}</p>
            <p className="text-[10px] font-medium text-[#86868b]">{msg.fromTime}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold text-[#1d1d1f] dark:text-white mb-0.5">{msg.to}</p>
            <p className="text-[10px] font-medium text-[#86868b]">{msg.toTime}</p>
          </div>
        </div>
        <p className="text-[13px] font-bold text-[#1d1d1f] dark:text-white mt-5 mb-1">{msg.tripTitle}</p>
      </div>
      <div className="flex items-center gap-3 px-6 pb-5 pt-2">
        <button className="flex-1 py-2.5 rounded-[12px] text-[13px] font-bold text-[#1d1d1f] dark:text-white border border-[#E5E7EB] dark:border-[#2A2A31] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A31] transition-colors">Cancel</button>
        <button className="flex-1 py-2.5 rounded-[12px] text-[13px] font-bold text-white bg-[var(--user-accent)] hover:opacity-90 transition-colors shadow-sm">Approve</button>
      </div>
    </div>
  );
}

/* ─── Group Avatar Stack ─────────────────────────────── */
function GroupAvatar({ members }: { members: Participant[] }) {
  const shown = members.slice(0, 2);
  return (
    <div className="relative h-[40px] w-[40px] shrink-0">
      {shown.map((m, i) => (
        <div
          key={i}
          className="absolute h-[26px] w-[26px] rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
          style={{
            background: m.color,
            top: i === 0 ? 0 : "auto",
            bottom: i === 1 ? 0 : "auto",
            left:  i === 0 ? 0 : "auto",
            right: i === 1 ? 0 : "auto",
          }}
        >
          {m.initials}
        </div>
      ))}
    </div>
  );
}

/* ─── Recording Bar ──────────────────────────────────── */
const BAR_COUNT = 36;

function RecordingBar({
  elapsed,
  onCancel,
  onSend,
}: {
  elapsed: number;
  onCancel: () => void;
  onSend: (capturedWaveform: number[]) => void;
}) {
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.15));
  // Keep a rolling snapshot of every bar pushed – used for the sent bubble
  const capturedRef = useRef<number[]>([]);
  // Web Audio refs
  const streamRef    = useRef<MediaStream | null>(null);
  const ctxRef       = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const rafRef       = useRef<number>(0);

  useEffect(() => {
    let alive = true;

    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const source   = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize            = 256;   // 128-bin frequency array
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyserRef.current = analyser;

        const freqData = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!alive) return;
          analyser.getByteFrequencyData(freqData);

          // Average the lower half of the spectrum (voice range)
          const slice = freqData.slice(0, freqData.length / 2);
          const avg   = slice.reduce((a, b) => a + b, 0) / slice.length;
          // Normalise: 0–255 → 0.1–1.0, add slight floor so idle shows thin bars
          const norm  = Math.max(0.1, Math.min(1.0, avg / 200));

          setBars(prev => {
            const next = [...prev.slice(1), norm];
            return next;
          });
          capturedRef.current.push(norm);

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

      } catch {
        // Mic permission denied – fall back to subtle idle animation
        if (!alive) return;
        const id = setInterval(() => {
          setBars(prev => {
            const next = [...prev.slice(1)];
            next.push(0.1 + Math.random() * 0.25); // quiet idle bars
            return next;
          });
        }, 80);
        return () => clearInterval(id);
      }
    }

    startMic();

    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      ctxRef.current?.close();
    };
  }, []);

  const handleSend = () => {
    // Build a fixed-length waveform snapshot for the bubble
    const raw = capturedRef.current;
    let wf: number[];
    if (raw.length === 0) {
      wf = Array(BAR_COUNT).fill(0.3);
    } else if (raw.length <= BAR_COUNT) {
      wf = [...raw, ...Array(BAR_COUNT - raw.length).fill(0.15)];
    } else {
      // Downsample evenly
      wf = Array.from({ length: BAR_COUNT }, (_, i) => {
        const idx = Math.floor((i / BAR_COUNT) * raw.length);
        return raw[idx];
      });
    }
    onSend(wf);
  };

  return (
    <div className="flex-1 flex items-center gap-3 w-full animate-in fade-in zoom-in duration-200">
      {/* Cancel */}
      <button
        onClick={onCancel}
        className="h-[32px] w-[32px] rounded-full bg-[#FF3B30]/10 flex items-center justify-center shrink-0 hover:bg-[#FF3B30]/20 transition-colors"
      >
        <X className="h-[14px] w-[14px] text-[#FF3B30]" strokeWidth={2.5} />
      </button>

      {/* Red dot + timer */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="h-[7px] w-[7px] rounded-full bg-[#FF3B30] animate-pulse" />
        <span className="text-[12px] font-bold text-[#FF3B30] tabular-nums">
          {formatSecs(elapsed)}
        </span>
      </div>

      {/* Live waveform */}
      <div className="flex-1 flex items-center gap-[2px] h-[26px] overflow-hidden">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-full bg-[var(--user-accent)] transition-all duration-100"
            style={{ width: 2, minWidth: 2, flexShrink: 0, height: Math.max(3, Math.round(h * 26)) }}
          />
        ))}
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        className="h-[36px] w-[36px] rounded-full bg-[var(--user-accent)] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,122,255,0.35)] hover:bg-[#0062CC] transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] text-white fill-current">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Contact Info Panel ───────────────────────────────── */
function ContactInfoPanel({ conv, onClose }: { conv: Conversation, onClose: () => void }) {
  const isGroup = conv.type === 'group';
  return (
    <div className="w-[30%] min-w-[320px] max-w-[420px] flex flex-col bg-white dark:bg-[#111b21] border-l border-[#E5E7EB] dark:border-[#2A2A31] z-20 h-full overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center gap-6 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
        <button onClick={onClose} className="text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-white transition-colors">
          <X className="h-[24px] w-[24px]" strokeWidth={2} />
        </button>
        <span className="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">
          {isGroup ? "Group info" : "Contact info"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto chat-scrollbar bg-[#f0f2f5] dark:bg-[#111b21]">
        {/* Profile Details */}
        <div className="bg-white dark:bg-[#111b21] px-4 py-8 flex flex-col items-center justify-center text-center shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2">
          {isGroup ? (
            <div className="scale-150 mb-6 origin-top">
              <GroupAvatar members={conv.members!} />
            </div>
          ) : (
            <div className="h-[200px] w-[200px] rounded-full flex items-center justify-center text-[72px] font-bold text-white shadow-md mb-5" style={{ background: conv.color }}>
              {conv.initials}
            </div>
          )}
          <h2 className="text-[24px] font-medium text-[#111b21] dark:text-[#e9edef]">{conv.name}</h2>
          {isGroup ? (
            <p className="text-[16px] text-[#54656f] dark:text-[#8696a0] mt-1">
              Group · <span className="text-[#00a884]">{conv.members?.length} members</span>
            </p>
          ) : (
            <p className="text-[16px] text-[#54656f] dark:text-[#8696a0] mt-1">+65 9059 3870</p>
          )}

          {isGroup ? (
            <div className="flex items-center gap-4 mt-6">
              <button className="flex flex-col items-center gap-2 group">
                <div className="h-[44px] px-8 rounded-[16px] border border-[#d1d7db] dark:border-[#2a2f32] flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors">
                  <div className="flex flex-col items-center">
                    <User className="h-[20px] w-[20px] text-[var(--user-accent)] mb-1" strokeWidth={2.5} />
                    <span className="text-[13px]">Add</span>
                  </div>
                </div>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="h-[44px] px-6 rounded-[16px] border border-[#d1d7db] dark:border-[#2a2f32] flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors">
                  <div className="flex flex-col items-center">
                    <Search className="h-[20px] w-[20px] text-[var(--user-accent)] mb-1" strokeWidth={2.5} />
                    <span className="text-[13px]">Search</span>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <button className="mt-6 flex flex-col items-center gap-2 group">
              <div className="h-[44px] w-[44px] rounded-[16px] border border-[#d1d7db] dark:border-[#2a2f32] flex items-center justify-center text-[var(--user-accent)] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors">
                <Search className="h-[20px] w-[20px]" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] text-[#54656f] dark:text-[#8696a0] group-hover:text-[var(--user-accent)] transition-colors">Search</span>
            </button>
          )}
        </div>

        {/* Group Description */}
        {isGroup && (
          <div className="bg-white dark:bg-[#111b21] px-5 py-4 shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[16px] text-[#111b21] dark:text-[#e9edef]">{conv.name}</p>
              <FileText className="h-4 w-4 text-[#54656f] dark:text-[#8696a0]" />
            </div>
            <p className="text-[14px] text-[#54656f] dark:text-[#8696a0]">Group created by you, on 11/1/2023 at 9:44 pm</p>
          </div>
        )}

        {/* About */}
        {!isGroup && (
          <div className="bg-white dark:bg-[#111b21] px-5 py-4 shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2">
            <p className="text-[14px] text-[#54656f] dark:text-[#8696a0] mb-2">About</p>
            <p className="text-[16px] text-[#111b21] dark:text-[#e9edef]">Available</p>
          </div>
        )}

        {/* Media */}
        <div className="bg-white dark:bg-[#111b21] px-5 py-4 shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2 cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors">
          <div className="flex items-center justify-between mb-3 text-[#54656f] dark:text-[#8696a0]">
            <span className="text-[14px] flex items-center gap-3"><ImageIcon className="h-5 w-5" /> Media, links and docs</span>
            <span className="text-[14px] flex items-center gap-1">127 <ChevronRight className="h-4 w-4" /></span>
          </div>
          <div className="flex gap-2 overflow-hidden">
            <div className="h-[80px] w-[80px] rounded-[8px] bg-gray-200 dark:bg-[#202c33] shrink-0" />
            <div className="h-[80px] w-[80px] rounded-[8px] bg-gray-200 dark:bg-[#202c33] shrink-0" />
            <div className="h-[80px] w-[80px] rounded-[8px] bg-gray-200 dark:bg-[#202c33] shrink-0" />
            <div className="h-[80px] w-[80px] rounded-[8px] bg-gray-200 dark:bg-[#202c33] shrink-0" />
          </div>
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-[#111b21] flex flex-col shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2">
          {[
            ...(!isGroup ? [{ icon: Star, text: "Starred messages" }] : []),
            { icon: Bell, text: "Mute notifications", toggle: false },
            { icon: Clock, text: "Disappearing messages", sub: "Off" },
            { icon: Shield, text: "Advanced chat privacy", sub: "Off" },
            ...(isGroup ? [{ icon: Calendar, text: "Group permissions" }] : []),
            ...(!isGroup ? [{ icon: Lock, text: "Encryption", sub: "Messages are end-to-end encrypted. Click to verify." }] : [])
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors relative">
              <div className="flex items-center gap-5 px-5 py-[14px]">
                <item.icon className="h-5 w-5 text-[#54656f] dark:text-[#8696a0] shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] text-[#111b21] dark:text-[#e9edef] truncate">{item.text}</p>
                  {item.sub && <p className="text-[14px] text-[#54656f] dark:text-[#8696a0] truncate leading-tight mt-0.5">{item.sub}</p>}
                </div>
                {item.toggle !== undefined && (
                  <div className="w-[34px] h-[14px] rounded-full bg-[#E5E7EB] dark:bg-[#3b4a54] relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[20px] h-[20px] rounded-full bg-[#f0f2f5] dark:bg-[#8696a0] shadow-sm transform -translate-x-[2px]" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Community & Members */}
        {isGroup && (
          <>
            <div className="bg-white dark:bg-[#111b21] px-5 py-4 shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2 flex items-center justify-between cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-[48px] w-[48px] rounded-[10px] bg-[#00a884] shrink-0 flex items-center justify-center text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[16px] text-[#111b21] dark:text-[#e9edef] font-medium leading-tight">Add group to a community</p>
                  <p className="text-[14px] text-[#54656f] dark:text-[#8696a0] mt-0.5">Bring members together in topic-based groups</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#54656f] dark:text-[#8696a0]" />
            </div>

            <div className="bg-white dark:bg-[#111b21] py-4 shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-2">
              <div className="px-5 mb-2 flex items-center justify-between">
                <p className="text-[14px] text-[#54656f] dark:text-[#8696a0] font-medium">{conv.members?.length} members</p>
                <Search className="h-4 w-4 text-[#54656f] dark:text-[#8696a0] cursor-pointer" />
              </div>
              <div className="px-5 py-[14px] flex items-center gap-4 cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors group">
                <div className="h-[40px] w-[40px] rounded-full bg-[#00a884] shrink-0 flex items-center justify-center text-white">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-[16px] text-[#111b21] dark:text-[#e9edef] group-hover:dark:text-white transition-colors">Add member</span>
              </div>
              <div className="px-5 py-[14px] flex items-center gap-4 cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors group">
                <div className="h-[40px] w-[40px] rounded-full bg-[#00a884] shrink-0 flex items-center justify-center text-white">
                  <Sticker className="h-5 w-5" />
                </div>
                <span className="text-[16px] text-[#111b21] dark:text-[#e9edef] group-hover:dark:text-white transition-colors">Invite to group via link</span>
              </div>

              {/* You */}
              <div className="px-5 py-[10px] flex items-center gap-4 cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors relative">
                <div className="h-[40px] w-[40px] rounded-full shrink-0 flex items-center justify-center text-white text-[14px] font-bold" style={{ background: '#007AFF' }}>KK</div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <p className="text-[16px] text-[#111b21] dark:text-[#e9edef] truncate">You</p>
                  <span className="text-[12px] px-1.5 py-0.5 rounded text-[#00a884] border border-[#00a884]/30">Group admin</span>
                </div>
              </div>

              {/* Other Members */}
              {conv.members?.map((m, i) => (
                <div key={i} className="px-5 py-[10px] flex items-center gap-4 cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors relative">
                  <div className="h-[40px] w-[40px] rounded-full shrink-0 flex items-center justify-center text-white text-[14px] font-bold" style={{ background: m.color }}>{m.initials}</div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                       <p className="text-[16px] text-[#111b21] dark:text-[#e9edef] truncate">{m.name}</p>
                       {i % 2 === 0 && <span className="text-[12px] px-1.5 py-0.5 rounded text-[#00a884] border border-[#00a884]/30 shrink-0 ml-2">Group admin</span>}
                    </div>
                    {i % 2 !== 0 && <p className="text-[13px] text-[#54656f] dark:text-[#8696a0] truncate mt-0.5">Available</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Danger Actions */}
        <div className="bg-white dark:bg-[#111b21] flex flex-col shadow-[0_1px_2px_rgba(11,20,26,0.1)] mb-6">
          {!isGroup && (
            <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#54656f] dark:text-[#8696a0]">
              <Star className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="text-[16px] truncate">Add to favourites</span>
            </div>
          )}
          {!isGroup && (
            <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#54656f] dark:text-[#8696a0]">
              <ListTodo className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="text-[16px] truncate">Add to list</span>
            </div>
          )}
          <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#ea0038] dark:text-[#f15c6d]">
            <Ban className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="text-[16px] truncate">Clear chat</span>
          </div>

          {isGroup ? (
            <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#ea0038] dark:text-[#f15c6d]">
              <Trash2 className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="text-[16px] truncate">Exit group</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#ea0038] dark:text-[#f15c6d]">
                <Ban className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="text-[16px] truncate">Block {conv.name}</span>
              </div>
              <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#ea0038] dark:text-[#f15c6d]">
                <ThumbsDown className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="text-[16px] truncate">Report {conv.name}</span>
              </div>
              <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#ea0038] dark:text-[#f15c6d]">
                <Trash2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="text-[16px] truncate">Delete chat</span>
              </div>
            </>
          )}

          {isGroup && (
             <div className="flex items-center gap-5 px-5 py-[14px] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-[#ea0038] dark:text-[#f15c6d]">
               <ThumbsDown className="h-5 w-5 shrink-0" strokeWidth={2} />
               <span className="text-[16px] truncate">Report group</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
function MessagesContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const chatUserId = searchParams.get("chatUserId");
  const chatName = searchParams.get("chatName");
  
  const [allConvs, setAllConvs]       = useState<Conversation[]>(CONVERSATIONS);
  const [activeConv, setActiveConv]   = useState<Conversation>(CONVERSATIONS[0]);

  useEffect(() => {
    if (chatUserId && chatName) {
      const existing = allConvs.find(c => c.name.toLowerCase() === chatName.toLowerCase());
      if (existing) {
        setActiveConv(existing);
      } else {
        const tempId = Date.now();
        const newConv: Conversation = {
          id: tempId,
          type: "dm",
          name: chatName,
          preview: "Start a new conversation",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          online: true,
          unread: 0,
          marked: false,
          initials: chatName.slice(0, 2).toUpperCase(),
          color: "var(--user-accent)",
          bg: "#007AFF40",
        };
        setAllConvs(prev => [newConv, ...prev]);
        setActiveConv(newConv);
      }
    }
  }, [chatUserId, chatName]);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [filter, setFilter]           = useState<FilterTab>("All");
  const [search, setSearch]           = useState("");
  const [input, setInput]             = useState("");
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  
  // Realtime & DB State
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);
  const [histories, setHistories]     = useState<Record<number, Message[]>>(CHAT_HISTORY);

  const [recording, setRecording]     = useState(false);
  const [recElapsed, setRecElapsed]   = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);   // contenteditable
  const savedRangeRef = useRef<Range | null>(null);
  const [fmtToolbar, setFmtToolbar] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const toggleFmt = (id: string) => setActiveFormats(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  /** Apply formatting to the selected text inside the contenteditable div */
  const applyFormat = (type: 'bold'|'italic'|'strike'|'code'|'mono'|'quote') => {
    const div = inputRef.current;
    if (!div) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    
    div.focus();
    
    if (type === 'bold')         { document.execCommand('bold'); }
    else if (type === 'italic')  { document.execCommand('italic'); }
    else if (type === 'strike')  { document.execCommand('strikeThrough'); }
    else if (type === 'code' || type === 'mono') {
      const range = sel.getRangeAt(0);
      if (activeFormats.has('code') || activeFormats.has('mono')) {
        // Try to unwrap code
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        while (node && node !== div) {
          if (node.nodeName === 'CODE') {
            const parent = node.parentNode!;
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
            break;
          }
          node = node.parentNode;
        }
      } else {
        const selectedText = range.toString();
        const codeEl = document.createElement('code');
        codeEl.style.cssText = 'font-family:monospace;font-size:13px;background:rgba(0,0,0,0.10);border-radius:4px;padding:1px 5px;';
        codeEl.textContent = selectedText;
        range.deleteContents();
        
        const spaceNode = document.createTextNode('\u200B');
        const frag = document.createDocumentFragment();
        frag.appendChild(codeEl);
        frag.appendChild(spaceNode);
        
        range.insertNode(frag);
        
        // Move selection after the space so future typing is normal
        const newRange = document.createRange();
        newRange.setStartAfter(spaceNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }
    else if (type === 'quote') {
      const range = sel.getRangeAt(0);
      if (activeFormats.has('quote')) {
        // Unwrap quote span
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        while (node && node !== div) {
          if (node.nodeName === 'SPAN' && (node as HTMLElement).querySelector('em')) {
            const parent = node.parentNode!;
            const em = (node as HTMLElement).querySelector('em');
            if (em) {
              while (em.firstChild) parent.insertBefore(em.firstChild, node);
            }
            parent.removeChild(node);
            break;
          }
          node = node.parentNode;
        }
      } else {
        const selectedText = range.toString();
        const bar = document.createElement('span');
        bar.style.cssText = 'display:inline-block;width:3px;background:currentColor;opacity:0.5;border-radius:9px;margin-right:8px;vertical-align:middle;';
        bar.innerHTML = '&nbsp;';
        const em = document.createElement('em');
        em.textContent = selectedText;
        const wrapper = document.createElement('span');
        wrapper.appendChild(bar);
        wrapper.appendChild(em);
        range.deleteContents();
        
        const spaceNode = document.createTextNode('\u200B');
        const frag = document.createDocumentFragment();
        frag.appendChild(wrapper);
        frag.appendChild(spaceNode);
        
        range.insertNode(frag);
        
        const newRange = document.createRange();
        newRange.setStartAfter(spaceNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }
    
    setInput(div.innerText.trim());
    toggleFmt(type);
    setFmtToolbar(false);
  };

  /** Prepend list marker to each line of selected text */
  const applyList = (listType: 'number'|'alpha'|'bullet') => {
    const div = inputRef.current;
    if (!div) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    const isTogglingOff = activeFormats.has(listType);
    
    const lines = selectedText.split('\n');
    const processed = lines.map((line, i) => {
      // Always strip existing custom markers first (e.g. "1. ", "a. ", "• ")
      let cleanLine = line.replace(/^([0-9]+\.|[a-zA-Z]\.|[•\-])\s*/, '');
      if (isTogglingOff) {
        return cleanLine; // Just return cleaned line to toggle off
      }
      // Apply new marker
      const marker = listType === 'number' ? `${i + 1}. `
                   : listType === 'alpha'  ? `${String.fromCharCode(97 + i)}. `
                   : '• ';
      return marker + cleanLine;
    }).join('\n');
    
    const pre = document.createElement('span');
    pre.style.cssText = 'white-space:pre-wrap;display:inline;';
    pre.textContent = processed;
    range.deleteContents();
    
    const spaceNode = document.createTextNode('\u200B');
    const frag = document.createDocumentFragment();
    frag.appendChild(pre);
    frag.appendChild(spaceNode);
    
    range.insertNode(frag);
    
    const newRange = document.createRange();
    newRange.setStartAfter(spaceNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    
    setInput(div.innerText.trim());
    
    // Clear other list formats
    setActiveFormats(prev => {
      const next = new Set(prev);
      if (isTogglingOff) {
        next.delete(listType);
      } else {
        next.delete('number');
        next.delete('alpha');
        next.delete('bullet');
        next.add(listType);
      }
      return next;
    });
    setFmtToolbar(false);
  };

  /** Auto-format on typing: detects *bold*, _italic_, ~strike~, `code`, {code}, > quote */
  const applyInputRules = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent ?? '';
    const cursorPos = range.startOffset;
    // Only check text up to cursor
    const textToCursor = text.slice(0, cursorPos);

    const rules: { pattern: RegExp; makeEl: (content: string) => HTMLElement }[] = [
      {
        pattern: /\*([^*\s][^*]*)\*$/,
        makeEl: (c) => { const el = document.createElement('strong'); el.textContent = c; return el; },
      },
      {
        pattern: /_([^_\s][^_]*)_$/,
        makeEl: (c) => { const el = document.createElement('em'); el.textContent = c; return el; },
      },
      {
        pattern: /~([^~\s][^~]*)~$/,
        makeEl: (c) => { const el = document.createElement('s'); el.textContent = c; return el; },
      },
      {
        pattern: /`([^`]+)`$/,
        makeEl: (c) => {
          const el = document.createElement('code');
          el.style.cssText = 'font-family:monospace;font-size:13px;background:rgba(0,0,0,0.10);border-radius:4px;padding:1px 5px;';
          el.textContent = c;
          return el;
        },
      },
      {
        pattern: /\{([^}]+)\}$/,
        makeEl: (c) => {
          const el = document.createElement('code');
          el.style.cssText = 'font-family:monospace;font-size:13px;background:rgba(0,0,0,0.10);border-radius:4px;padding:1px 5px;';
          el.textContent = c;
          return el;
        },
      },
    ];

    for (const rule of rules) {
      const m = rule.pattern.exec(textToCursor);
      if (!m) continue;

      const matchStart = m.index;
      const matchEnd   = m.index + m[0].length;

      // Replace [matchStart, matchEnd] in the text node with the formatted element
      const before = text.slice(0, matchStart);
      const after  = text.slice(matchEnd);

      const parent = node.parentNode!;
      const formattedEl = rule.makeEl(m[1]);
      // Space after so cursor lands usably
      const spaceNode = document.createTextNode('\u200B'); // zero-width space for cursor

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(formattedEl);
      frag.appendChild(spaceNode);
      if (after) frag.appendChild(document.createTextNode(after));

      parent.replaceChild(frag, node);

      // Move cursor after the formatted element
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      setInput(inputRef.current?.innerText.trim() ?? '');
      return; // only apply one rule per keystroke
    }

    // Quote shorthand: "> " at start of text node
    if (/^> /.test(text)) {
      const content = text.slice(2);
      const bar = document.createElement('span');
      bar.style.cssText = 'display:inline-block;width:3px;background:currentColor;opacity:0.5;border-radius:9px;margin-right:8px;vertical-align:middle;';
      bar.innerHTML = '&nbsp;';
      const em = document.createElement('em');
      em.textContent = content;
      const wrapper = document.createElement('span');
      wrapper.appendChild(bar);
      wrapper.appendChild(em);
      node.parentNode!.replaceChild(wrapper, node);
      const newRange = document.createRange();
      newRange.setStartAfter(wrapper);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      setInput(inputRef.current?.innerText.trim() ?? '');
    }
  };


  const filters: FilterTab[] = ["All", "Groups", "Unread", "Marked"];

  const visibleConvs = allConvs.filter(c => {
    if (filter === "Groups") return c.type === "group";
    if (filter === "Unread") return (c.unread ?? 0) > 0;
    if (filter === "Marked") return c.marked === true;
    return true;
  }).filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const currentMsgs = histories[activeConv.id] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv, histories]);

  // Supabase Realtime Setup
  useEffect(() => {
    // 1. Get current logged-in user context
    const initUser = async () => {
       const { data } = await supabase.from('employees').select('id, name').limit(1).single();
       if (data) {
         setCurrentEmpId(data.id);
         return data.id;
       }
       return null;
    };

    // 2. Load existing messages from DB
    const loadMessages = async (empId: string | null) => {
      const { data, error } = await supabase.from('messages').select('*, employees(name)').order('created_at', { ascending: true });
      if (data && !error) {
        setHistories(prev => {
           const newHist = { ...prev };
           data.forEach((m: any) => {
              const cId = parseInt(m.conversation_id);
              if (!newHist[cId]) newHist[cId] = [];
              if (!newHist[cId].find(existing => existing.id === m.id)) {
                newHist[cId].push({
                  id: m.id,
                  type: m.type as MsgType,
                  sender: m.sender_id === empId ? "me" : "them",
                  senderName: m.employees?.name,
                  text: m.text,
                  time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                });
              }
           });
           return newHist;
        });
      }
    };
    
    let channel: any = null;
    let isMounted = true;

    initUser().then(async (empId) => {
       if (!isMounted) return;
       await loadMessages(empId);
       
       // 3. Subscribe to Realtime Updates
       channel = supabase.channel('realtime_messages');
       
       channel
         .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
           const m = payload.new;
           // fetch the name attached to sender_id
           const { data: empData } = await supabase.from('employees').select('name').eq('id', m.sender_id).single();
           
           if (!isMounted) return;
           setHistories(prev => {
              const cId = parseInt(m.conversation_id);
              const newHist = { ...prev };
              if (!newHist[cId]) newHist[cId] = [];
              if (!newHist[cId].find(existing => existing.id === m.id || existing.text === m.text)) {
                 newHist[cId].push({
                     id: m.id,
                     type: m.type as MsgType,
                     sender: m.sender_id === empId ? "me" : "them",
                     senderName: empData?.name,
                     text: m.text,
                     time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                 });
              }
              return newHist;
           });
         })
         .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const selectConv = (c: Conversation) => {
    setActiveConv(c);
    cancelRecording();
  };

  const sendMessage = async () => {
    const div = inputRef.current;
    const trimmed = (div?.innerText ?? input).trim();
    if (!trimmed) return;
    
    // Quick optimistic UI update
    const tempId = Date.now().toString();
    const newMsg: Message = {
      id: tempId, type: "text", sender: "me",
      text: trimmed,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    
    setHistories(prev => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] ?? []), newMsg],
    }));
    
    if (div) div.innerHTML = '';
    setInput('');

    // Insert into Supabase
    await supabase.from('messages').insert({
      conversation_id: activeConv.id.toString(),
      sender_id: currentEmpId,
      text: trimmed,
      type: 'text'
    });
  };

  /* ── voice recording ── */
  const startRecording = () => {
    setRecording(true);
    setRecElapsed(0);
    recTimerRef.current = setInterval(() => setRecElapsed(e => e + 1), 1000);
  };

  const cancelRecording = () => {
    setRecording(false);
    setRecElapsed(0);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
  };

  const sendVoiceMessage = (capturedWaveform: number[]) => {
    const dur = Math.max(1, recElapsed);
    const newMsg: Message = {
      id: Date.now(),
      type: "voice",
      sender: "me",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      voiceDuration: formatSecs(dur),
      waveform: capturedWaveform,
    };
    setHistories(prev => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] ?? []), newMsg],
    }));
    cancelRecording();
  };

  useEffect(() => () => { if (recTimerRef.current) clearInterval(recTimerRef.current); }, []);

  const SENDER_COLORS: Record<string, { color: string; bg: string }> = {
    "Maya Patel":     { color: "#34C759", bg: "#B8F0CC" },
    "Ahmad Silva":    { color: "#FF2D55", bg: "#FFC1CC" },
    "Deepika Nair":   { color: "#AF52DE", bg: "#F5EAFF" },
    "Surya Kumar":    { color: "var(--user-accent)", bg: "#007AFF40" },
    "MS Dhoni":       { color: "#FF9500", bg: "#FF950040" },
    "KrishnaKumar":   { color: "#5856D6", bg: "#5856D640" },
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white dark:bg-[#0B0B0F]">
      {/* ── LEFT ─────────────────────────────────────────── */}
      <div className="w-[30%] min-w-[340px] max-w-[420px] shrink-0 flex flex-col bg-white dark:bg-[#0B0B0F] border-r border-[#E5E7EB] dark:border-[#2A2A31]">
        <div className="px-5 py-[14px] flex items-center justify-between bg-white dark:bg-[#0B0B0F]">
          <h1 className="text-[28px] font-medium text-[#111827] dark:text-white tracking-tight font-sans">Messages</h1>
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#54656f] dark:text-[#A1A1AA]">
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#54656f] dark:text-[#A1A1AA]">
              <MoreVertical className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#E5E7EB] dark:border-[#2A2A31]">
          <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#1C1C22] rounded-full h-[36px] overflow-hidden">
            <button className="absolute left-0 w-12 h-full flex items-center justify-center transition-opacity hover:opacity-80">
              <Search className="h-[18px] w-[18px] text-[#54656f] dark:text-[#A1A1AA]" strokeWidth={2.5} />
            </button>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search or start a new chat"
              className="w-full h-full pl-12 pr-4 bg-transparent text-[15px] text-[#111b21] dark:text-white placeholder:text-[#54656f] dark:placeholder:text-[#A1A1AA] focus:outline-none"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-[var(--user-accent)] text-white shadow-sm"
                  : "bg-[#f0f2f5] dark:bg-[#1C1C22] text-[#54656f] dark:text-[#A1A1AA] hover:bg-[#e9edef] dark:hover:bg-[#2A2A31]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-scroll flex flex-col pt-1 chat-scrollbar overflow-x-hidden">
          {visibleConvs.length === 0 && (
            <div className="py-10 text-center text-[14px] text-[#54656f] dark:text-[#A1A1AA] font-medium">No results found</div>
          )}
          {visibleConvs.map(c => {
            const isActive = activeConv.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => selectConv(c)}
                className={`w-[calc(100%-16px)] mx-2 my-[1px] rounded-[10px] flex items-center gap-3 px-3 py-2.5 transition-colors relative group ${
                  isActive
                    ? "bg-[#f0f2f5] dark:bg-[#2A2A31]"
                    : "hover:bg-[#f5f6f6] dark:hover:bg-[#1C1C22]"
                }`}
              >
                {/* Avatar */}
                <div className="pl-1">
                  {c.type === "group" ? (
                    <GroupAvatar members={c.members!} />
                  ) : (
                    <div className="relative shrink-0">
                      <div className="h-[48px] w-[48px] rounded-full flex items-center justify-center text-[16px] font-bold overflow-hidden text-white"
                        style={{ background: c.color }}>
                        {c.initials}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info (no bottom border per user request) */}
                <div className="flex-1 min-w-0 pr-2 h-[52px] flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-[17px] truncate ${isActive ? "text-[#111b21] dark:text-white font-medium" : "text-[#111b21] dark:text-white"}`}>
                      {c.name}
                    </p>
                    <span className={`text-[12px] shrink-0 ml-2 ${c.unread! > 0 ? "text-[var(--user-accent)] font-medium" : "text-[#54656f] dark:text-[#A1A1AA]"}`}>
                      {c.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] text-[#54656f] dark:text-[#A1A1AA] truncate">{c.preview}</p>
                    {(c.unread ?? 0) > 0 && (
                      <span className="min-w-[20px] h-[20px] bg-[var(--user-accent)] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0 ml-2">
                        {c.unread! > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT (Main View Wrapper) ──────────────────── */}
      <div className="flex-1 flex min-w-0">
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-[#efeae2] dark:bg-[#0B0B0F]">
        
        {/* Custom Background Images */}
        <div 
          className="absolute inset-0 z-0 opacity-40 dark:opacity-100 hidden dark:block"
          style={{ backgroundImage: `url('/ChatBackgroundDark.avif')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div 
          className="absolute inset-0 z-0 opacity-40 dark:hidden"
          style={{ backgroundImage: `url('/ChatBackgroundLight.avif')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />

        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-[10px] bg-[#f0f2f5] dark:bg-[#1C1C22] shrink-0 relative z-10 border-b border-[#E5E7EB] dark:border-[#2A2A31]">
          {activeConv.type === "group" ? (
            <GroupAvatar members={activeConv.members!} />
          ) : (
            <div className="h-[40px] w-[40px] rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 text-white"
              style={{ background: activeConv.color }}>
              {activeConv.initials}
            </div>
          )}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowContactInfo(true)}>
            <h2 className="text-[16px] text-[#111b21] dark:text-white font-medium truncate">{activeConv.name}</h2>
            {activeConv.type === "group" ? (
              <p className="text-[13px] text-[#54656f] dark:text-[#A1A1AA] truncate">
                {activeConv.members?.map(m => m.name.split(' ')[0]).join(', ')}
              </p>
            ) : (
              <p className="text-[13px] text-[#54656f] dark:text-[#A1A1AA] truncate">
                {activeConv.online ? "online" : "click here for contact info"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#54656f] dark:text-[#A1A1AA]">
              <Search className="h-[20px] w-[20px]" strokeWidth={2} />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#54656f] dark:text-[#A1A1AA]">
              <MoreVertical className="h-[20px] w-[20px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-scroll px-8 py-6 flex flex-col gap-4 pb-[90px] relative z-10 chat-scrollbar overflow-x-hidden">
          {currentMsgs.map((msg, i) => {
            const showTodayDivider = i === 2 && [1, 4, 101].includes(activeConv.id!);
            const sc = msg.senderName ? SENDER_COLORS[msg.senderName] : null;
            const isMe = msg.sender === "me";

            return (
              <React.Fragment key={msg.id}>
                {showTodayDivider && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-[#1d1d1f] dark:text-white font-bold bg-[#F9FAFB] dark:bg-[#0B0B0F] px-3">Today</span>
                  </div>
                )}

                {msg.type === "trip-card" ? (
                  <div className="flex justify-start w-full my-2">
                    <TripCard msg={msg} />
                  </div>
                ) : msg.type === "voice" ? (
                  <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={isMe ? "mr-[10px]" : "ml-[10px] flex items-end gap-2"}>
                      {!isMe && msg.senderName && sc && (
                        <div className="h-[28px] w-[28px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mb-1 text-white border border-black/5 dark:border-white/10" style={{ background: sc.color }}>
                          {msg.senderName.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                        </div>
                      )}
                      <div>
                        {!isMe && msg.senderName && sc && (
                          <div className="text-[13px] font-medium mb-1 ml-1" style={{ color: sc.color }}>
                            ~ {msg.senderName}
                          </div>
                        )}
                        <VoiceBubble msg={msg} isMe={isMe} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="relative">
                      {!isMe && (
                        <div className="ml-[10px] flex items-end gap-2 max-w-[85%] md:max-w-[70%] lg:max-w-[500px]">
                          {/* Avatar column — always shown in group, aligned bottom */}
                          {activeConv.type === "group" && (
                            <div className="shrink-0 mb-[2px]">
                              {msg.senderName && sc ? (
                                <div className="h-[34px] w-[34px] rounded-full flex items-center justify-center text-[12px] font-bold text-white border border-black/5 dark:border-white/10" style={{ background: sc.color }}>
                                  {msg.senderName.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                                </div>
                              ) : (
                                <div className="h-[34px] w-[34px] rounded-full bg-gray-300 dark:bg-gray-600" />
                              )}
                            </div>
                          )}

                          {activeConv.type === "group" ? (
                            <div className="flex flex-col">
                              {/* Sender name ABOVE the bubble */}
                              {msg.senderName && sc && (
                                <span className="text-[13px] font-semibold mb-1 ml-1" style={{ color: sc.color }}>
                                  {msg.senderName}
                                </span>
                              )}
                              {isEmojiOnly(msg.text ?? "") ? (
                                <div className="ml-1">
                                  <span className="text-[48px] leading-tight select-none">{msg.text}</span>
                                  <span className="text-[11px] text-[#54656f] dark:text-[#8696A0] block mt-0.5">{msg.time}</span>
                                </div>
                              ) : (
                                <div className="relative px-3 pt-2 pb-2 rounded-[8px] rounded-tl-none bg-white dark:bg-[#1C1C22] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] flex flex-col">
                                  <TailThem />
                                  <span className="text-[15px] text-[#111b21] dark:text-[#E9EDEF] leading-snug break-words" dangerouslySetInnerHTML={msg.html ? { __html: msg.html } : undefined}>{msg.html ? undefined : renderMsgText(msg.text ?? "")}</span>
                                  <span className="text-[11px] text-[#54656f] dark:text-[#8696A0] self-end mt-1 leading-none">{msg.time}</span>
                                </div>
                              )}
                            </div>
                          ) : isEmojiOnly(msg.text ?? "") ? (
                            // Emoji-only DM
                            <div className="ml-2">
                              <span className="text-[48px] leading-tight select-none">{msg.text}</span>
                              <span className="text-[11px] text-[#54656f] dark:text-[#8696A0] block mt-0.5">{msg.time}</span>
                            </div>
                          ) : (
                            <div className="relative px-3 py-1.5 rounded-[8px] rounded-tl-none bg-white dark:bg-[#1C1C22] shadow-[0_1px_0.5px_rgba(11,20,26,.13)]">
                              <TailThem />
                              <div className="flex flex-col">
                                <span className="text-[15px] text-[#111b21] dark:text-white leading-snug break-words pr-8" dangerouslySetInnerHTML={msg.html ? { __html: msg.html } : undefined}>{msg.html ? undefined : renderMsgText(msg.text ?? "")}</span>
                                <span className="text-[11px] text-[#54656f] dark:text-[#A1A1AA] self-end mt-1 -mr-1 -mb-0.5 leading-none">{msg.time}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {isMe && (
                        <div className="mr-[10px]">
                          {isEmojiOnly(msg.text ?? "") ? (
                            // Emoji-only: large emojis, no bubble
                            <div className="flex flex-col items-end">
                              <span className="text-[48px] leading-tight select-none">{msg.text}</span>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[11px] text-[#54656f] dark:text-[#8696A0] leading-none">{msg.time}</span>
                                <svg viewBox="0 0 16 16" width="14" height="13" className="text-[var(--user-accent)]">
                                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                                </svg>
                              </div>
                            </div>
                          ) : (
                            // Normal bubble
                            <div className="relative px-3 py-1.5 rounded-[8px] rounded-tr-none bg-[var(--user-accent)] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] flex flex-col max-w-[85%] md:max-w-[70%] lg:max-w-[500px]">
                              <TailMe />
                              <span className="text-[15px] text-white leading-snug break-words pr-12" dangerouslySetInnerHTML={msg.html ? { __html: msg.html } : undefined}>{msg.html ? undefined : renderMsgText(msg.text ?? "")}</span>
                              <div className="flex items-center gap-1 self-end mt-1 -mr-1 -mb-0.5">
                                <span className="text-[11px] text-white/70 leading-none">{msg.time}</span>
                                <svg viewBox="0 0 16 16" width="16" height="15" className="text-white">
                                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input Bar / Recording Bar (Floating Style) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-full max-w-[1200px] px-8 z-20 relative">
          {/* Text Format Toolbar — floats above the pill */}
          {fmtToolbar && (
            <div className="absolute bottom-full left-8 mb-3 flex items-center gap-[2px] bg-[#1A1A1F] border border-[#2A2A31] rounded-[10px] px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-1 fade-in duration-150">
              {/* B */}
              {([
                { id:'bold',   jsx: <span className="font-bold   text-[14px]">B</span> },
                { id:'italic', jsx: <span className="italic      text-[14px]">I</span> },
                { id:'strike', jsx: <span className="line-through text-[14px]">S</span> },
                { id:'code',   jsx: <span className="font-mono   text-[13px]">&lt;&gt;</span> },
              ] as const).map(btn => (
                <button
                  key={btn.id}
                  onMouseDown={e => { e.preventDefault(); applyFormat(btn.id as 'bold'|'italic'|'strike'|'code'); }}
                  className={`min-w-[30px] h-8 px-2 rounded-[6px] flex items-center justify-center transition-colors ${
                    activeFormats.has(btn.id) ? 'bg-white text-[#1A1A1F]' : 'text-white hover:bg-white/10'
                  }`}
                >{btn.jsx}</button>
              ))}
              {/* Ordered list SVG */}
              <button
                onMouseDown={e => { e.preventDefault(); applyList('number'); }}
                className={`min-w-[30px] h-8 px-2 rounded-[6px] flex items-center justify-center transition-colors ${
                  activeFormats.has('number') ? 'bg-white text-[#1A1A1F]' : 'text-white hover:bg-white/10'
                }`}
              >
                <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                  <path d="M1 1h2M1 5h2M1 9h2M5 2h12M5 6h12M5 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <text x="0.5" y="15" fontSize="5" fill="currentColor" fontFamily="monospace">1.</text>
                </svg>
              </button>
              {/* Unordered list SVG */}
              <button
                onMouseDown={e => { e.preventDefault(); applyList('bullet'); }}
                className={`min-w-[30px] h-8 px-2 rounded-[6px] flex items-center justify-center transition-colors ${
                  activeFormats.has('bullet') ? 'bg-white text-[#1A1A1F]' : 'text-white hover:bg-white/10'
                }`}
              >
                <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                  <circle cx="2" cy="3" r="1.5" fill="currentColor"/>
                  <circle cx="2" cy="8" r="1.5" fill="currentColor"/>
                  <circle cx="2" cy="13" r="1.5" fill="currentColor"/>
                  <path d="M6 3h11M6 8h11M6 13h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {/* Quote */}
              <button
                onMouseDown={e => { e.preventDefault(); applyFormat('quote'); }}
                className={`min-w-[30px] h-8 px-2 rounded-[6px] flex items-center justify-center text-[16px] transition-colors ${
                  activeFormats.has('quote') ? 'bg-white text-[#1A1A1F]' : 'text-white hover:bg-white/10'
                }`}
              >❞</button>
            </div>
          )}
          <div className="bg-[#f0f2f5] dark:bg-[#1C1C22] rounded-full flex items-center gap-2 px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#E5E7EB] dark:border-[#2A2A31]">
            {recording ? (
              <RecordingBar
                elapsed={recElapsed}
                onCancel={cancelRecording}
                onSend={sendVoiceMessage}
              />
            ) : (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                    className="h-[40px] w-[40px] flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors group"
                  >
                    <Plus className={`h-[24px] w-[24px] text-[#8696a0] dark:text-[#A1A1AA] group-hover:text-[#54656f] dark:group-hover:text-white transition-transform duration-200 ${attachMenuOpen ? "rotate-45" : ""}`} strokeWidth={2} />
                  </button>

                  {/* Attachment Popover */}
                  {attachMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-4 bg-white dark:bg-[#1C1C22] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#E5E7EB] dark:border-[#2A2A31] w-[210px] py-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <FileText className="h-[18px] w-[18px] text-[#5856D6]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Document</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <ImageIcon className="h-[18px] w-[18px] text-[#007AFF]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Photos & videos</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <Camera className="h-[18px] w-[18px] text-[#FF2D55]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Camera</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <Headphones className="h-[18px] w-[18px] text-[#FF9500]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Audio</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <User className="h-[18px] w-[18px] text-[#00C7BE]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Contact</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <ListTodo className="h-[18px] w-[18px] text-[#FFCC00]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Poll</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <Calendar className="h-[18px] w-[18px] text-[#FF2D55]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Event</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A31] transition-colors text-left group">
                        <MapPin className="h-[18px] w-[18px] text-[#34C759]" strokeWidth={2.5} />
                        <span className="text-[14px] font-medium text-[#111b21] dark:text-white">Travel</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => { setEmojiOpen(!emojiOpen); setAttachMenuOpen(false); }}
                    className="h-[40px] w-[40px] flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors group"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" className={`transition-colors ${emojiOpen ? "text-[var(--user-accent)]" : "text-[#8696a0] dark:text-[#A1A1AA] group-hover:text-[#54656f] dark:group-hover:text-white"}`}>
                      <path fill="currentColor" d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"></path>
                    </svg>
                  </button>

                  {emojiOpen && (
                    <EmojiPicker
                      onSelect={(emoji) => {
                        const div = inputRef.current;
                        if (!div) return;
                        div.focus();
                        const sel = window.getSelection();
                        let range = savedRangeRef.current;

                        if (!range || !div.contains(range.commonAncestorContainer)) {
                           // Fallback to inserting at the end if we have no saved range
                           range = document.createRange();
                           range.selectNodeContents(div);
                           range.collapse(false);
                        }

                        if (sel) {
                          const textNode = document.createTextNode(emoji);
                          range.deleteContents();
                          range.insertNode(textNode);
                          range.setStartAfter(textNode);
                          range.collapse(true);
                          sel.removeAllRanges();
                          sel.addRange(range);
                          savedRangeRef.current = range; // Update so subsequent emojis stay here
                        } else {
                          div.innerText += emoji;
                        }

                        setInput(div.innerText.trim());
                        applyInputRules();
                      }}
                      onClose={() => setEmojiOpen(false)}
                    />
                  )}
                </div>
                <div className="flex-1 flex items-center overflow-hidden">
                  <div
                    ref={inputRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={e => { setInput((e.currentTarget as HTMLDivElement).innerText.trim()); applyInputRules(); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    onSelect={() => {
                      const sel = window.getSelection();
                      setFmtToolbar(!!(sel && !sel.isCollapsed));
                    }}
                    onBlur={() => {
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0) {
                        savedRangeRef.current = sel.getRangeAt(0);
                      }
                      setTimeout(() => setFmtToolbar(false), 150);
                    }}
                    data-placeholder="Type a message"
                    className="w-full bg-transparent px-2 py-2.5 text-[15px] text-[#111b21] dark:text-white focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#8696a0] dark:empty:before:text-[#A1A1AA] empty:before:pointer-events-none"
                    style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto', lineHeight: '1.5' }}
                  />
                </div>
                {input.trim() ? (
                  <button
                    onClick={sendMessage}
                    className="h-[40px] w-[40px] flex items-center justify-center shrink-0 bg-[var(--user-accent)] hover:bg-[#0062CC] rounded-full transition-all shadow-[0_2px_8px_rgba(0,122,255,0.35)] scale-100 hover:scale-105 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-white fill-current">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="h-[40px] w-[40px] flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors group"
                  >
                    <Mic className="h-[22px] w-[22px] text-[#8696a0] dark:text-[#A1A1AA] group-hover:text-[#54656f] dark:group-hover:text-white transition-colors" strokeWidth={2} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Contact Info Panel */}
        {showContactInfo && (
          <ContactInfoPanel conv={activeConv} onClose={() => setShowContactInfo(false)} />
        )}
      </div>
    </div>
  </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full bg-[#f0f2f5] dark:bg-[#111b21]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div></div>}>
      <MessagesContent />
    </Suspense>
  );
}
