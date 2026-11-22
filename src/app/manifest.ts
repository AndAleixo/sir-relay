import type { MetadataRoute } from "next";

/** Installable web app shell (P3-14). Icons from brand mark (SVG). No SW / push yet. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SRelay",
    short_name: "SRelay",
    description:
      "Organize work alone or with any team. Assign tasks, follow what's left — without productivity theater.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F5F5F5",
    theme_color: "#EAB308",
    icons: [
      {
        src: "/brand/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
