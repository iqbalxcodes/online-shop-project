// Google Analytics 4 (monitoring).
// Aktif hanya kalau VITE_GA_MEASUREMENT_ID (format G-XXXXXXXXXX) di-set di Vercel.
import ReactGA from "react-ga4";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
export const analyticsEnabled = Boolean(measurementId);

if (analyticsEnabled) {
    ReactGA.initialize(measurementId);
}

export function trackPageview(path) {
    if (analyticsEnabled) ReactGA.send({ hitType: "pageview", page: path });
}

export function trackEvent(name, params = {}) {
    if (analyticsEnabled) ReactGA.event(name, params);
}
