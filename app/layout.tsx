import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

// Poppins: Spine's app font (geometric sans). Self-hosted by next/font at build.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Pulse", template: "%s · Pulse" },
  description: "Pulse: workouts, body, nutrition and progress in one app",
  // Not public yet: keep search engines out until go-live.
  robots: { index: false, follow: false },
  // Opened from the iPhone home screen icon: full screen, no Safari bars, and
  // "Pulse" under the icon. Not a PWA: no service worker, no offline mode
  // (see app/manifest.ts).
  appleWebApp: { title: "Pulse", capable: true, statusBarStyle: "default" },
  // Next writes only the newer "mobile-web-app-capable"; older iOS reads this one.
  other: { "apple-mobile-web-app-capable": "yes" },
  // Static files in public/ (iOS ignores generated icon URLs without a file
  // extension). To change the logo, replace these five files:
  // favicon.ico, icon-32.png, icon-192.png (white rounded square, transparent
  // corners), apple-touch-icon.png and apple-touch-icon-precomposed.png
  // (180x180, square and opaque: iOS rounds it). "?v=" makes browsers fetch
  // them again after a change: bump it with the files.
  icons: {
    icon: [
      { url: "/icon-32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  // Draw under the notch / home bar; globals.css pads with the safe areas.
  viewportFit: "cover",
  // Same as the page background (--sp-bg).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eeeeee" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
