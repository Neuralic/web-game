import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import GlobalChatWidget from "./components/GlobalChatWidget";
import NotificationToast from "./components/NotificationToast";
import BackgroundMusic from "./components/BackgroundMusic";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="adventureblox-theme"
        >
          <RealtimeProvider>
            <NotificationProvider>
              {children}
              <GlobalChatWidget />
              <NotificationToast />
	      <BackgroundMusic />
            </NotificationProvider>
          </RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

