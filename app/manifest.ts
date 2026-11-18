import type { MetadataRoute } from "next";

// Minimal web app manifest so the home-screen icon opens full screen
// ("standalone"), as in Spine. Not a PWA: no service worker, no offline mode.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulse",
    short_name: "Pulse",
    description: "Pulse: workouts, body, nutrition and progress in one app",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eeeeee",
    theme_color: "#eeeeee",
    icons: [
      { src: "/icon-192.png?v=1", sizes: "192x192", type: "image/png" },
      { src: "/apple-touch-icon.png?v=1", sizes: "180x180", type: "image/png" },
    ],
  };
}
