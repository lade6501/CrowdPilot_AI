import React from "react";
import { Users, Timer, CalendarRange } from "lucide-react";
import { translations } from "../utils/translations";

interface GateInspectorProps {
  gates: any;
  selectedGate: string | null;
  setSelectedGate: (g: string | null) => void;
  stadiumState: any;
  appLanguage: string;
}

export const GateInspector: React.FC<GateInspectorProps> = ({
  gates,
  selectedGate,
  setSelectedGate,
  stadiumState,
  appLanguage,
}) => {
  const t = (translations as any)[appLanguage] || translations.en;

  const getPredictions = (gateName: string, currentOccupancy: number) => {
    const variance = gateName === "Gate B" && currentOccupancy >= 90 ? 4 : 2;
    const confidence = gateName === "Gate B" && currentOccupancy >= 90 ? 98 : 88;
    switch (gateName) {
      case "Gate A":
        return { pred: Math.min(95, currentOccupancy + 19), eta: 3, variance, confidence };
      case "Gate B":
        return { pred: Math.min(100, currentOccupancy + 2), eta: 3, variance, confidence };
      case "Gate C":
        return { pred: Math.max(5, currentOccupancy - 8), eta: 1, variance, confidence };
      case "Gate D":
        return { pred: Math.min(95, currentOccupancy + 6), eta: 14, variance, confidence };
      default:
        return { pred: currentOccupancy, eta: 15, variance, confidence: 95 };
    }
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

            <div className={`p-4 rounded-xl space-y-3 transition-colors duration-300 ${getGateBorderClass(selectedGate, gates[selectedGate]?.occupancy)}`}>
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
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5 mt-2">
                      <div>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Prediction</span>
                        <span className="text-xs font-black text-fifa-gold">{pred.pred}%</span>
                        <span className="text-[7px] text-gray-600 block">Conf: {pred.confidence}%</span>
                      </div>
                      <div className="border-x border-white/5">
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">ETA</span>
                        <span className="text-xs font-black text-gray-300">{pred.eta} min</span>
                        <span className="text-[7px] text-gray-600 block">SLA Threshold</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Trend</span>
                        <span className={`text-[10px] font-black uppercase flex items-center justify-center gap-0.5 mt-0.5 ${
                          pred.pred > (gates[selectedGate]?.occupancy || 0)
                            ? "text-red-400"
                            : pred.pred < (gates[selectedGate]?.occupancy || 0)
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }`}>
                          {pred.pred > (gates[selectedGate]?.occupancy || 0)
                            ? "▲ Rising"
                            : pred.pred < (gates[selectedGate]?.occupancy || 0)
                            ? "▼ Stable"
                            : "▬ Constant"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

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

            <div className="bg-blue-950/20 p-3 rounded-xl border border-blue-500/15 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                  <span className="text-sm">♿</span>
                  <span>Accessibility Operations</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  gates[selectedGate]?.occupancy >= 75
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {gates[selectedGate]?.occupancy >= 75 ? "Rerouting Carts" : "Assisted Access Active"}
                </span>
              </div>
              <div className="text-[10px] text-gray-300 leading-relaxed">
                {gates[selectedGate]?.occupancy >= 75 ? (
                  <span className="text-amber-300/90 font-medium">
                    ⚠️ High load detected. Mobility carts and wheelchair companion lines are being routed to adjacent gates to bypass queue wait times.
                  </span>
                ) : (
                  <span>
                    Featuring dedicated low-gradient wheelchair ramps, audio wayfinding beacons, and priority lanes for spectators with companion seating.
                  </span>
                )}
              </div>
            </div>

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
          <div className="flex flex-col items-start justify-center h-[260px] border border-dashed border-white/10 rounded-xl p-5 text-gray-400 bg-slate-900/10">
            <span className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="h-4 w-4 text-fifa-gold" /> {appLanguage === "es" ? "Seleccione una puerta para inspeccionar:" : appLanguage === "fr" ? "Sélectionnez une porte pour inspecter:" : appLanguage === "hi" ? "निरीक्षण करने के लिए एक गेट चुनें:" : "Select a gate to inspect:"}
            </span>
            <ul className="space-y-2 text-[11px] text-gray-400 pl-1">
              <li>• {appLanguage === "es" ? "Carga de Ocupación" : appLanguage === "fr" ? "Charge d'occupation" : appLanguage === "hi" ? "अधिभोग लोड" : "Occupancy load"}</li>
              <li>• {appLanguage === "es" ? "Tamaño de colas y flujos" : appLanguage === "fr" ? "Taille des files et débits" : appLanguage === "hi" ? "कतार का आकार और प्रवाह" : "Queue trends and arrival rates"}</li>
              <li>• {appLanguage === "es" ? "Congestión prevista" : appLanguage === "fr" ? "Congestion prévue" : appLanguage === "hi" ? "अनुमानित भीड़" : "Predicted congestion thresholds"}</li>
              <li>• {appLanguage === "es" ? "Recomendaciones de IA activas" : appLanguage === "fr" ? "Recommandations IA actives" : appLanguage === "hi" ? "सक्रिय एआई सिफारिशें" : "Active AI recommendations"}</li>
            </ul>
          </div>
        )}
      </div>

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
  );
};
