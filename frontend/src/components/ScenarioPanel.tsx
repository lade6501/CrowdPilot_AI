import React, { useState } from "react";

import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { translations } from "../utils/translations";
import { Play, RotateCcw, AlertTriangle, ArrowRight, Sparkles, HelpCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

export const ScenarioPanel: React.FC = () => {
  const { 
    runSimulation, 
    simulationLoading, 
    simulationResult, 
    clearSimulation,
    appLanguage,
    deployScenarioPlan
  } = useCrowdPilot();
  
  const [scenarioInput, setScenarioInput] = useState<string>("");

  const t = translations[appLanguage] || translations.en;

  const templates = [
    "What happens if Gate B closes?",
    "If heavy rain starts now?",
    "If Metro Line 2 stops?",
  ];

  const handleTemplateClick = (temp: string) => {
    setScenarioInput(temp);
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioInput.trim()) return;
    runSimulation(scenarioInput);
  };

  
  const getProjectedColor = (status: string) => {
    if (status === "critical") return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
    if (status === "warning") return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
    return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
  };

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-fifa-gold" />
          {t.scenario_title}
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          {t.scenario_desc}
        </p>

        {}
        <div className="flex flex-wrap gap-2 mb-4">
          {templates.map((temp) => (
            <button
              key={temp}
              type="button"
              disabled={simulationLoading}
              onClick={() => handleTemplateClick(temp)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:border-fifa-gold text-gray-300 hover:text-gray-100 transition-colors"
            >
              {temp}
            </button>
          ))}
        </div>

        {}
        <form onSubmit={handleSimulate} className="flex gap-2">
          <input
            type="text"
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            disabled={simulationLoading}
            placeholder="Type scenario (e.g. What if Gate C closes?)..."
            className="flex-1 text-xs px-3 py-2.5 rounded-xl glass-input"
          />
          <button
            type="submit"
            disabled={simulationLoading || !scenarioInput.trim()}
            className="px-4 py-2.5 bg-fifa-gold hover:bg-yellow-600 disabled:bg-slate-800 disabled:text-gray-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {simulationLoading ? (
              <span className="h-3 w-3 animate-spin border-2 border-slate-950 border-t-transparent rounded-full"></span>
            ) : (
              <Play className="h-3 w-3" />
            )}
            {t.scenario_run}
          </button>
        </form>
      </div>

      {}
      <div className="mt-6 flex-1 flex flex-col justify-center">
        {simulationLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold mb-3"></div>
            <p className="text-xs">{t.scenario_running}</p>
            <p className="text-[10px] opacity-75 mt-0.5">{t.scenario_agent_msg}</p>
          </div>
        )}

        {!simulationLoading && !simulationResult && (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-xl text-center text-gray-500 text-xs">
            <HelpCircle className="h-8 w-8 mb-2 opacity-35" />
            <p>{t.scenario_ready}</p>
            <p className="opacity-75 mt-0.5">{t.scenario_ready_desc}</p>
          </div>
        )}

        {!simulationLoading && simulationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {}
            <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {t.scenario_result}
                </span>
                <span className="text-[10px] bg-slate-900 border border-white/10 px-2 py-0.5 rounded-full text-gray-400 font-semibold">
                  {t.scenario_confidence}: {simulationResult.confidence_score}%
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed italic">"{simulationResult.summary}"</p>
            </div>

            {}
            <div className="space-y-3 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">{t.scenario_flow_title}</span>
              
              <div className="space-y-3">
                {simulationResult.impact_metrics.map((metric) => {
                  const isPositive = metric.occupancy_change_percent > 0;
                  const isZero = metric.occupancy_change_percent === 0;
                  const isClosure = metric.occupancy_change_percent <= -50 || metric.projected_status === "critical" && metric.occupancy_change_percent < 0;
                  
                  const displayLoad = isClosure ? 5 : Math.max(15, Math.min(100, 50 + metric.occupancy_change_percent));

                  return (
                    <div key={metric.gate_name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-300">{metric.gate_name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                            metric.projected_status === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : metric.projected_status === "warning"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {metric.projected_status}
                          </span>
                          
                          {!isZero && (
                            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isPositive ? "text-red-400" : "text-emerald-400"}`}>
                              {isPositive ? (
                                <>
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  <span>+{metric.occupancy_change_percent}%</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="h-3.5 w-3.5" />
                                  <span>{metric.occupancy_change_percent}%</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden relative border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${displayLoad}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${getProjectedColor(metric.projected_status)}`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">{t.scenario_delay}</span>
              <span className={`text-sm font-extrabold ${simulationResult.average_delay_change_mins > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {simulationResult.average_delay_change_mins > 0 ? "+" : ""}
                {simulationResult.average_delay_change_mins} min
              </span>
            </div>

            {}
            <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs">
              <span className="text-[10px] text-fifa-gold font-bold uppercase tracking-wider block mb-1">{t.scenario_mitigations}</span>
              <ul className="space-y-1.5 text-gray-300">
                {simulationResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-fifa-gold mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => deployScenarioPlan(simulationResult.summary)}
                className="flex-1 py-2 bg-fifa-gold hover:bg-yellow-600 text-slate-950 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md"
              >
                <Play className="h-3 w-3 pl-0.5" /> Deploy Plan
              </button>
              <button
                type="button"
                onClick={clearSimulation}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3 w-3" /> {t.scenario_reset}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
