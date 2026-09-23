import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

type IconName = keyof typeof Ionicons.glyphMap;

// No category in the real system has `imageUrl` populated yet — the Category
// model supports it (prisma `imageUrl`) but no admin/vendor screen has an
// upload field for it, so it's always null today. Until that exists, this is
// the fallback: match real category slugs/names (from apps/api/src/seed) to a
// distinct, on-brand icon so categories stop looking identical, without
// inventing or hardcoding fake category records — this only decides how an
// already-real category is drawn. `getCategoryIcon` degrades gracefully for
// any category name not in this table (keyword match on the name, then a
// generic fallback), so it isn't limited to only the categories listed here.
const KEYWORD_ICONS: { keywords: string[]; icon: IconName }[] = [
  // Organic
  { keywords: ['fruit'], icon: 'nutrition' },
  { keywords: ['vegetable', 'veggie'], icon: 'leaf' },
  { keywords: ['grain', 'cereal', 'rice', 'wheat'], icon: 'basket' },
  { keywords: ['dairy', 'egg', 'milk'], icon: 'egg' },
  { keywords: ['pulse', 'lentil', 'dal'], icon: 'ellipse' },
  { keywords: ['oil', 'ghee'], icon: 'water' },
  // Natural
  { keywords: ['skincare', 'skin'], icon: 'sparkles' },
  { keywords: ['haircare', 'hair'], icon: 'cut' },
  { keywords: ['wellness', 'health', 'herb'], icon: 'flower' },
  { keywords: ['home & living', 'home-living', 'living'], icon: 'home' },
  { keywords: ['natural food', 'food'], icon: 'restaurant' },
  // Eco-friendly
  { keywords: ['kitchen'], icon: 'restaurant-outline' },
  { keywords: ['clean'], icon: 'water-outline' },
  { keywords: ['accessor'], icon: 'glasses-outline' },
  { keywords: ['cloth', 'apparel', 'wear'], icon: 'shirt' },
  { keywords: ['reusable', 'bottle', 'container'], icon: 'infinite' },
  { keywords: ['personal care'], icon: 'body' },
];

// Generic fallback for a category name that matches nothing above — still
// distinct from the "All" tile's icon (grid) so it never collides with it.
const DEFAULT_ICON: IconName = 'pricetag-outline';

export function getCategoryIcon(category: Pick<Category, 'name' | 'slug'>): IconName {
  const haystack = `${category.slug || ''} ${category.name || ''}`.toLowerCase();
  const match = KEYWORD_ICONS.find(({ keywords }) => keywords.some((k) => haystack.includes(k)));
  return match?.icon ?? DEFAULT_ICON;
}
