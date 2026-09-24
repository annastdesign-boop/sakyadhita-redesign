/**
 * Blog categories. Imported Blogger labels are messy (116 distinct, many
 * near-duplicates), so posts are mapped onto a small fixed set here, with
 * title keywords as a fallback. Used by the listing filters, the search
 * index (/blog/index.json) and the chips on each post.
 */
export const CATEGORIES = [
  { id: 'conferences', label: 'Conferences' },
  { id: 'ordination', label: 'Ordination' },
  { id: 'monastic', label: 'Nuns & Monastic Life' },
  { id: 'history', label: 'History' },
  { id: 'interviews', label: 'Interviews & Profiles' },
  { id: 'practice', label: 'Practice & Meditation' },
  { id: 'gender', label: 'Gender & Society' },
  { id: 'arts', label: 'Arts & Culture' },
  { id: 'news', label: 'News & Announcements' },
  { id: 'stories', label: 'Stories & Reflections' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

const LABEL_MAP: Record<string, CategoryId> = {
  'sakyadhita conferences': 'conferences', '15th si con': 'conferences', workshop: 'conferences', panel: 'conferences', 'hong kong': 'conferences',
  'bhikkhuni ordination': 'ordination', bhikkhunis: 'ordination', bhiksunis: 'ordination', 'female buddhist ordinates': 'ordination',
  'bhikkhuni sangha': 'ordination', 'female buddhist monks': 'ordination',
  'buddhist nuns': 'monastic', 'female buddhist monastics': 'monastic', 'himalayan nun': 'monastic', 'male buddhist monastics': 'monastic',
  'history of women in buddhism': 'history', 'buddhist queens': 'history', borobudur: 'history',
  'interviewing buddhist women': 'interviews', 'human interest': 'interviews',
  'daily buddhist practice': 'practice', meditation: 'practice', mindfulness: 'practice', 'letting go of suffering': 'practice',
  awareness: 'practice', zen: 'practice', compassion: 'practice', 'tibetan buddhism': 'practice',
  'gender in buddhism': 'gender', 'women in buddhism': 'gender', 'women in leadership': 'gender',
  'buddhist arts': 'arts', art: 'arts', batik: 'arts', 'buddhist book': 'arts',
  announcements: 'news',
}

const TITLE_RULES: [RegExp, CategoryId][] = [
  [/conference/i, 'conferences'],
  [/ordination|bhikkhun|bhiksun|geshema/i, 'ordination'],
  [/interview|conversation with|in conversation/i, 'interviews'],
  [/history/i, 'history'],
  [/meditat|mindful|practice/i, 'practice'],
  [/announcement|registration|call for papers|reminder/i, 'news'],
]

export function categoriesFor(post: { title: string; labels?: string[] }): CategoryId[] {
  const found = new Set<CategoryId>()
  for (const l of post.labels || []) {
    const id = LABEL_MAP[l.trim().toLowerCase()]
    if (id) found.add(id)
  }
  for (const [re, id] of TITLE_RULES) if (re.test(post.title)) found.add(id)
  if (!found.size) found.add('stories')
  return CATEGORIES.map((c) => c.id).filter((id) => found.has(id))
}

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id
