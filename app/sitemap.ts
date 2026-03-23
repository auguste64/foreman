import { MetadataRoute } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thebuilder.io'
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: BASE_URL, lastModified: new Date() }]
}
