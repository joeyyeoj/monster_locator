import type { MetadataRoute } from "next";
import { getIndexableLocations } from "@/lib/services/locationService";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const locations = await getIndexableLocations();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    }
  ];

  const locationRoutes: MetadataRoute.Sitemap = locations.map((location) => ({
    url: `${siteUrl}/location/${location.id}`,
    lastModified: new Date(location.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticRoutes, ...locationRoutes];
}
