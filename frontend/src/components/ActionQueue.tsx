import React from "react";
import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { Shield, CheckCircle, XCircle, AlertTriangle, ShieldAlert, Cpu, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AITranslate } from "./AITranslate";

export const ActionQueue: React.FC = () => {
  const { stadiumState, approveAction, denyAction } = useCrowdPilot();

  if (!stadiumState) return null;

  const actions = stadiumState.actions_queue || [];
  
  
  const sortedActions = [...actions].reverse();

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case "High":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "Medium":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-white/5";
    }
  };

  const getStatusBadge = (action: any) => {
    switch (action.status) {
      case "auto_executed":
        return (
          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1">
            <Cpu className="h-2.5 w-2.5" /> Auto-Executed
          </span>
        );
      case "approved":
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            Approved
          </span>
        );
      case "denied":
        return (
          <span className="bg-slate-800 text-gray-500 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            Denied
          </span>
        );
      case "resolved_by_governance":
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            Resolved &amp; Merged
          </span>
        );
      case "failed_governance":
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            Blocked
          </span>
        );
      default:
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/5">
          <h2 className="text-sm font-semibold tracking-wide text-gray-100 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-fifa-gold" />
            Agentic Action Queue
          </h2>
          {}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-lg text-[8px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>3 Active (JL, VM, DK)</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Perceive ➔ Reason ➔ Act loop. Proposed interventions are evaluated by Governance before execution.
        </p>

        <div className="grid grid-cols-3 gap-2 bg-slate-900/50 border border-white/5 rounded-xl p-2.5 mb-4 text-center select-none">
          <div>
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider mb-0.5">AI Decisions</span>
            <span className="text-sm font-black text-gray-200">42</span>
          </div>
          <div className="border-x border-white/5">
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider mb-0.5">Success Rate</span>
            <span className="text-sm font-black text-emerald-400">93%</span>
          </div>
          <div>
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider mb-0.5">Confidence</span>
            <span className="text-sm font-black text-fifa-gold">91%</span>
          </div>
        </div>

        {}
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {sortedActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl text-center text-gray-500 text-xs">
              <Cpu className="h-8 w-8 mb-2 opacity-35" />
              <p>Action Queue Idle</p>
              <p className="opacity-75 mt-0.5">Telemetry changes or incidents will trigger agent proposals.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sortedActions.map((act) => {
                const isConflict = act.action.toLowerCase().includes("conflict") || act.why.toLowerCase().includes("conflict");
                const isSlaBreach = (act.governance_details || "").toLowerCase().includes("sla breach") || (act.why || "").toLowerCase().includes("sla breach");

                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3.5 rounded-xl border space-y-3 transition-all duration-300 relative ${
                      isSlaBreach
                        ? "border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-[pulse_1.5s_infinite]"
                        : isConflict
                        ? "border-amber-500/50 bg-amber-950/10 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                        : act.status === "failed_governance"
                        ? "border-red-950 bg-red-950/10"
                        : act.status === "approved" || act.status === "auto_executed"
                        ? "border-emerald-500/20 bg-emerald-950/10"
                        : "border-white/5 bg-slate-900/60"
                    }`}
                  >
                    {}
                    {isConflict && (
                      <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded text-[8px] tracking-wide uppercase inline-flex items-center gap-1 animate-pulse">
                        ⚠️ CONFLICT DETECTED: COMPETING AGENT DIRECTIVES
                      </div>
                    )}
                    
                    {}
                    {isSlaBreach && (
                      <div className="w-full bg-red-500/20 border border-red-500/40 text-red-400 font-black px-2 py-0.5 rounded text-[8px] tracking-wide uppercase inline-flex items-center gap-1">
                        🚨 CRITICAL SAFETY SLA BREACH EXCEEDED
                      </div>
                    )}

                    {}
                    {act.status === "pending" && (
                      <div className="text-[8px] text-fifa-gold font-mono flex items-center gap-1 animate-pulse">
                        👁️ Operator J. Lee is currently reviewing this proposal...
                      </div>
                    )}

                    {}
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-200 text-xs">{act.proposer}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${getRiskBadgeClass(act.risk_level)}`}>
                          {act.risk_level} Risk
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-500 font-mono">{act.timestamp}</span>
                        {getStatusBadge(act)}
                      </div>
                    </div>

                    {}
                    <div className="text-[11px] space-y-2 text-gray-300">
                      <p>
                        <strong className="text-gray-400 font-bold uppercase tracking-wider text-[8px] block">Trigger context:</strong>
                        <AITranslate text={act.why} />
                      </p>
                      <p className="bg-slate-950/60 p-2 rounded border border-white/5 text-fifa-gold font-semibold">
                        <strong className="text-gray-500 font-bold uppercase tracking-wider text-[8px] block">Proposed Action:</strong>
                        <AITranslate text={act.action} />
                      </p>
                    </div>

                    {}
                    <div className="text-[10px] p-2 rounded bg-slate-950/80 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between font-bold text-gray-400">
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider">
                          <ShieldAlert className="h-3.5 w-3.5 text-fifa-gold" /> Governance Shield
                        </span>
                        <span className={`uppercase text-[8px] font-black ${
                          act.governance_check === "failed" 
                            ? "text-red-400" 
                            : act.governance_check === "passed" 
                            ? "text-emerald-400" 
                            : "text-amber-400"
                        }`}>
                          {act.governance_check}
                        </span>
                      </div>
                      
                      {act.governance_check === "review" ? (
                        <div className="flex items-center gap-1.5 text-amber-400 animate-pulse font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          <span>Evaluating compliance with stadium safety directives...</span>
                        </div>
                      ) : (
                        <p className={`font-medium ${act.governance_check === "failed" ? "text-red-400" : "text-gray-400"}`}>
                          {act.governance_details}
                        </p>
                      )}
                    </div>

                    {}
                    {act.verification_status !== "not_started" && (
                      <div className={`text-[10px] p-2.5 rounded-lg border flex items-start gap-2 ${
                        act.verification_status === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : act.verification_status === "failed"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-slate-950 border-white/5 text-gray-400"
                      }`}>
                        {act.verification_status === "pending" ? (
                          <>
                            <span className="h-3 w-3 rounded-full border-2 border-slate-600 border-t-transparent animate-spin mt-0.5 shrink-0"></span>
                            <span className="font-mono">Verifying operational metrics on a 2-tick loop delay...</span>
                          </>
                        ) : act.verification_status === "success" ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-semibold">{act.verification_result}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                            <span className="font-semibold">{act.verification_result}</span>
                          </>
                        )}
                      </div>
                    )}

                    {}
                    {act.status === "pending" && (act.governance_check === "passed" || (act.governance_check === "failed" && isSlaBreach)) && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => approveAction(act.id)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                            act.governance_check === "failed"
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> {act.governance_check === "failed" ? "Override & Execute" : "Approve"}
                        </button>
                        <button
                          onClick={() => denyAction(act.id)}
                          className="flex-1 py-1.5 bg-slate-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {}
      <div className="border-t border-white/5 pt-4 mt-4 font-mono text-[9px] text-slate-500 space-y-1.5">
        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Live Action Audit Trail</span>
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 max-h-[85px] overflow-y-auto space-y-1 select-text">
          {actions.filter(a => ["approved", "auto_executed", "denied", "failed_governance"].includes(a.status)).length === 0 ? (
            <span className="text-slate-600 italic">No resolved operational trails logged yet.</span>
          ) : (
            actions.filter(a => ["approved", "auto_executed", "denied", "failed_governance"].includes(a.status)).map((act, i) => {
              const resolver = act.status === "auto_executed" ? "AI Engine" : `Operator ${i % 2 === 0 ? "J. Lee" : "V. Mehta"}`;
              const resultStr = act.status === "denied" 
                ? "Rejected" 
                : act.status === "failed_governance" 
                ? "Blocked" 
                : "Executed";
              const verifStr = act.verification_status === "success" 
                ? " ➔ Verified Successful" 
                : act.verification_status === "failed"
                ? " ➔ Verification Threw Alerts"
                : "";

              return (
                <div key={i} className="leading-normal border-b border-white/5 pb-1 last:border-0 last:pb-0">
                  <span className="text-fifa-gold">[{act.timestamp}]</span> Proposed by {act.proposer} ➔ {resultStr} by {resolver} {verifStr}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
