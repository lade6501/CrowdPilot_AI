import React from "react";
import { useCrowdPilot } from "../context/CrowdPilotContext";
import { translations } from "../utils/translations";
import { CloudSun, Navigation, Car, AlertTriangle } from "lucide-react";

export const TelemetryFeed: React.FC = () => {
  const { stadiumState, appLanguage } = useCrowdPilot();

  if (!stadiumState) return null;

  const { parking, weather } = stadiumState;
  const t = translations[appLanguage] || translations.en;

  const getParkingStatus = (occupancy: number) => {
    if (occupancy >= 90) return { label: "Full", class: "text-red-400" };
    if (occupancy >= 75) return { label: "Filling Fast", class: "text-amber-400" };
    return { label: "Spaces Available", class: "text-emerald-400" };
  };

  const translateWeatherCondition = (cond: string) => {
    const key = cond.toLowerCase().trim();
    const map: Record<string, Record<string, string>> = {
      en: {
        "cloudy": "Cloudy",
        "heavy rain warning": "Heavy Rain Warning",
        "thunderstorm": "Thunderstorm",
        "severe lightning": "Severe Lightning",
        "sunny": "Sunny",
        "rain": "Rain",
        "clear": "Clear"
      },
      es: {
        "cloudy": "Nublado",
        "heavy rain warning": "Alerta de Lluvia Fuerte",
        "thunderstorm": "Tormenta",
        "severe lightning": "Relámpagos Severos",
        "sunny": "Soleado",
        "rain": "Lluvia",
        "clear": "Despejado"
      },
      fr: {
        "cloudy": "Nuageux",
        "heavy rain warning": "Alerte Pluie Forte",
        "thunderstorm": "Orage",
        "severe lightning": "Foudre Sévère",
        "sunny": "Ensoleillé",
        "rain": "Pluie",
        "clear": "Dégagé"
      },
      hi: {
        "cloudy": "बादल",
        "heavy rain warning": "भारी बारिश की चेतावनी",
        "thunderstorm": "आंधी-तूफान",
        "severe lightning": "गंभीर बिजली",
        "sunny": "धूप",
        "rain": "बारिश",
        "clear": "साफ़ मौसम"
      }
    };
    const langMap = map[appLanguage] || map.en;
    return langMap[key] || cond;
  };

  const translateAlert = (alert: string) => {
    const key = alert.toLowerCase().trim();
    const map: Record<string, Record<string, string>> = {
      en: {
        "heavy rain expected in 12 minutes": "Heavy rain expected in 12 minutes.",
        "severe thunderstorm overhead. seek shelter inside concourses.": "Severe thunderstorm overhead. Seek shelter inside concourses.",
        "severe lightning strike hazard. keep concourse exits locked.": "Severe lightning strike hazard. Keep concourse exits locked."
      },
      es: {
        "heavy rain expected in 12 minutes": "Se espera lluvia fuerte en 12 minutos.",
        "severe thunderstorm overhead. seek shelter inside concourses.": "Tormenta eléctrica severa arriba. Busque refugio dentro de los vestíbulos.",
        "severe lightning strike hazard. keep concourse exits locked.": "Peligro severo de caída de rayos. Mantenga cerradas las salidas de los vestíbulos."
      },
      fr: {
        "heavy rain expected in 12 minutes": "Pluie forte attendue dans 12 minutes.",
        "severe thunderstorm overhead. seek shelter inside concourses.": "Orage violent au-dessus. Cherchez un abri à l'intérieur des halls.",
        "severe lightning strike hazard. keep concourse exits locked.": "Danger de foudre grave. Gardez les sorties des halls verrouillées."
      },
      hi: {
        "heavy rain expected in 12 minutes": "12 मिनट में भारी बारिश की उम्मीद है।",
        "severe thunderstorm overhead. seek shelter inside concourses.": "ऊपर गंभीर आंधी-तूफान। कंक्रीट शेल्टर के अंदर शरण लें।",
        "severe lightning strike hazard. keep concourse exits locked.": "गंभीर बिजली गिरने का खतरा। कंक्रीट निकास बंद रखें।"
      }
    };
    const langMap = map[appLanguage] || map.en;
    for (const [englishKey, translatedVal] of Object.entries(langMap)) {
      if (key.includes(englishKey)) {
        return translatedVal;
      }
    }
    return alert;
  };

  const translateParkingStatus = (status: string) => {
    const key = status.toLowerCase().trim();
    const map: Record<string, Record<string, string>> = {
      en: {
        "full": "Full",
        "filling fast": "Filling Fast",
        "spaces available": "Spaces Available"
      },
      es: {
        "full": "Lleno",
        "filling fast": "Llenándose Rápido",
        "spaces available": "Lugares Disponibles"
      },
      fr: {
        "full": "Plein",
        "filling fast": "Remplissage Rapide",
        "spaces available": "Places Disponibles"
      },
      hi: {
        "full": "पूर्ण",
        "filling fast": "तेजी से भर रहा है",
        "spaces available": "जगह उपलब्ध है"
      }
    };
    const langMap = map[appLanguage] || map.en;
    return langMap[key] || status;
  };

  const translateRouteDetail = (routeText: string) => {
    const key = routeText.toLowerCase().trim();
    const map: Record<string, Record<string, string>> = {
      en: {
        "route 1": "Route 1 (I-95 South): Normal flow.",
        "route 2": "Route 2 (Turnpike): High congestion near Stadium exit. +12 mins delay.",
        "redirect": "Redirect Turnpike commuters to take NW 27th Ave corridor."
      },
      es: {
        "route 1": "Ruta 1 (I-95 Sur): Flujo normal.",
        "route 2": "Ruta 2 (Turnpike): Alta congestión cerca de la salida del estadio. +12 min de retraso.",
        "redirect": "Redirigir a los viajeros de Turnpike para que tomen el corredor NW 27th Ave."
      },
      fr: {
        "route 1": "Route 1 (I-95 Sud): Flux normal.",
        "route 2": "Route 2 (Turnpike): Forte congestion près de la sortie du stade. +12 min de retard.",
        "redirect": "Rediriger les navetteurs de Turnpike vers le couloir NW 27th Ave."
      },
      hi: {
        "route 1": "रूट 1 (I-95 दक्षिण): सामान्य प्रवाह।",
        "route 2": "रूट 2 (टर्नपाइक): स्टेडियम निकास के पास भारी भीड़। +12 मिनट की देरी।",
        "redirect": "टर्नपाइक यात्रियों को NW 27th Ave कॉरिडोर लेने के लिए निर्देशित करें।"
      }
    };
    const langMap = map[appLanguage] || map.en;
    if (key.includes("route 1")) return langMap["route 1"];
    if (key.includes("route 2")) return langMap["route 2"];
    if (key.includes("redirect")) return langMap["redirect"];
    return routeText;
  };

  const activeActions = stadiumState.actions_queue || [];
  const isWeatherTriggered = activeActions.some(
    (act) => act.target_metric && act.target_metric === "weather.condition" && act.status === "pending"
  );
  const isParkingTriggered = activeActions.some(
    (act) => act.target_metric && (act.target_metric.includes("parking") || act.target_metric.includes("parking_surge")) && act.status === "pending"
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={`bg-slate-900/50 border rounded-xl p-4 flex flex-col justify-between transition-all duration-500 min-h-[160px] ${
        isWeatherTriggered 
          ? "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse" 
          : "border-white/5"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1">
            <CloudSun className="h-3.5 w-3.5 text-fifa-gold" /> {t.weather_feed}
          </span>
          <span className="text-[10px] text-gray-400">Miami, FL</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-extrabold text-gray-100">{weather.temp}°C</span>
            <span className="text-xs text-gray-400 block">{translateWeatherCondition(weather.condition)}</span>
          </div>
          <div className="text-right text-[10px] text-gray-400">
            <span>{t.weather_humidity}: {weather.humidity}%</span>
            <span className="block">{t.weather_wind}: {weather.wind_speed} km/h</span>
          </div>
        </div>

        {weather.alerts.length > 0 && (
          <div className="mt-3 p-2 bg-blue-950/40 border border-blue-500/20 text-[10px] text-blue-300 rounded-lg flex items-start gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>{translateAlert(weather.alerts[0])}</span>
          </div>
        )}
      </div>

      <div className={`bg-slate-900/50 border rounded-xl p-4 transition-all duration-500 min-h-[160px] ${
        isParkingTriggered 
          ? "border-fifa-gold/80 shadow-[0_0_15px_rgba(255,215,0,0.25)] animate-pulse" 
          : "border-white/5"
      }`}>
        <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1 mb-3">
          <Car className="h-3.5 w-3.5 text-fifa-gold" /> {t.parking_telemetry}
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(parking).map(([lotName, lot]) => {
            const status = getParkingStatus(lot.occupancy);
            return (
              <div key={lotName} className="p-2 bg-slate-950/40 border border-white/5 rounded-lg">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-gray-300">{lotName}</span>
                  <span className="text-gray-400 font-medium">{lot.occupancy}%</span>
                </div>
                <span className={`text-[9px] font-semibold ${status.class}`}>
                  {translateParkingStatus(status.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 min-h-[160px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5 text-fifa-gold" /> {t.directions_status}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded uppercase font-bold">{t.directions_delay}</span>
        </div>

        <div className="space-y-1 text-xs text-gray-300">
          <p>
            {translateRouteDetail("Route 1 (I-95 South): Normal flow.")}
          </p>
          <p>
            {translateRouteDetail("Route 2 (Turnpike): High congestion near Stadium exit. +12 mins delay.")}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            <strong className="text-fifa-gold">{t.directions_suggestion}:</strong> {translateRouteDetail("Redirect")}
          </p>
        </div>
      </div>
    </div>
  );
};
