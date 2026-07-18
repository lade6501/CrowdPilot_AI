import React, { useEffect, useState } from "react";

import { CrowdPilotProvider } from "./context/CrowdPilotContext";
import { useCrowdPilot } from "./hooks/useCrowdPilot";
import { getBaseUrl } from "./utils/api";
import { translations } from "./utils/translations";
import { AppHeader } from "./components/layout/AppHeader";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { OperationsTab } from "./components/layout/OperationsTab";
import { DecisionStudioTab } from "./components/layout/DecisionStudioTab";
import { AnalyticsTab } from "./components/layout/AnalyticsTab";

const DashboardContent: React.FC = () => {
  const {
    connected,
    tick,
    stadiumState,
    injectIncident,
    injectorLoading,
    appLanguage,
    setAppLanguage,
    updateAutonomyLevel,
    voiceAssistEnabled,
    setVoiceAssistEnabled,
  } = useCrowdPilot();

  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "studio" | "retro">(
    "live",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "live" || tabParam === "studio" || tabParam === "retro") {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (tab: "live" | "studio" | "retro") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/status`);
        if (res.ok) {
          const data = await res.json();
          setApiConfigured(data.gemini_api_configured);
        }
      } catch {}
    };
    checkStatus();
  }, []);

  const handleInject = (type: string) => {
    if (injectorLoading) return;
    injectIncident(type);
  };

  const t = translations[appLanguage] || translations.en;

  const activeIncidents = (stadiumState?.incidents || []).filter(
    (inc) => inc.status === "active",
  );
  const hasActiveIncidents = activeIncidents.length > 0;
  const activeActions = stadiumState?.actions_queue || [];
  const isReasoning =
    activeActions.some(
      (act) => act.status === "pending" || act.status === "review",
    ) || injectorLoading;
  const isActing = activeActions.some(
    (act) =>
      act.status === "approved" ||
      act.status === "auto_executed" ||
      act.status === "resolved_by_governance",
  );
  const isVerifying = activeActions.some(
    (act) =>
      act.verification_status === "success" ||
      act.verification_status === "failed",
  );
  const hasReasoned = activeActions.length > 0 && !isReasoning;
  const hasActed = activeActions.length > 0 && !isActing && !isReasoning;
  const hasVerified =
    activeActions.length > 0 && !isVerifying && !isActing && !isReasoning;

  return (
    <DashboardLayout
      activeTab={activeTab}
      handleTabChange={handleTabChange}
      stadiumState={stadiumState}
      appHeader={
        <AppHeader
          t={t}
          stadiumState={stadiumState}
          tick={tick}
          appLanguage={appLanguage}
          setAppLanguage={setAppLanguage}
          voiceAssistEnabled={voiceAssistEnabled}
          setVoiceAssistEnabled={setVoiceAssistEnabled}
          updateAutonomyLevel={updateAutonomyLevel}
          apiConfigured={apiConfigured}
          hasActiveIncidents={hasActiveIncidents}
          activeActions={activeActions}
          isReasoning={isReasoning}
          hasReasoned={hasReasoned}
          isActing={isActing}
          hasActed={hasActed}
          isVerifying={isVerifying}
          hasVerified={hasVerified}
          connected={connected}
        />
      }
    >
      <div className={activeTab === "live" ? "space-y-8 block" : "hidden"}>
        <OperationsTab />
      </div>
      <div className={activeTab === "studio" ? "space-y-8 block" : "hidden"}>
        <DecisionStudioTab
          t={t}
          injectorLoading={injectorLoading}
          handleInject={handleInject}
        />
      </div>
      <div className={activeTab === "retro" ? "space-y-8 block" : "hidden"}>
        <AnalyticsTab />
      </div>
    </DashboardLayout>
  );
};

function App() {
  return (
    <CrowdPilotProvider>
      <DashboardContent />
    </CrowdPilotProvider>
  );
}

export default App;
