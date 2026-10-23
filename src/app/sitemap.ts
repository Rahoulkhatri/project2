import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kestrel.dev";
const ROUTES = ["", "/platform", "/pricing", "/regions", "/docs", "/company", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({ url: SITE_URL + r, lastModified: new Date(), changeFrequency: "monthly", priority: r === "" ? 1 : 0.7 }));
}
