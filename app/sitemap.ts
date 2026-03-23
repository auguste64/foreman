import { MetadataRoute } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thebuilder.io'
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date('2026-03-23') },
    { url: `${BASE_URL}/mentions-legales`, lastModified: new Date('2026-03-23') },
    { url: `${BASE_URL}/confidentialite`, lastModified: new Date('2026-03-23') },
    { url: `${BASE_URL}/cgu`, lastModified: new Date('2026-03-23') },
  ]
}
