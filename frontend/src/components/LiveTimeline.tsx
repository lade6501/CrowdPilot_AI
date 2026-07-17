import React from "react";
import { useCrowdPilot } from "../context/CrowdPilotContext";
import { translations } from "../utils/translations";
import { AlertCircle, ShieldAlert, CloudRain, Clock, Train } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const LiveTimeline: React.FC = () => {
  const { stadiumState, appLanguage } = useCrowdPilot();

  if (!stadiumState) return null;

  const { incidents } = stadiumState;
  const t = translations[appLanguage] || translations.en;

  
  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "medical":
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case "weather_alert":
      case "weather":
        return <CloudRain className="h-4 w-4 text-blue-400" />;
      case "metro_delay":
      case "metro":
        return <Train className="h-4 w-4 text-amber-400" />;
      case "parking_full":
        return <AlertCircle className="h-4 w-4 text-orange-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
  };

 
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "Medium":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/20";
    }
  };

  
  const sortedIncidents = [...incidents].sort((a, b) => b.id.localeCompare(a.id));

  
  const getMissionChain = (inc: any) => {
    if (inc.type === "medical") {
      switch (appLanguage) {
        case "es":
          return {
            obs: `Espectador con problemas respiratorios en la Sección 104.`,
            reason: `Altos niveles de calor y humedad dentro del tazón de asientos.`,
            decision: `Despachar al Equipo Médico 3 con camilla y equipo de ventilación.`,
            announcement: `Advertencia PA estándar local emitida para despejar pasillos del concourse.`,
            monitoring: `Los paramédicos llegaron. Espectador estabilizado. Monitoreando ruta de salida.`
          };
        case "fr":
          return {
            obs: `Détresse respiratoire d'un spectateur dans la section 104.`,
            reason: `Niveaux de chaleur et d'humidité élevés à l'intérieur du stade.`,
            decision: `Dépêcher l'équipe médicale 3 avec civière et équipement de ventilation.`,
            announcement: `Avertissement standard PA local émis pour dégager les couloirs du concourse.`,
            monitoring: `Les ambulanciers sont arrivés. Spectateur stabilisé. Surveillance de l'itinéraire de sortie.`
          };
        case "hi":
          return {
            obs: `धारा 104 में दर्शक को सांस लेने में तकलीफ।`,
            reason: `स्टेडियम के अंदर उच्च तापमान और आर्द्रता का स्तर।`,
            decision: `स्ट्रेचर और वेंटिलेशन उपकरण के साथ मेडिकल टीम 3 को रवाना करें।`,
            announcement: `कंसोर्स गलियारों को साफ करने के लिए सामान्य स्थानीय पीए चेतावनी जारी।`,
            monitoring: `चिकित्सक पहुंचे। दर्शक की हालत स्थिर। बाहर निकलने के रास्ते की निगरानी।`
          };
        default:
          return {
            obs: `Spectator respiratory distress in Section 104.`,
            reason: `High heat levels and humidity inside seating bowl.`,
            decision: `Dispatch Medics Team 3 with stretcher and ventilation equipment.`,
            announcement: `Standard local PA warning issued to clear concourse corridors.`,
            monitoring: `Paramedics arrived. Spectator stabilized. Monitoring exit routing.`
          };
      }
    }

    if (inc.type === "metro" || inc.type === "metro_delay") {
      switch (appLanguage) {
        case "es":
          return {
            obs: `Metro Express Línea 2 experimenta retraso / parada de señal.`,
            reason: `Falla del nodo de señalización en la intersección de University.`,
            decision: `Activar protocolo de autobuses de enlace. Desplegar 8 autobuses al Lote D.`,
            announcement: `Anuncio PA generado para guiar a los viajeros del tren a los andenes de enlace.`,
            monitoring: `Autobuses abordando. Retraso mitigado a menos de 8 minutos.`
          };
        case "fr":
          return {
            obs: `Métro Express Ligne 2 subit un retard / arrêt de signal.`,
            reason: `Panne du nœud de signalisation à la jonction University.`,
            decision: `Activer le protocole de navettes. Déployer 8 navettes au parking D.`,
            announcement: `Annonce PA générée pour guider les usagers du train vers les quais de navette.`,
            monitoring: `Navettes en cours d'embarquement. Retard atténué à moins de 8 minutes.`
          };
        case "hi":
          return {
            obs: `मेट्रो एक्सप्रेस लाइन 2 में देरी / सिग्नल रुकावट।`,
            reason: `यूनिवर्सिटी जंक्शन पर सिग्नलिंग नोड की विफलता।`,
            decision: `शटल बस प्रोटोकॉल सक्रिय करें। पार्किंग लॉट डी में 8 शटल बसें तैनात करें।`,
            announcement: `ट्रेन यात्रियों को शटल बे पर निर्देशित करने के लिए पीए घोषणा जारी।`,
            monitoring: `शटल में सवार हो रहे हैं। देरी को 8 मिनट से कम कर दिया गया है।`
          };
        default:
          return {
            obs: `Metro Express Line 2 experiencing delay / signal stoppage.`,
            reason: `Signaling node failure at University junction.`,
            decision: `Trigger shuttle bus protocol. Deploy 8 shuttle buses to Parking Lot D.`,
            announcement: `PA announcement generated to guide train commuters to shuttle bays.`,
            monitoring: `Shuttles boarding. Peak delay mitigated to under 8 mins. Monitoring line power.`
          };
      }
    }

    if (inc.type === "weather_alert" || inc.type === "weather") {
      switch (appLanguage) {
        case "es":
          return {
            obs: `Advertencia de rayo detectada dentro de un radio de 5 km.`,
            reason: `Sistema de tormenta de convección moviéndose hacia el este.`,
            decision: `Cerrar puertas de salida. Pedir a los espectadores que se refugien dentro.`,
            announcement: `Anuncio de emergencia de megafonía emitido en 5 idiomas aconsejando refugio inmediato.`,
            monitoring: `Salidas cerradas. Pasillos al 80% de carga de refugio.`
          };
        case "fr":
          return {
            obs: `Avertissement de foudre détecté dans un rayon de 5 km.`,
            reason: `Système tempétueux de convection se déplaçant vers l'est.`,
            decision: `Fermer les portes de sortie. Demander aux spectateurs de s'abriter à l'intérieur.`,
            announcement: `Annonce d'urgence PA diffusée en 5 langues conseillant un abri immédiat.`,
            monitoring: `Sorties scellées. Couloirs à 80% de charge d'abri.`
          };
        case "hi":
          return {
            obs: `5 किमी के दायरे में आकाशीय बिजली गिरने की चेतावनी।`,
            reason: `संवहनी तूफान प्रणाली पूर्व की ओर बढ़ रही है।`,
            decision: `निकास द्वार बंद करें। दर्शकों से ढके हुए गलियारों में शरण लेने का अनुरोध करें।`,
            announcement: `तुरंत शरण लेने की सलाह देते हुए 5 भाषाओं में आपातकालीन पीए प्रसारण जारी।`,
            monitoring: `निकास मार्ग बंद। गलियारे 80% आश्रय भार पर।`
          };
        default:
          return {
            obs: `Severe Lightning strike warning detected within 5km.`,
            reason: `Convective weather system moving East.`,
            decision: `Lock concourse exit gates. Request spectators shelter inside covered corridors.`,
            announcement: `Emergency PA warning broadcasted in 5 languages advising immediate shelter.`,
            monitoring: `Evacuation paths sealed. Corridors at 80% shelter load. Monitoring storm radar.`
          };
      }
    }

    if (inc.type === "facility") {
      switch (appLanguage) {
        case "es":
          return {
            obs: `Bloqueo de seguridad por arribo de dignatarios o alarma local.`,
            reason: `Protocolo de seguridad activo en el sector este.`,
            decision: `Cerrar temporalmente los accesos del corredor este.`,
            announcement: `Instrucciones locales de megafonía para guiar a los flujos hacia las plazas oeste.`,
            monitoring: `Flujos desviados. Zona de seguridad establecida con éxito.`
          };
        case "fr":
          return {
            obs: `Confinement de sécurité suite à l'arrivée de dignitaires ou alarme locale.`,
            reason: `Protocole de sécurité actif dans le secteur est.`,
            decision: `Fermer temporairement les accès du couloir est.`,
            announcement: `Instructions de sonorisation locales pour guider les flux vers les esplanades ouest.`,
            monitoring: `Flux déviés. Périmètre de sécurité établi avec succès.`
          };
        case "hi":
          return {
            obs: `वीआईपी आगमन या स्थानीय अलार्म के कारण सुरक्षा लॉकडाउन।`,
            reason: `पूर्वी क्षेत्र में सुरक्षा प्रोटोकॉल सक्रिय।`,
            decision: `पूर्वी गलियारे के मार्गों को अस्थायी रूप से बंद करें।`,
            announcement: `भीड़ को पश्चिमी प्लाजा की ओर निर्देशित करने के लिए स्थानीय पीए घोषणा जारी।`,
            monitoring: `भीड़ प्रवाह सफलतापूर्वक पुनर्निर्देशित। सुरक्षा घेरा मजबूत।`
          };
        default:
          return {
            obs: inc.description,
            reason: `Security protocol active in designated stadium sector.`,
            decision: `Seal specific corridors and lock flow rate throughputs.`,
            announcement: `Local radio instructions broadcasted to security teams.`,
            monitoring: `Zones sealed. Flow redirections monitoring successfully.`
          };
      }
    }

    const translateIncidentDescription = (desc: string, lang: string) => {
      if (lang === "en") return desc;
      let text = desc;
      if (text.includes("occupancy exceeded 90% threshold")) {
        const match = text.match(/(Gate [A-D])/);
        const gate = match ? match[1] : "Gate";
        const gateMap: Record<string, Record<string, string>> = {
          "Gate A": { es: "Puerta A", fr: "Porte A", hi: "गेट A" },
          "Gate B": { es: "Puerta B", fr: "Porte B", hi: "गेट B" },
          "Gate C": { es: "Puerta C", fr: "Porte C", hi: "गेट C" },
          "Gate D": { es: "Puerta D", fr: "Porte D", hi: "गेट D" },
        };
        const gTrans = gateMap[gate]?.[lang] || gate;
        if (lang === "es") {
          return `La ocupación en la ${gTrans} superó el umbral del 90% durante más de 20s sin que se completara la mitigación. SLA incumplido.`;
        }
        if (lang === "fr") {
          return `L'occupation de la ${gTrans} a dépassé le seuil de 90% pendant plus de 20s sans achèvement de l'atténuation. SLA enfreint.`;
        }
        if (lang === "hi") {
          return `शमन पूरा हुए बिना 20 सेकंड से अधिक समय तक ${gTrans} की व्यस्तता 90% की सीमा से अधिक हो गई। सुरक्षा नियम (SLA) का उल्लंघन।`;
        }
      }
      if (text.includes("capacity. Officers directing to")) {
        const lotMatch = text.match(/(Parking Lot [A-D])/i);
        const lot = lotMatch ? lotMatch[1] : "Parking Lot";
        const capMatch = text.match(/(\d+)%/);
        const cap = capMatch ? capMatch[1] : "80";
        const lotMap: Record<string, Record<string, string>> = {
          "Parking Lot A": { es: "Estacionamiento A", fr: "Parking A", hi: "पार्किंग स्थल A" },
          "Parking Lot B": { es: "Estacionamiento B", fr: "Parking B", hi: "पार्किंग स्थल B" },
          "Parking Lot C": { es: "Estacionamiento C", fr: "Parking C", hi: "पार्किंग स्थल C" },
          "Parking Lot D": { es: "Estacionamiento D", fr: "Parking D", hi: "पार्किंग स्थल D" },
        };
        const lTrans = lotMap[lot]?.[lang] || lot;
        if (lang === "es") {
          return `${lTrans} está al ${cap}% de capacidad. Oficiales dirigiendo hacia el Estacionamiento C.`;
        }
        if (lang === "fr") {
          return `Le ${lTrans} est à ${cap}% de sa capacité. Les agents orientent vers le Parking C.`;
        }
        if (lang === "hi") {
          return `${lTrans} ${cap}% क्षमता पर है। अधिकारियों द्वारा वाहनों को पार्किंग स्थल C की ओर निर्देशित किया जा रहा है।`;
        }
      }
      return desc;
    };

    switch (appLanguage) {
      case "es":
        return {
          obs: translateIncidentDescription(inc.description, "es"),
          reason: `Actualización de telemetría de operaciones estándar del estadio.`,
          decision: `Oficiales de seguridad desplegados para asegurar las líneas del sector.`,
          announcement: `No se requiere megafonía general. Comunicaciones activas del equipo local.`,
          monitoring: `Flujo de sensor estable. Continuando vigilancia normal.`
        };
      case "fr":
        return {
          obs: translateIncidentDescription(inc.description, "fr"),
          reason: `Mise à jour de la télémétrie des opérations standard du stade.`,
          decision: `Agents de sécurité déployés pour sécuriser les limites du secteur.`,
          announcement: `Aucune diffusion générale requise. Communications actives de l'équipe locale.`,
          monitoring: `Flux capteur stable. Poursuite de la surveillance normale.`
        };
      case "hi":
        return {
          obs: translateIncidentDescription(inc.description, "hi"),
          reason: `मानक स्टेडियम संचालन टेलीमेट्री अपडेट।`,
          decision: `सुरक्षा अधिकारी क्षेत्र की सीमा रेखाओं को सुरक्षित करने के लिए तैनात।`,
          announcement: `कोई सामान्य पीए प्रसारण आवश्यक नहीं है। स्थानीय टीम संचार सक्रिय।`,
          monitoring: `सेंसर फीड स्थिर। सामान्य निगरानी जारी रखी जा रही है।`
        };
      default:
        return {
          obs: inc.description,
          reason: `Standard stadium operations telemetry update.`,
          decision: `Safety officers dispatched to secure sector boundary lines.`,
          announcement: `No general PA broadcast required. Local team communications active.`,
          monitoring: `Sensor feed stable. Continuing normal surveillance.`
        };
    }
  };

  const getLocalizedPriority = (priority: string) => {
    const pLower = priority.toLowerCase();
    switch (appLanguage) {
      case "es":
        if (pLower === "critical") return "CRÍTICO";
        if (pLower === "high") return "ALTO";
        if (pLower === "medium") return "MEDIO";
        return "BAJO";
      case "fr":
        if (pLower === "critical") return "CRITIQUE";
        if (pLower === "high") return "ÉLEVÉ";
        if (pLower === "medium") return "MOYEN";
        return "FAIBLE";
      case "hi":
        if (pLower === "critical") return "गंभीर";
        if (pLower === "high") return "उच्च";
        if (pLower === "medium") return "मध्यम";
        return "निम्न";
      default:
        return priority.toUpperCase();
    }
  };

  const getLocalizedTitle = (title: string) => {
    switch (appLanguage) {
      case "es":
        if (title.includes("Lot A Near Capacity")) return "Estacionamiento A casi lleno";
        if (title.includes("Metro Line 2 Delays")) return "Retrasos en Línea 2 del Metro";
        if (title.includes("Medical Incident - Section 104")) return "Incidente médico - Sección 104";
        if (title.includes("Lost Child")) return "Niño perdido - Concourse oeste";
        if (title.includes("Medical Incident - Upper Bowl")) return "Incidente médico - Sector superior 220";
        if (title.includes("Fire Alarm Triggered")) return "Alarma de incendio - Concourse sur Nivel 2";
        if (title.includes("Metro Express Line 2 Power Failure")) return "Corte de energía en Línea 2 del Metro";
        if (title.includes("Severe Lightning Strike Warning")) return "Advertencia grave de impacto de rayos";
        if (title.includes("VIP Motorcade Transit Block")) return "Bloqueo de tránsito de caravana VIP";
        return title;
      case "fr":
        if (title.includes("Lot A Near Capacity")) return "Parking A presque plein";
        if (title.includes("Metro Line 2 Delays")) return "Retards sur la Ligne 2 du Métro";
        if (title.includes("Medical Incident - Section 104")) return "Incident médical - Section 104";
        if (title.includes("Lost Child")) return "Enfant perdu - Concourse ouest";
        if (title.includes("Medical Incident - Upper Bowl")) return "Incident médical - Secteur supérieur 220";
        if (title.includes("Fire Alarm Triggered")) return "Alarme incendie - Concourse sud Niveau 2";
        if (title.includes("Metro Express Line 2 Power Failure")) return "Panne d'électricité sur la Ligne 2 du Métro";
        if (title.includes("Severe Lightning Strike Warning")) return "Alerte foudre grave";
        if (title.includes("VIP Motorcade Transit Block")) return "Blocage du transit du cortège VIP";
        return title;
      case "hi":
        if (title.includes("Lot A Near Capacity")) return "पार्किंग लॉट ए क्षमता के करीब है";
        if (title.includes("Metro Line 2 Delays")) return "मेट्रो लाइन 2 में देरी";
        if (title.includes("Medical Incident - Section 104")) return "चिकित्सा घटना - धारा 104";
        if (title.includes("Lost Child")) return "खोया हुआ बच्चा - पश्चिमी गलियारा";
        if (title.includes("Medical Incident - Upper Bowl")) return "चिकित्सा घटना - ऊपरी बाउल सेक्टर 220";
        if (title.includes("Fire Alarm Triggered")) return "अग्नि अलार्म - दक्षिणी गलियारा स्तर 2";
        if (title.includes("Metro Express Line 2 Power Failure")) return "मेट्रो एक्सप्रेस लाइन 2 बिजली विफलता";
        if (title.includes("Severe Lightning Strike Warning")) return "गंभीर बिजली गिरने की चेतावनी";
        if (title.includes("VIP Motorcade Transit Block")) return "वीआईपी काफिला मार्ग अवरोध";
        return title;
      default:
        return title;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-fifa-gold" />
        {t.feed_title}
      </h2>

      <div className="flex-1 overflow-y-auto pr-1 space-y-6 max-h-[480px]">
        {sortedIncidents.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">{t.feed_no_items}</p>
        ) : (
          <ul className="relative border-l border-slate-800 ml-3 space-y-6">
            <AnimatePresence initial={false}>
              {sortedIncidents.map((inc) => {
                const chain = getMissionChain(inc);
                return (
                  <motion.li 
                    key={inc.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mb-6 pl-6 relative group"
                  >
                    {}
                    <span className="absolute -left-3.5 top-1.5 flex items-center justify-center bg-slate-950 border border-slate-700 rounded-full w-7 h-7 shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:border-fifa-gold transition-colors duration-200">
                      {getIncidentIcon(inc.type)}
                    </span>

                    {}
                    <div className="p-4 bg-slate-900/50 hover:bg-slate-900/70 border border-white/5 rounded-xl transition-all space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-black text-gray-100">{getLocalizedTitle(inc.title)}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{inc.timestamp}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded uppercase ${getPriorityBadgeClass(inc.priority)}`}>
                            {getLocalizedPriority(inc.priority)}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="text-[11px] space-y-2 border-t border-white/5 pt-2.5">
                        {}
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 font-bold uppercase w-16 shrink-0 text-[9px] mt-0.5">{t.feed_obs}</span>
                          <p className="text-gray-300">{chain.obs}</p>
                        </div>
                        {}
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 font-bold uppercase w-16 shrink-0 text-[9px] mt-0.5">{t.feed_reason}</span>
                          <p className="text-gray-400 italic">"{chain.reason}"</p>
                        </div>
                        {}
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold uppercase w-16 shrink-0 text-[9px] mt-0.5">{t.feed_decision}</span>
                          <p className="text-emerald-400 font-semibold">{chain.decision}</p>
                        </div>
                        {}
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold uppercase w-16 shrink-0 text-[9px] mt-0.5 text-blue-400">{t.feed_broadcast}</span>
                          <p className="text-gray-300">{chain.announcement}</p>
                        </div>
                        {}
                        <div className="flex items-start gap-2">
                          <span className="text-fifa-gold font-bold uppercase w-16 shrink-0 text-[9px] mt-0.5">{t.feed_monitoring}</span>
                          <p className="text-gray-300 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-fifa-gold animate-ping"></span>
                            {chain.monitoring}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
};
