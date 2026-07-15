import { Category, DeliveryAssignment, Product, ProductStatus, StoreType } from '../types';

// Local fallback content — used only when the real API returns nothing (no
// backend/DB wired up yet, per STATUS.md). Lets every screen that calls
// customerApi.getProducts/getCategories render real-looking cards across all
// 3 storefronts without needing a live database. No product photos exist for
// these, so `images` stays empty — ProductCard already renders a graceful
// accent-tinted leaf placeholder when a product has no image.

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${(idCounter += 1)}`;

function makeCategory(name: string, storeType: StoreType): Category {
  return {
    id: nextId('demo-cat'),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    storeType,
    isActive: true,
  };
}

function makeProduct(
  storeType: StoreType,
  category: Category,
  name: string,
  unit: string,
  price: number,
  compareAtPrice: number | undefined,
  rating: number,
): Product {
  return {
    id: nextId('demo-prod'),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: `${name} — a Next360 ${category.name.toLowerCase()} favorite.`,
    price,
    compareAtPrice,
    images: [],
    unit,
    stock: 24,
    status: ProductStatus.ACTIVE,
    storeType,
    categoryId: category.id,
    category,
    vendorId: 'demo-vendor',
    vendor: { id: 'demo-vendor', storeName: 'Next360 Farms' },
    rating,
    reviewCount: Math.round(rating * 18),
    createdAt: new Date().toISOString(),
  };
}

const organicGrains = makeCategory('Grains & Cereals', StoreType.ORGANIC);
const organicProduce = makeCategory('Fresh Produce', StoreType.ORGANIC);
const organicDairy = makeCategory('Dairy & Eggs', StoreType.ORGANIC);
const organicPantry = makeCategory('Pantry', StoreType.ORGANIC);

const naturalPersonalCare = makeCategory('Personal Care', StoreType.NATURAL);
const naturalHome = makeCategory('Home & Living', StoreType.NATURAL);
const naturalWellness = makeCategory('Wellness', StoreType.NATURAL);

const ecoKitchen = makeCategory('Kitchen', StoreType.ECO_FRIENDLY);
const ecoCleaning = makeCategory('Cleaning', StoreType.ECO_FRIENDLY);
const ecoLifestyle = makeCategory('Lifestyle', StoreType.ECO_FRIENDLY);

export const DEMO_CATEGORIES: Record<StoreType, Category[]> = {
  [StoreType.ORGANIC]: [organicGrains, organicProduce, organicDairy, organicPantry],
  [StoreType.NATURAL]: [naturalPersonalCare, naturalHome, naturalWellness],
  [StoreType.ECO_FRIENDLY]: [ecoKitchen, ecoCleaning, ecoLifestyle],
};

export const DEMO_PRODUCTS: Record<StoreType, Product[]> = {
  [StoreType.ORGANIC]: [
    makeProduct(StoreType.ORGANIC, organicGrains, 'Organic Basmati Rice', '1 kg', 149, 189, 4.6),
    makeProduct(StoreType.ORGANIC, organicGrains, 'Whole Wheat Atta', '5 kg', 259, undefined, 4.4),
    makeProduct(StoreType.ORGANIC, organicGrains, 'Finger Millet (Ragi) Flour', '500 g', 89, 109, 4.3),
    makeProduct(StoreType.ORGANIC, organicProduce, 'Farm Fresh Spinach', '250 g', 35, undefined, 4.5),
    makeProduct(StoreType.ORGANIC, organicProduce, 'Heirloom Tomatoes', '500 g', 65, 79, 4.7),
    makeProduct(StoreType.ORGANIC, organicProduce, 'Rainbow Carrots', 'Bunch of 6', 45, undefined, 4.2),
    makeProduct(StoreType.ORGANIC, organicDairy, 'A2 Cow Ghee', '500 ml', 649, 749, 4.8),
    makeProduct(StoreType.ORGANIC, organicDairy, 'Farm Fresh Paneer', '200 g', 99, undefined, 4.5),
    makeProduct(StoreType.ORGANIC, organicPantry, 'Cold-Pressed Coconut Oil', '500 ml', 279, 320, 4.6),
    makeProduct(StoreType.ORGANIC, organicPantry, 'Raw Forest Honey', '350 g', 249, undefined, 4.7),
  ],
  [StoreType.NATURAL]: [
    makeProduct(StoreType.NATURAL, naturalPersonalCare, 'Neem & Tulsi Soap Bar', '100 g', 89, 110, 4.4),
    makeProduct(StoreType.NATURAL, naturalPersonalCare, 'Herbal Shikakai Shampoo', '200 ml', 199, undefined, 4.3),
    makeProduct(StoreType.NATURAL, naturalPersonalCare, 'Sandalwood Face Pack', '100 g', 149, 179, 4.5),
    makeProduct(StoreType.NATURAL, naturalHome, 'Handwoven Cotton Towel', 'Set of 2', 399, undefined, 4.6),
    makeProduct(StoreType.NATURAL, naturalHome, 'Clay Water Pot', '5 L', 549, 649, 4.2),
    makeProduct(StoreType.NATURAL, naturalWellness, 'Ashwagandha Capsules', '60 caps', 349, undefined, 4.7),
    makeProduct(StoreType.NATURAL, naturalWellness, 'Herbal Immunity Tea', '100 g', 179, 210, 4.4),
    makeProduct(StoreType.NATURAL, naturalWellness, 'Cold-Pressed Almond Oil', '200 ml', 299, undefined, 4.5),
  ],
  [StoreType.ECO_FRIENDLY]: [
    makeProduct(StoreType.ECO_FRIENDLY, ecoKitchen, 'Bamboo Cutlery Set', 'Set of 4', 249, 299, 4.5),
    makeProduct(StoreType.ECO_FRIENDLY, ecoKitchen, 'Reusable Beeswax Wraps', 'Pack of 3', 399, undefined, 4.3),
    makeProduct(StoreType.ECO_FRIENDLY, ecoKitchen, 'Coconut Coir Scrub Pads', 'Pack of 5', 149, 179, 4.4),
    makeProduct(StoreType.ECO_FRIENDLY, ecoCleaning, 'Plant-Based Dish Wash', '500 ml', 179, undefined, 4.6),
    makeProduct(StoreType.ECO_FRIENDLY, ecoCleaning, 'Compostable Trash Bags', 'Pack of 30', 219, 249, 4.2),
    makeProduct(StoreType.ECO_FRIENDLY, ecoLifestyle, 'Organic Cotton Tote Bag', '1 pc', 199, undefined, 4.7),
    makeProduct(StoreType.ECO_FRIENDLY, ecoLifestyle, 'Steel Straw Set', 'Set of 4', 149, 189, 4.5),
  ],
};

interface DemoProductParams {
  storeType?: StoreType | string;
  categoryId?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export function filterDemoProducts(params: DemoProductParams = {}): Product[] {
  const storeType = params.storeType as StoreType | undefined;
  const pool = storeType && DEMO_PRODUCTS[storeType]
    ? DEMO_PRODUCTS[storeType]
    : Object.values(DEMO_PRODUCTS).flat();

  let results = pool;
  if (params.categoryId) {
    results = results.filter((p) => p.categoryId === params.categoryId);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(q));
  }

  // Demo data isn't paginated — only page 1 returns results, later pages are
  // empty so screens' "load more" logic stops instead of looping forever.
  if (params.page && params.page > 1) return [];

  return params.limit ? results.slice(0, params.limit) : results;
}

export function getDemoCategories(storeType?: StoreType | string): Category[] {
  return storeType && DEMO_CATEGORIES[storeType as StoreType]
    ? DEMO_CATEGORIES[storeType as StoreType]
    : Object.values(DEMO_CATEGORIES).flat();
}

export function findDemoProduct(id: string): Product | undefined {
  return Object.values(DEMO_PRODUCTS).flat().find((p) => p.id === id);
}

// Simulates a rider moving from a fixed pickup point toward a fixed delivery
// point over a few minutes — only used when there's no live backend/Supabase
// project connected, so the tracking screen (map + status timeline) is
// visually verifiable without one. Position is derived purely from elapsed
// time since the order was placed, not persisted anywhere.
const DEMO_ORIGIN = { lat: 17.4239, lng: 78.4738 }; // Hyderabad — vendor pickup area
const DEMO_DESTINATION = { lat: 17.4483, lng: 78.3915 }; // Hyderabad — delivery area
const DEMO_TRIP_MS = 6 * 60 * 1000;

export function getDemoDeliveryAssignment(orderId: string, orderCreatedAt: string): DeliveryAssignment {
  const startedAt = new Date(orderCreatedAt).getTime();
  const elapsed = Date.now() - startedAt;
  const progress = Math.min(1, Math.max(0, elapsed / DEMO_TRIP_MS));
  const lat = DEMO_ORIGIN.lat + (DEMO_DESTINATION.lat - DEMO_ORIGIN.lat) * progress;
  const lng = DEMO_ORIGIN.lng + (DEMO_DESTINATION.lng - DEMO_ORIGIN.lng) * progress;
  const pickedUp = progress > 0.15;
  const delivered = progress >= 1;

  return {
    id: `demo-assignment-${orderId}`,
    orderId,
    deliveryPartnerId: 'demo-partner-1',
    deliveryPartner: {
      id: 'demo-partner-1',
      name: 'Ravi Kumar',
      phone: '+919876543210',
      currentLat: lat,
      currentLng: lng,
      vehicleType: 'Bike',
      rating: 4.8,
    },
    otp: '4821',
    status: delivered ? 'DELIVERED' : pickedUp ? 'OUT_FOR_DELIVERY' : 'ASSIGNED',
    pickedUpAt: pickedUp ? new Date(startedAt + DEMO_TRIP_MS * 0.15).toISOString() : undefined,
    deliveredAt: delivered ? new Date(startedAt + DEMO_TRIP_MS).toISOString() : undefined,
  };
}
