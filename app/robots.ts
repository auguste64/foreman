import { MetadataRoute } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thebuilder.io'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard/', '/artisan/', '/login', '/api/'] }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
