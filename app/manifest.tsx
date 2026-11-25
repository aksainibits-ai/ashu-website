import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/en/",
    name: "Advocate Ashutosh Saini",
    short_name: "Ashutosh Saini",
    description: "Professional profile and general legal information",
    lang: "en-IN",
    dir: "ltr",
    start_url: "/en/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#080d18",
    theme_color: "#080d18",
    prefer_related_applications: false,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ],
    shortcuts: [
      {
        name: "Contact",
        url: "/en/contact",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
