import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "飲み会の傾斜割り勘・幹事アシスタント",
  description:
    "役職・遅刻・早退・飲まない人に合わせた割り勘を、わかりやすく。端数処理から集金チェック、根拠の共有まで支える幹事アシスタント。",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#245c47" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
