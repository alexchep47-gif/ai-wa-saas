import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NCAM AI",
    short_name: "NCAM AI",
    description: "Le centre de pilotage des agents IA et WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b1c",
    theme_color: "#17124a",
    lang: "fr",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
