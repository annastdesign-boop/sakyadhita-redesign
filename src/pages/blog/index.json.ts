import type { APIRoute } from 'astro'
import { categoriesFor } from '../../lib/blogCategories'

/** Lightweight search index for the blog filters (built statically). */
export const GET: APIRoute = () => {
  const modules = import.meta.glob('../../content/blog/*.json', { eager: true })
  const posts = Object.values(modules)
    .map((m: any) => m.default)
    .sort((a: any, b: any) => b.published.localeCompare(a.published))
  const index = posts.map((p: any) => ({
    slug: p.slug,
    title: p.title,
    excerpt: (p.excerpt || '').slice(0, 180),
    date: p.published,
    thumb: p.thumb || null,
    minutes: p.minutes,
    cats: categoriesFor(p),
  }))
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } })
}
