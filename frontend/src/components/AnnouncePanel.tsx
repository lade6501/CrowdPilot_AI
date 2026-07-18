import React, { useState, useEffect } from "react";

import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { translations } from "../utils/translations";
import {
  Megaphone,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  QrCode,
} from "lucide-react";
import { motion } from "framer-motion";

export const AnnouncePanel: React.FC = () => {
  const {
    generateAnnouncement,
    announcementLoading,
    announcementResult,
    clearAnnouncement,
    appLanguage,
    stadiumState,
  } = useCrowdPilot();

  const [situation, setSituation] = useState<string>(
    "Gate B closed due to technical issues, redirecting to D.",
  );
  const [audience, setAudience] = useState<string>("International Visitors");
  const [tone, setTone] = useState<string>("Calm");
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [activeSpeechLang, setActiveSpeechLang] = useState<string | null>(null);

  const t = translations[appLanguage] || translations.en;

  const toneOptions = ["Calm", "Urgent", "Informative"];
  const audienceOptions = [
    "International Visitors",
    "General Public",
    "South Plaza Visitors",
  ];

  const situations = [
    {
      label: "Gate B Congestion",
      desc: "Gate B is closed. Reroute to Gate D.",
    },
    {
      label: "Metro Line 2 Delay",
      desc: "Metro Line 2 is experiencing a 10-minute delay. Use shuttle buses.",
    },
    {
      label: "Heavy Storm Warning",
      desc: "Heavy rain starting soon. Seek cover inside concourses.",
    },
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim()) return;
    generateAnnouncement(situation, tone, audience);
  };

  const copyToClipboard = (text: string, lang: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  const speakText = (text: string, langKey: string) => {
    if (activeSpeechLang === langKey) {
      window.speechSynthesis.cancel();
      setActiveSpeechLang(null);
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const langLocales: Record<string, string> = {
      english: "en-US",
      spanish: "es-ES",
      french: "fr-FR",
      portuguese: "pt-PT",
      hindi: "hi-IN",
    };

    utterance.lang = langLocales[langKey] || "en-US";
    utterance.rate = 0.92;

    utterance.onstart = () => {
      setActiveSpeechLang(langKey);
      setIsPlaying(true);
      setAudioProgress(0);
    };

    utterance.onend = () => {
      setActiveSpeechLang(null);
      setIsPlaying(false);
      setAudioProgress(100);
    };

    utterance.onerror = () => {
      setActiveSpeechLang(null);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setActiveSpeechLang(null);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + 2;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const autoDraft = stadiumState?.auto_draft_announcement;

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2 mb-2">
          <Megaphone className="h-5 w-5 text-fifa-gold" />
          {t.announce_title}
        </h2>
        <p className="text-xs text-gray-400 mb-3">{t.announce_desc}</p>

        {}
        {autoDraft && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-4 text-xs space-y-2 border-dashed">
            <div className="flex items-center justify-between text-purple-400 font-bold uppercase tracking-wider text-[8px]">
              <span className="flex items-center gap-1">
                🤖 Crowd Flow ➔ Comms Agent Handoff
              </span>
              <span className="bg-purple-500/20 text-purple-300 px-1 rounded animate-pulse">
                Staged
              </span>
            </div>
            <p className="text-gray-300 italic text-[10px]">
              "{autoDraft.situation}"
            </p>
            <button
              type="button"
              onClick={() => {
                setSituation(autoDraft.situation);
                setAudience(autoDraft.audience || "General Public");
                setTone(autoDraft.tone || "Calm");
              }}
              className="w-full py-1 bg-purple-500 hover:bg-purple-600 text-slate-950 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors"
            >
              Apply Auto-Drafted Transcript
            </button>
          </div>
        )}

        {}
        <div className="space-y-2 mb-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">
            Quick Situations
          </span>
          <div className="flex flex-wrap gap-2">
            {situations.map((sit, i) => (
              <button
                key={i}
                type="button"
                disabled={announcementLoading}
                onClick={() => setSituation(sit.desc)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:border-fifa-gold text-gray-300 hover:text-gray-100 transition-colors"
              >
                {sit.label}
              </button>
            ))}
          </div>
        </div>

        {}
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-semibold">
              {t.announce_sit_label}
            </label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              disabled={announcementLoading}
              placeholder="e.g. Gate B closed due to technical issues..."
              className="w-full text-xs px-3 py-2 rounded-xl glass-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-semibold">
                {t.announce_aud_label}
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={announcementLoading}
                className="w-full text-xs px-3 py-2 rounded-xl glass-input"
              >
                {audienceOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-950">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-semibold">
                {t.announce_tone_label}
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={announcementLoading}
                className="w-full text-xs px-3 py-2 rounded-xl glass-input"
              >
                {toneOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-950">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={announcementLoading || !situation.trim()}
            className="w-full py-2.5 bg-fifa-gold hover:bg-yellow-600 disabled:bg-slate-800 disabled:text-gray-600 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            {announcementLoading ? (
              <span className="h-3.5 w-3.5 animate-spin border-2 border-slate-950 border-t-transparent rounded-full"></span>
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
            {t.announce_generate}
          </button>
        </form>
      </div>

      {}
      <div className="mt-6 flex-1 flex flex-col justify-center">
        {announcementLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold mb-3"></div>
            <p className="text-xs">{t.announce_generating}</p>
            <p className="text-[10px] opacity-75 mt-0.5">
              {t.announce_agent_msg}
            </p>
          </div>
        )}

        {!announcementLoading && !announcementResult && (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-xl text-center text-gray-500 text-xs">
            <Megaphone className="h-8 w-8 mb-2 opacity-35" />
            <p>{t.announce_ready}</p>
            <p className="opacity-75 mt-0.5">{t.announce_ready_desc}</p>
          </div>
        )}

        {!announcementLoading && announcementResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {}
            <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-4 text-xs">
              <button
                type="button"
                onClick={
                  isPlaying
                    ? stopSpeech
                    : () => speakText(announcementResult.english, "english")
                }
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-all ${
                  isPlaying
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-fifa-gold hover:bg-yellow-600 text-slate-950"
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 pl-0.5" />
                )}
              </button>

              {}
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                  {isPlaying
                    ? `${t.announce_listening}: ${activeSpeechLang?.toUpperCase()}`
                    : "PA Audio Ready"}
                </span>
                <div className="flex items-center gap-1 h-5">
                  {[
                    4, 12, 8, 20, 16, 24, 10, 18, 14, 28, 6, 12, 16, 20, 8, 22,
                    12, 4,
                  ].map((h, i) => {
                    const isActive = isPlaying;
                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isActive ? "bg-fifa-gold" : "bg-slate-800"
                        }`}
                        style={{
                          height: isPlaying
                            ? `${Math.max(4, h + Math.sin((audioProgress + i) * 0.4) * 6)}px`
                            : "4px",
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>

              <span className="text-[10px] text-gray-500 font-mono shrink-0">
                {isPlaying
                  ? `0:${Math.floor((audioProgress / 100) * 14)
                      .toString()
                      .padStart(2, "0")}`
                  : "0:00"}
              </span>
            </div>

            {}
            <div className="max-h-55 overflow-y-auto space-y-3 pr-1">
              {[
                {
                  key: "english",
                  label: "English",
                  text: announcementResult.english,
                },
                {
                  key: "spanish",
                  label: "Español",
                  text: announcementResult.spanish,
                },
                {
                  key: "french",
                  label: "Français",
                  text: announcementResult.french,
                },
                {
                  key: "portuguese",
                  label: "Português",
                  text: announcementResult.portuguese,
                },
                {
                  key: "hindi",
                  label: "हिन्दी (Hindi)",
                  text: announcementResult.hindi,
                },
              ].map((lang) => (
                <div
                  key={lang.key}
                  className="bg-slate-900/50 p-3 rounded-xl border border-white/5 relative group/item space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-fifa-gold uppercase tracking-wider">
                      {lang.label}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-60 group-hover/item:opacity-100 transition-opacity">
                      {}
                      <button
                        onClick={() => speakText(lang.text, lang.key)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          activeSpeechLang === lang.key
                            ? "text-fifa-gold"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                        title="Listen to PA voice synthesis"
                      >
                        {activeSpeechLang === lang.key ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5 pl-0.5" />
                        )}
                      </button>

                      {}
                      <button
                        onClick={() => copyToClipboard(lang.text, lang.key)}
                        className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Copy text"
                      >
                        {copiedLang === lang.key ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>

                      {}
                      <button
                        onClick={() =>
                          setShowQR(showQR === lang.key ? null : lang.key)
                        }
                        className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-slate-800 transition-colors"
                        title={t.announce_push_terminal}
                      >
                        <QrCode className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {}
                  {showQR === lang.key && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
                      <svg
                        viewBox="0 0 100 100"
                        className="h-28 w-28 fill-gray-200"
                      >
                        <path d="M5,5 h30 v30 h-30 z M15,15 h10 v10 h-10 z M65,5 h30 v30 h-30 z M75,15 h10 v10 h-10 z M5,65 h30 v30 h-30 z M15,75 h10 v10 h-10 z M45,45 h10 v10 h-10 z M55,55 h15 v5 h-15 z M45,75 h5 v15 h-5 z M85,65 h10 v20 h-10 z M55,85 h15 v5 h-15 z" />
                      </svg>
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                        {t.announce_push_terminal}
                      </span>
                      <p className="text-[8px] text-slate-500">
                        {t.announce_push_desc}
                      </p>
                    </div>
                  )}

                  <p
                    className={`text-xs text-gray-300 leading-relaxed ${lang.key === "hindi" ? "font-serif text-sm" : ""}`}
                  >
                    {lang.text}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={clearAnnouncement}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" /> {t.announce_reset}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
