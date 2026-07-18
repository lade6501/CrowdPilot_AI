import { useContext } from "react";
import { CrowdPilotContext } from "../context/CrowdPilotContextInstance";

export const useCrowdPilot = () => {
  const context = useContext(CrowdPilotContext);
  if (context === undefined) {
    throw new Error("useCrowdPilot must be used within a CrowdPilotProvider");
  }
  return context;
};
