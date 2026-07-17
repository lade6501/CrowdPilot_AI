import React, { useState, useEffect } from "react";
import { useCrowdPilot } from "../context/CrowdPilotContext";

interface AITranslateProps {
  text: string;
}

export const AITranslate: React.FC<AITranslateProps> = ({ text }) => {
  const { appLanguage, translateText } = useCrowdPilot();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let active = true;
    if (appLanguage === "en") {
      setTranslated(text);
      return;
    }
    
    translateText(text, appLanguage).then((res) => {
      if (active) setTranslated(res);
    });
    
    return () => {
      active = false;
    };
  }, [text, appLanguage, translateText]);

  return <>{translated}</>;
};
