import React, { useState } from "react";
import { useCrowdPilot } from "../context/CrowdPilotContext";
import { translations } from "../utils/translations";
import { Users, Timer, Sparkles, Clock, RefreshCw, CalendarRange } from "lucide-react";

export const StadiumMap: React.FC = () => {
  const { 
    stadiumState, 
    selectedGate, 
    setSelectedGate, 
    activeTimeSlot, 
    selectReplaySlot,
    resetToLive,
    appLanguage
  } = useCrowdPilot();

  const [hoveredGate, setHoveredGate] = useState<string | null>(null);

  if (!stadiumState) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl glass-panel text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold mx-auto mb-3"></div>
          <p>Connecting to Live Stadium Feeds...</p>
        </div>
      </div>
    );
  }

  const { gates } = stadiumState;
  const t = translations[appLanguage] || translations.en;

  
  const timeSlots = ["7:00 PM", "7:30 PM", "8:00 PM", "9:00 PM"];

  
  const getPredictions = (gateName: string, currentOccupancy: number) => {
    const variance = gateName === "Gate B" && currentOccupancy >= 90 ? 4 : 2;
    const confidence = gateName === "Gate B" && currentOccupancy >= 90 ? 74 : 88; 

    switch (gateName) {
      case "Gate B":
        if (currentOccupancy >= 90) return { pred: 98, eta: 3, variance, confidence };
        if (currentOccupancy >= 70) return { pred: 92, eta: 6, variance, confidence };
        return { pred: 75, eta: 12, variance, confidence };
      case "Gate A":
        return { pred: Math.min(95, currentOccupancy + 8), eta: 10, variance, confidence };
      case "Gate C":
        return { pred: Math.min(95, currentOccupancy + 5), eta: 15, variance, confidence };
      case "Gate D":
        return { pred: Math.min(95, currentOccupancy + 6), eta: 14, variance, confidence };
      default:
        return { pred: currentOccupancy, eta: 15, variance, confidence: 95 };
    }
  };

  const getGateColorClass = (occupancy: number) => {
    if (occupancy >= 90) return "fill-red-500 stroke-red-600 animate-pulse";
    if (occupancy >= 75) return "fill-amber-500 stroke-amber-600";
    return "fill-emerald-500 stroke-emerald-600";
  };

  const getGateBorderClass = (gateName: string, occupancy: number) => {
    const isSelected = selectedGate === gateName;
    if (occupancy >= 90) {
      return isSelected 
        ? "border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] bg-red-950/40" 
        : "border border-red-500/40 bg-red-950/20";
    }
    if (occupancy >= 75) {
      return isSelected 
        ? "border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-950/40" 
        : "border border-amber-500/40 bg-amber-950/20";
    }
    return isSelected 
      ? "border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-emerald-950/40" 
      : "border border-emerald-500/30 bg-emerald-950/10";
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    selectReplaySlot(timeSlots[index]);
  };

  const currentSliderIndex = timeSlots.indexOf(activeTimeSlot);

  
  const getLocalizedAlertText = (gateName: string, occupancy: number, queue: number, flowRate: number) => {
    if (flowRate === 0 && occupancy > 35) {
      switch (appLanguage) {
        case "es":
          return `Bloqueo de emergencia: El rendimiento de ${gateName} ha bajado a 0 p/m. Los caminos del corredor están cerrados por seguridad.`;
        case "fr":
          return `Verrouillage d'urgence: Le débit de ${gateName} est tombé à 0 p/m. Les couloirs sont verrouillés pour des raisons de sécurité.`;
        case "hi":
          return `आपातकालीन अवरोध: ${gateName} की प्रवाह दर 0 लो/मिनट तक गिर गई है। सुरक्षा प्रोटोकॉल के कारण गलियारे बंद हैं।`;
        default:
          return `Emergency Block: ${gateName} throughput has dropped to 0 p/m. Corridor paths are locked due to security overrides or local hazards.`;
      }
    }

    if (occupancy >= 90) {
      switch (appLanguage) {
        case "es":
          return `Alerta crítica: La densidad de cola en ${gateName} está al ${occupancy}% de su capacidad, con ${queue} unidades atascadas.`;
        case "fr":
          return `Alerte critique: La file d'attente à ${gateName} est de ${occupancy}% (${queue} unités). Évacuation requise.`;
        case "hi":
          return `गंभीर कतार: ${gateName} घनत्व ${occupancy}% क्षमता पर है। कतार में ${queue} इकाइयां फंसी हैं।`;
        default:
          return `Critical Alert: ${gateName} queue density is at ${occupancy}% capacity. Processing queue contains ${queue} units with severe backlogs.`;
      }
    }

    if (occupancy >= 75) {
      switch (appLanguage) {
        case "es":
          return `Advertencia: La carga de ${gateName} se está acercando a los límites de advertencia (${occupancy}% de ocupación).`;
        case "fr":
          return `Avertissement: La charge de la ${gateName} approche de sa capacité limite (${occupancy}% d'occupation).`;
        case "hi":
          return `चेतावनी: ${gateName} भार चेतावनी सीमा के करीब है (${occupancy}% अधिभोग)। प्रवाह की निगरानी करें।`;
        default:
          return `Warning: ${gateName} load is approaching capacity warning limits (${occupancy}% occupancy). Average flow rate is ${flowRate} p/m.`;
      }
    }

    switch (appLanguage) {
      case "es":
        return `Operaciones normales: ${gateName} está funcionando dentro de los límites normales (${occupancy}%). Tasa de flujo: ${flowRate} p/m.`;
      case "fr":
        return `Opérations normales: La ${gateName} fonctionne dans les limites normales (${occupancy}%). Débit : ${flowRate} p/m.`;
      case "hi":
        return `सामान्य संचालन: ${gateName} स्वीकृत मानकों के भीतर काम कर रहा है (${occupancy}%)। प्रवाह दर: ${flowRate} लो/मिनट।`;
      default:
        return `Normal Operations: ${gateName} is operating within accepted safety parameters (${occupancy}% load). Flow rate: ${flowRate} p/m.`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative flex flex-col items-center justify-between min-h-[460px]">
        {}
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fifa-gold" />
              {t.twin_title}
            </h2>
            <p className="text-xs text-gray-400">
              {stadiumState.mode === "replay" ? `${t.twin_replay_mode}: ${activeTimeSlot}` : t.twin_live_feed}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">{t.twin_mode}:</span>
            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded ${
              stadiumState.mode === "replay" 
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
            }`}>
              {stadiumState.mode === "replay" ? t.twin_replay_mode : "Live"}
            </span>
          </div>
        </div>

        {}
        <svg viewBox="0 0 800 420" className="w-full max-w-[600px] drop-shadow-[0_0_30px_rgba(15,30,54,0.3)]">
          <ellipse cx="400" cy="210" rx="360" ry="170" className="fill-none stroke-slate-800 stroke-[2] stroke-dasharray-4" />
          <ellipse cx="400" cy="210" rx="300" ry="140" className="fill-slate-900/60 stroke-slate-700/80 stroke-[3]" />
          <ellipse cx="400" cy="210" rx="240" ry="110" className="fill-slate-950/40 stroke-slate-800 stroke-[2]" />
          
          {}
          <rect x="290" y="145" width="220" height="130" rx="6" className="fill-slate-900/90 stroke-slate-700 stroke-[1.5]" />
          <ellipse cx="400" cy="210" rx="30" ry="30" className="fill-none stroke-slate-800 stroke-[1.5]" />
          <line x1="400" y1="145" x2="400" y2="275" className="stroke-slate-800 stroke-[1.5]" />
          
          {}
          <g 
            className="cursor-pointer group" 
            onClick={() => setSelectedGate("Gate A")}
            onMouseEnter={() => setHoveredGate("Gate A")}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <line x1="400" y1="70" x2="400" y2="100" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
            <circle 
              cx="400" 
              cy="70" 
              r={hoveredGate === "Gate A" ? 19 : 15} 
              className={`${getGateColorClass(gates["Gate A"]?.occupancy)} stroke-2 transition-all duration-300`} 
            />
            <text x="400" y="74" textAnchor="middle" className="fill-slate-950 font-bold text-xs">A</text>
            <text x="400" y="47" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
              Gate A ({gates["Gate A"]?.occupancy}%)
            </text>
            {gates["Gate A"]?.occupancy >= 90 && (
              <circle 
                cx="400" 
                cy="70" 
                r="25" 
                className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                style={{ transformOrigin: "400px 70px" }}
              />
            )}
          </g>

          {}
          <g 
            className="cursor-pointer group" 
            onClick={() => setSelectedGate("Gate B")}
            onMouseEnter={() => setHoveredGate("Gate B")}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <line x1="700" y1="210" x2="640" y2="210" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
            <circle 
              cx="700" 
              cy="210" 
              r={hoveredGate === "Gate B" ? 19 : 15} 
              className={`${getGateColorClass(gates["Gate B"]?.occupancy)} stroke-2 transition-all duration-300`} 
            />
            <text x="700" y="214" textAnchor="middle" className="fill-slate-950 font-bold text-xs">B</text>
            <text x="700" y="187" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
              Gate B ({gates["Gate B"]?.occupancy}%)
            </text>
            {gates["Gate B"]?.occupancy >= 90 && (
              <circle 
                cx="700" 
                cy="210" 
                r="25" 
                className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                style={{ transformOrigin: "700px 210px" }}
              />
            )}
          </g>

          {}
          <g 
            className="cursor-pointer group" 
            onClick={() => setSelectedGate("Gate C")}
            onMouseEnter={() => setHoveredGate("Gate C")}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <line x1="400" y1="350" x2="400" y2="320" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
            <circle 
              cx="400" 
              cy="350" 
              r={hoveredGate === "Gate C" ? 19 : 15} 
              className={`${getGateColorClass(gates["Gate C"]?.occupancy)} stroke-2 transition-all duration-300`} 
            />
            <text x="400" y="354" textAnchor="middle" className="fill-slate-950 font-bold text-xs">C</text>
            <text x="400" y="377" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
              Gate C ({gates["Gate C"]?.occupancy}%)
            </text>
            {gates["Gate C"]?.occupancy >= 90 && (
              <circle 
                cx="400" 
                cy="350" 
                r="25" 
                className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                style={{ transformOrigin: "400px 350px" }}
              />
            )}
          </g>

          {}
          <g 
            className="cursor-pointer group" 
            onClick={() => setSelectedGate("Gate D")}
            onMouseEnter={() => setHoveredGate("Gate D")}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <line x1="100" y1="210" x2="160" y2="210" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
            <circle 
              cx="100" 
              cy="210" 
              r={hoveredGate === "Gate D" ? 19 : 15} 
              className={`${getGateColorClass(gates["Gate D"]?.occupancy)} stroke-2 transition-all duration-300`} 
            />
            <text x="100" y="214" textAnchor="middle" className="fill-slate-950 font-bold text-xs">D</text>
            <text x="100" y="187" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
              Gate D ({gates["Gate D"]?.occupancy}%)
            </text>
            {gates["Gate D"]?.occupancy >= 90 && (
              <circle 
                cx="100" 
                cy="210" 
                r="25" 
                className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                style={{ transformOrigin: "100px 210px" }}
              />
            )}
          </g>

          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -20;
              }
            }
          `}</style>

          {}
          {gates["Gate B"]?.occupancy >= 90 && (
            <g>
              <path
                d="M 700 210 Q 400 130 100 210"
                fill="none"
                stroke="#eab308"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="stroke-fifa-gold animate-[dash_2s_linear_infinite]"
                style={{ opacity: 0.7 }}
              />
              <text x="400" y="145" textAnchor="middle" className="fill-fifa-gold font-mono text-[9px] font-bold tracking-wider animate-pulse">
                ⚠️ SPILLOVER FLOW PREDICTED (B ➔ D)
              </text>
            </g>
          )}

          {}
          {selectedGate === "Gate B" && stadiumState?.sla_countdown !== undefined && stadiumState?.sla_countdown !== null && (
            <g transform="translate(700, 160)">
              <rect x="-35" y="-10" width="70" height="15" rx="3" className="fill-red-950/90 stroke stroke-red-500/50" />
              <text x="0" y="1" textAnchor="middle" className="fill-red-400 font-black font-mono text-[8px] animate-pulse">
                SLA: {stadiumState.sla_countdown}s
              </text>
            </g>
          )}

          {}
          {(stadiumState as any)?.assets?.map((asset: any) => (
            <g key={asset.id} className="transition-all duration-300">
              <circle
                cx={asset.x}
                cy={asset.y}
                r={14}
                className={`fill-none stroke-2 ${
                  asset.type === "medic"
                    ? "stroke-red-500"
                    : asset.type === "shuttle"
                    ? "stroke-purple-500"
                    : "stroke-blue-500"
                } animate-ping`}
                style={{ transformOrigin: `${asset.x}px ${asset.y}px` }}
              />
              <circle
                cx={asset.x}
                cy={asset.y}
                r={8}
                className={
                  asset.type === "medic"
                    ? "fill-red-500"
                    : asset.type === "shuttle"
                    ? "fill-purple-500"
                    : "fill-blue-500"
                }
              />
              <g transform={`translate(${asset.x - 35}, ${asset.y - 28})`}>
                <rect
                  rx={4}
                  width={70}
                  height={15}
                  className="fill-slate-950/95 stroke stroke-white/20"
                />
                <text
                  x={35}
                  y={10}
                  textAnchor="middle"
                  className="fill-gray-100 font-mono text-[7.5px] font-bold"
                >
                  {asset.label} ({asset.status})
                </text>
              </g>
            </g>
          ))}
        </svg>

        {}
        <div className="w-full bg-slate-950/80 border border-white/5 rounded-2xl p-4 mt-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <Clock className="h-4 w-4 text-fifa-gold" />
            <span>{t.twin_timeline}</span>
          </div>

          {}
          <div className="flex-1 px-4 flex flex-col justify-center relative w-full">
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={currentSliderIndex !== -1 ? currentSliderIndex : 0}
              onChange={handleSliderChange}
              className="w-full accent-fifa-gold h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            {}
            <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-500 uppercase px-1">
              <span>7:00 PM</span>
              <span>7:30 PM</span>
              <span>8:00 PM</span>
              <span>9:00 PM</span>
            </div>
          </div>

          {}
          <div className="flex gap-2">
            {stadiumState.mode === "replay" ? (
              <button
                onClick={resetToLive}
                className="py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {t.twin_resume_live}
              </button>
            ) : (
              <div className="py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {t.twin_streaming_live}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-100 mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-fifa-gold" />
            {t.inspector_title}
          </h3>

          {selectedGate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-100">{selectedGate}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                  gates[selectedGate]?.occupancy >= 90 
                    ? "bg-red-500/20 text-red-400" 
                    : gates[selectedGate]?.occupancy >= 75 
                    ? "bg-amber-500/20 text-amber-400" 
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {gates[selectedGate]?.occupancy >= 90 
                    ? t.inspector_critical 
                    : gates[selectedGate]?.occupancy >= 75 
                    ? t.inspector_warning 
                    : t.inspector_normal}
                </span>
              </div>

              {}
              <div className={`p-4 rounded-xl space-y-3 transition-colors duration-300 ${getGateBorderClass(selectedGate, gates[selectedGate]?.occupancy)}`}>
                {}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t.inspector_current}</span>
                    <span className="text-sm font-extrabold text-gray-100">{gates[selectedGate]?.occupancy}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        gates[selectedGate]?.occupancy >= 90 
                          ? "bg-red-500" 
                          : gates[selectedGate]?.occupancy >= 75 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${gates[selectedGate]?.occupancy}%` }}
                    ></div>
                  </div>
                </div>

                {}
                {(() => {
                  const pred = getPredictions(selectedGate, gates[selectedGate]?.occupancy);
                  return (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      {selectedGate === "Gate B" && stadiumState?.sla_countdown !== undefined && stadiumState?.sla_countdown !== null && (
                        <div className="p-2 bg-red-950/50 border border-red-500/25 rounded-xl flex items-center justify-between text-[10px] animate-pulse">
                          <span className="text-red-400 font-bold uppercase tracking-wide">⚠️ Safety SLA Limit:</span>
                          <span className="font-mono font-black text-red-400 text-xs bg-red-950 px-1.5 py-0.5 rounded border border-red-500/30">
                            {stadiumState.sla_countdown}s
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-fifa-gold font-bold uppercase tracking-wider block">{t.inspector_predicted}</span>
                          <span className="text-base font-black text-gray-100">{pred.pred}% ± {pred.variance}%</span>
                          <span className="text-[8px] text-gray-500 block">Confidence: {pred.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-fifa-gold font-bold uppercase tracking-wider block">{t.inspector_eta}</span>
                          <span className="text-base font-black text-gray-100">{pred.eta} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px]">{t.inspector_queue}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-100">
                    {gates[selectedGate]?.queue} <span className="text-xs font-normal text-gray-400">{t.inspector_units}</span>
                  </span>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Timer className="h-4 w-4" />
                    <span className="text-[10px]">{t.inspector_flow}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-100">
                    {gates[selectedGate]?.flow_rate} <span className="text-xs font-normal text-gray-400">{t.inspector_flow_unit}</span>
                  </span>
                </div>
              </div>

              {}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 text-xs text-gray-300">
                {(() => {
                  const gate = gates[selectedGate];
                  if (!gate) return null;
                  const { occupancy, queue, flow_rate } = gate;
                  return getLocalizedAlertText(selectedGate, occupancy, queue, flow_rate);
                })()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-xl p-4 text-center text-gray-500">
              <Users className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{t.inspector_no_gate}</p>
              <p className="text-xs opacity-75 mt-1">{t.inspector_no_gate_desc}</p>
            </div>
          )}
        </div>

        {}
        {selectedGate && (
          <div className="pt-4 border-t border-white/5 mt-4">
            <button 
              onClick={() => setSelectedGate(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-gray-300 rounded-lg transition-colors"
            >
              {t.inspector_clear}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
