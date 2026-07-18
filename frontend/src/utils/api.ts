interface WindowWithProcess extends Window {
  process?: {
    env?: {
      BASE_URL?: string;
    };
  };
}

export const getBaseUrl = () => {
  const browserBaseUrl = (window as WindowWithProcess).process?.env?.BASE_URL;
  const envUrl = import.meta.env.VITE_API_URL || browserBaseUrl || "http://localhost:8000";
  return envUrl.replace(/\/$/, "");
};

export const getWsUrl = () => {
  const baseUrl = getBaseUrl();
  if (baseUrl.startsWith("https://")) {
    return baseUrl.replace("https://", "wss://");
  }
  if (baseUrl.startsWith("http://")) {
    return baseUrl.replace("http://", "ws://");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
};
