import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XXXo The Game",
    short_name: "XXXo",
    description:
      "Strategic 5×5 tic-tac-toe variant. Make 4 or 5 in a row to score points.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D1117",
    theme_color: "#0D1117",
    categories: ["games", "entertainment"],
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
