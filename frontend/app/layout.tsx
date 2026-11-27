import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import GlobalChatWidget from "./components/GlobalChatWidgetLoader";
import NotificationToast from "./components/NotificationToast";
import AvatarThumbnailSync from "./components/GlobalAvatarThumbnailSync";

// Self-hosted by Next at build time (was a CSS @import of Google Fonts: a render-blocking chain through two extra hosts).
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
});

// Every page calls the API right after its JavaScript runs. Opening the connection (DNS + TCP + TLS, ~3 round trips) during the
// page load instead of at the first call takes that off the critical path.
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "").origin;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  title: "AdventureBlox",
  description: "AdventureBlox - The ultimate gaming platform",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (API_ORIGIN) preconnect(API_ORIGIN, { crossOrigin: "anonymous" });
  return (
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          storageKey="adventureblox-theme"
        >
          <RealtimeProvider>
            <NotificationProvider>
              {children}
              <GlobalChatWidget />
              <AvatarThumbnailSync />
              <NotificationToast />
            </NotificationProvider>
          </RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

