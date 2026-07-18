import React from "react";
import type { StadiumState } from "../../context/CrowdPilotContextInstance";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: "live" | "studio" | "retro";
  handleTabChange: (tab: "live" | "studio" | "retro") => void;
  stadiumState: StadiumState | null;
  appHeader: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  handleTabChange,
  stadiumState,
  appHeader,
}) => {
  const pendingActionCount = (stadiumState?.actions_queue || []).filter(
    (action) => action.status === "pending",
  ).length;

  return (
    <div className="min-h-screen pb-12">
      {appHeader}

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-px">
          <button
            onClick={() => handleTabChange("live")}
            className={`px-4 py-2 text-xs transition-all flex items-center gap-1.5 relative border-b-2 ${
              activeTab === "live"
                ? "border-emerald-500 text-emerald-400 font-black shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35)]"
                : "border-transparent text-gray-400 hover:text-gray-200 font-bold"
            }`}
          >
            🟢 Live Operations
            {pendingActionCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded-full font-bold animate-bounce">
                {pendingActionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("studio")}
            className={`px-4 py-2 text-xs transition-all flex items-center gap-1.5 relative border-b-2 ${
              activeTab === "studio"
                ? "border-amber-500 text-amber-400 font-black shadow-[0_4px_12px_-2px_rgba(245,158,11,0.35)]"
                : "border-transparent text-gray-400 hover:text-gray-200 font-bold"
            }`}
          >
            ⚡ Decision Studio
          </button>

          <button
            onClick={() => handleTabChange("retro")}
            className={`px-4 py-2 text-xs transition-all flex items-center gap-1.5 relative border-b-2 ${
              activeTab === "retro"
                ? "border-fifa-gold text-fifa-gold font-black shadow-[0_4px_12px_-2px_rgba(234,179,8,0.35)]"
                : "border-transparent text-gray-400 hover:text-gray-200 font-bold"
            }`}
          >
            📊 Operations Intelligence
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {children}
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
        <span>
          © 2026 FIFA World Cup Organizers. Managed by CrowdPilot Intelligence.
        </span>
        <div className="flex gap-4 items-center">
          <span>Security Protocol: AES-256</span>
          <span>Access Level: Stadium Commander</span>
          {stadiumState?.ai_ops_calls !== undefined && (
            <span className="bg-fifa-gold/15 text-fifa-gold border border-fifa-gold/25 px-2 py-0.5 rounded font-mono font-bold">
              AI Calls: {stadiumState.ai_ops_calls}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};
