import { MetadataRoute } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thebuilder.io'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/artisan/', '/login', '/api/'] },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
