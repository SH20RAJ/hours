import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "Hours — See your life in hours",
    template: "%s · Hours",
  },
  description:
    "A real-time mirror of how your hours shape your identity. Track time, build the person you want to become.",
  applicationName: "Hours",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hours",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Apply persisted theme before paint to avoid a flash of the wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hours-theme');var d=t?JSON.parse(t):'dark';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=d==='system'?(m?'dark':'light'):d;document.documentElement.classList.toggle('dark',r!=='light');document.documentElement.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
