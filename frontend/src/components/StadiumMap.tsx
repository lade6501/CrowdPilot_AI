import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { translations } from "../utils/translations";
import { GateInspector } from "./GateInspector";
import { StadiumHeader } from "./StadiumMap/StadiumHeader";
import { ReplayControls } from "./StadiumMap/ReplayControls";
import { Stadium2D } from "./StadiumMap/Stadium2D";
import { timeSlots } from "./StadiumMap/stadiumConstants";

const StadiumMap3D = lazy(() =>
  import("./StadiumMap3D").then((module) => ({ default: module.StadiumMap3D })),
);

export const StadiumMap: React.FC = () => {
  const {
    stadiumState,
    selectedGate,
    setSelectedGate,
    activeTimeSlot,
    selectReplaySlot,
    resetToLive,
    appLanguage,
  } = useCrowdPilot();

  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [hoveredGate, setHoveredGate] = useState<string | null>(null);
  const [showCrowd, setShowCrowd] = useState(true);
  const [showAIPaths, setShowAIPaths] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);

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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    selectReplaySlot(timeSlots[index]);
  };

  const currentSliderIndex = timeSlots.indexOf(activeTimeSlot);

  const overloadedGates = Object.keys(gates).filter(
    (g) => (gates[g]?.occupancy || 0) >= 75,
  );
  const criticalGates = Object.keys(gates).filter(
    (g) => (gates[g]?.occupancy || 0) >= 90,
  );

  const activeIncidents = stadiumState.incidents.filter(
    (incident) => incident.status === "active",
  );
  const activeIncident = activeIncidents[0];
  const incidentTitle = activeIncident?.title || "";
  const isFire =
    incidentTitle.toLowerCase().includes("fire") ||
    incidentTitle.toLowerCase().includes("evac");
  const isMedical =
    incidentTitle.toLowerCase().includes("medical") ||
    incidentTitle.toLowerCase().includes("health");
  const isStorm =
    incidentTitle.toLowerCase().includes("storm") ||
    incidentTitle.toLowerCase().includes("rain") ||
    incidentTitle.toLowerCase().includes("lightning");
  const isWhistle =
    incidentTitle.toLowerCase().includes("whistle") ||
    incidentTitle.toLowerCase().includes("full-time") ||
    incidentTitle.toLowerCase().includes("full time");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative flex flex-col items-center justify-between min-h-115">
        <StadiumHeader
          t={t}
          stadiumState={stadiumState}
          activeTimeSlot={activeTimeSlot}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <div className="w-full flex-1 relative min-h-105 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {viewMode === "2D" ? (
              <motion.div
                key="2d-view"
                initial={{
                  opacity: 1,
                  scale: 1,
                  rotateX: 0,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  rotateX: 15,
                  y: -15,
                  filter: "blur(4px)",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full flex flex-col items-center justify-between"
                style={{ perspective: 1000 }}
              >
                <Stadium2D
                  gates={gates}
                  setSelectedGate={setSelectedGate}
                  hoveredGate={hoveredGate}
                  setHoveredGate={setHoveredGate}
                  showCrowd={showCrowd}
                  showAIPaths={showAIPaths}
                  showResources={showResources}
                  showPredictions={showPredictions}
                  overloadedGates={overloadedGates}
                  criticalGates={criticalGates}
                  isWhistle={isWhistle}
                  isFire={isFire}
                  isStorm={isStorm}
                  isMedical={isMedical}
                  selectedGate={selectedGate}
                  stadiumState={stadiumState}
                  setShowCrowd={setShowCrowd}
                  setShowAIPaths={setShowAIPaths}
                  setShowResources={setShowResources}
                  setShowPredictions={setShowPredictions}
                />
              </motion.div>
            ) : (
              <motion.div
                key="3d-view"
                initial={{
                  opacity: 0,
                  scale: 1.05,
                  rotateX: -15,
                  y: 15,
                  filter: "blur(4px)",
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateX: 0,
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  scale: 1.05,
                  rotateX: -15,
                  y: 15,
                  filter: "blur(4px)",
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
                style={{ perspective: 1000 }}
              >
                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center h-130 bg-slate-950/40 rounded-2xl border border-white/5 text-gray-400 space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold"></div>
                      <p className="text-xs font-semibold text-gray-200">
                        Booting 3D Holographic Twin...
                      </p>
                    </div>
                  }
                >
                  <StadiumMap3D />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ReplayControls
          t={t}
          stadiumState={stadiumState}
          currentSliderIndex={currentSliderIndex}
          handleSliderChange={handleSliderChange}
          resetToLive={resetToLive}
        />
      </div>

      <GateInspector
        gates={gates}
        selectedGate={selectedGate}
        setSelectedGate={setSelectedGate}
        stadiumState={stadiumState}
        appLanguage={appLanguage}
      />
    </div>
  );
};
