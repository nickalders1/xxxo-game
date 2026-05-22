import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XXXo The Game",
    short_name: "XXXo",
    description:
      "Strategische 5×5 tic-tac-toe variant. Maak 4 of 5 op een rij om punten te scoren.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D1117",
    theme_color: "#0D1117",
    categories: ["games", "entertainment"],
    lang: "nl",
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
