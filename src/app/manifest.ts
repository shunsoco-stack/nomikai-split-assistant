import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "飲み会の傾斜割り勘・幹事アシスタント",
    short_name: "幹事ノート",
    description: "納得できる割り勘と、気持ちのいい集金を。",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#245c47",
    lang: "ja",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
