import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/team`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/members`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
