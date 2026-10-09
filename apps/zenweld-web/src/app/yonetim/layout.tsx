import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "../globals.css";

import { Providers } from "./providers";

/**
 * Panel arama motorlarina her zaman kapali (site acik olsa bile): bu meta
 * etiketi ve next.config icindeki X-Robots-Tag basligi.
 */
export const metadata: Metadata = {
  title: { default: "Zenweld Yönetim Paneli", template: "%s | Zenweld Yönetim" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#141619",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-zw-grey-50 text-zw-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
