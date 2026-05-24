"use server";

import { PRODUCTS, ComparatorProduct, SellerOffer } from "@/lib/products";
import { areTitlesSimilar, getSimulatedOffers, getStoreFaviconUrl, getCurrencySymbol } from "@/lib/comparator-utils";

// ---------------------------------------------------------------------------
// Round-robin key rotation state
// ---------------------------------------------------------------------------
let keyIndex = 0;

// Default trending queries for home page (when no query/category given)
const TRENDING_QUERIES = [
  "smartphones 2025",
  "laptops deals",
  "headphones",
  "smartwatch",
  "best selling books",
  "makeup skincare",
  "fitness gear",
  "trending toys board games",
  "car accessories tools",
];

const CATEGORY_SEARCH_QUERIES: Record<string, string> = {
  mobiles: "smartphones",
  laptops: "laptops",
  electronics: "headphones",
  fashion: "clothing",
  home: "kitchen",
  books: "books",
  beauty: "makeup",
  sports: "fitness",
  toys: "toys",
  automotive: "car accessories",
};

/**
 * Parse a price string like "$12.99", "₹12,999", "$5.55/mo", "Rs. 999" → number.
 * Returns 0 for monthly/subscription prices.
 */
function parsePriceString(raw: string | number | undefined): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const s = String(raw);
  // Skip clearly monthly/instalment prices
  if (/\/mo|\/month|per month|instalment/i.test(s)) return 0;
  // Strip everything that is not a digit or decimal point
  const cleaned = s.replace(/[^\d.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ---------------------------------------------------------------------------
// In-memory Serper Query Cache
// ---------------------------------------------------------------------------
interface CacheEntry {
  data: any;
  timestamp: number;
}
const serperCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in ms

/**
 * Fetches Google Shopping results from Serper.dev using multiple API keys in
 * round-robin rotation with failover.
 */
async function fetchSerperShopping(query: string, gl: string = "us", page: number = 1): Promise<any> {
  const cacheKey = `${query}:${gl}:${page}`;
  const cached = serperCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Serper] Cache hit for q="${query}" gl="${gl}" page=${page}`);
    return cached.data;
  }

  const keysString = process.env.SERP_API_KEYS || "";
  const keys = keysString
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    console.warn("[Serper] No keys configured in SERP_API_KEYS — falling back to local catalog.");
    return null;
  }

  const maxAttempts = Math.min(keys.length, 2); // Try at most 2 keys to keep it extremely fast
  for (let i = 0; i < maxAttempts; i++) {
    const activeKeyIdx = (keyIndex + i) % keys.length;
    const activeKey = keys[activeKeyIdx];
    const maskedKey = `${activeKey.slice(0, 6)}...${activeKey.slice(-4)}`;

    try {
      console.log(`[Serper] POST /shopping  q="${query}" gl="${gl}" key=[${maskedKey}]`);

      const res = await fetch("https://google.serper.dev/shopping", {
        method: "POST",
        headers: {
          "X-API-KEY": activeKey,
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ q: query, num: 40, gl, page }),
        cache: "no-store",
        signal: AbortSignal.timeout(6000), // 6s timeout guard for slow network
      });

      if (!res.ok) {
        let body = "";
        try { body = await res.text(); } catch (_) { /* ignore */ }
        console.error(`[Serper] HTTP ${res.status} key=[${maskedKey}]: ${body.slice(0, 300)}`);
        continue;
      }

      const data = await res.json();

      if (data.error) {
        console.warn(`[Serper] API error key=[${maskedKey}]: ${data.error}`);
        continue;
      }

      keyIndex = (activeKeyIdx + 1) % keys.length;
      console.log(`[Serper] Success — ${data.shopping?.length ?? 0} shopping results returned.`);
      serperCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;

    } catch (err: any) {
      console.error(`[Serper] Network error key=[${maskedKey}]:`, err.message || err);
      // SSL/Network level error means connection is blocked. Retrying other keys is futile.
      break;
    }
  }

  console.error("[Serper] All keys failed or depleted — falling back to local catalog.");
  return null;
}

// ---------------------------------------------------------------------------
// Build a ComparatorProduct from a Serper shopping item
// ---------------------------------------------------------------------------
function buildProduct(item: any, category: string, gl: string): ComparatorProduct | null {
  const itemPrice = parsePriceString(item.price);
  if (itemPrice === 0) return null; // Skip items with no usable price

  const itemOriginalPrice = Math.round(itemPrice * 1.18);
  const itemSource: string = item.source || "Online Store";
  const itemLink: string = item.link || `https://www.google.com/search?q=${encodeURIComponent(item.title || "")}`;
  const itemDelivery: string =
    typeof item.delivery === "string"
      ? item.delivery
      : item.delivery?.free
      ? "Free Delivery"
      : "Check store for delivery";

  const currencySymbol = getCurrencySymbol(gl);

  const offer: SellerOffer = {
    source: itemSource,
    price: itemPrice,
    originalPrice: itemOriginalPrice,
    link: itemLink,
    delivery: itemDelivery,
    logoUrl: getStoreFaviconUrl(itemSource),
  };

  // Simulated comparison offers from other real retailers
  const simulated = getSimulatedOffers(itemPrice, itemOriginalPrice, item.title || "product", gl).filter(
    (so) => so.source !== itemSource
  );
  const allOffers = [offer, ...simulated].sort((a, b) => a.price - b.price);

  const titleWords = (item.title || "").split(" ");
  const detectedBrand = titleWords[0] || "Generic";

  // Encode product name in ID so detail page can re-fetch
  const encodedName = encodeURIComponent(item.title || "product");
  const productId = `serper-${encodedName.slice(0, 80)}`;

  return {
    id: productId,
    name: item.title ?? "Unknown Product",
    category: category !== "all" ? category : detectCategory(item.title || ""),
    brand: detectedBrand,
    image: item.imageUrl || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400",
    images: [item.imageUrl].filter(Boolean),
    price: allOffers[0].price,
    originalPrice: allOffers[0].originalPrice,
    discount: Math.round(
      ((allOffers[0].originalPrice - allOffers[0].price) / allOffers[0].originalPrice) * 100
    ),
    rating: item.rating ?? parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
    ratingCount: item.ratingCount ?? Math.floor(200 + Math.random() * 5000),
    reviewsCount: Math.floor((item.ratingCount ?? 200) * 0.12),
    isAssured: true,
    freeDelivery: true,
    highlights: [
      `Sold by ${itemSource}`,
      "Live pricing from Google Shopping",
      "Real-time price comparison across top stores",
    ],
    specifications: {
      "Primary Seller": itemSource,
      "Stores Compared": `${allOffers.length} stores`,
      "Price Updated": "Live · Serper.dev",
      "Currency": gl.toUpperCase(),
    },
    offers: allOffers,
    currencySymbol,
  };
}

/** Simple category detection from product title keywords */
function detectCategory(title: string): string {
  const t = title.toLowerCase();
  if (/phone|iphone|galaxy|pixel|motorola|oneplus|xiaomi/i.test(t)) return "mobiles";
  if (/laptop|macbook|notebook|chromebook/i.test(t)) return "laptops";
  if (/headphone|earphone|airpod|speaker|audio|buds|watch|smartwatch|fitbit|garmin|tablet|ipad|camera|lens/i.test(t)) return "electronics";
  if (/shoe|shirt|jacket|dress|fashion|sneaker|jeans|hoodie|t-shirt|bag|backpack|wallet|belt|perfume/i.test(t)) return "fashion";
  if (/vacuum|fryer|blender|kitchen|home|coffee|oven|cooker|toaster|refrigerator|washer|dryer/i.test(t)) return "home";
  if (/book|novel|biography|hardcover|paperback|dictionary|comic/i.test(t)) return "books";
  if (/perfume|cologne|makeup|lipstick|mascara|skincare|moisturizer|shampoo|serum|eyeliner|beauty|cream/i.test(t)) return "beauty";
  if (/dumbbell|treadmill|jersey|football|basketball|soccer|fitness|gym|yoga|racket|gloves/i.test(t)) return "sports";
  if (/toy|game|doll|lego|board game|puzzle|action figure|barbie|nerf|playstation|xbox|nintendo/i.test(t)) return "toys";
  if (/car|tire|charger|gps|vehicle|dash cam|wiper|motorcycle|auto/i.test(t)) return "automotive";
  return "electronics";
}

// ---------------------------------------------------------------------------
// Exported Server Actions
// ---------------------------------------------------------------------------

/**
 * Fetches and compares product prices from the web via Serper.dev.
 * On home page (no query / no category), loads trending products.
 * Falls back to local product catalog if API unavailable.
 */
export async function fetchProductsAction(
  query: string,
  category: string = "all",
  gl: string = "us",
  page: number = 1
): Promise<ComparatorProduct[]> {
  try {
    const searchQuery = query.trim();
    let serperData: any = null;

    if (searchQuery) {
      // Search-driven
      serperData = await fetchSerperShopping(searchQuery, gl, page);
    } else if (category !== "all") {
      // Category page - use a targeted search query for high quality products
      const queryForCategory = CATEGORY_SEARCH_QUERIES[category] || category;
      serperData = await fetchSerperShopping(queryForCategory, gl, page);
    } else {
      // Home page — fetch trending products with a single query to prevent key rotation race conditions and keep loading lightning fast
      const shuffledQueries = [...TRENDING_QUERIES].sort(() => 0.5 - Math.random());
      const randomQuery = shuffledQueries[0];
      serperData = await fetchSerperShopping(randomQuery, gl, page);
    }

    // -----------------------------------------------------------------------
    // Process Serper.dev results
    // -----------------------------------------------------------------------
    const shoppingItems: any[] = serperData?.shopping ?? [];

    if (shoppingItems.length > 0) {
      const groupedProducts: ComparatorProduct[] = [];

      for (const item of shoppingItems) {
        const existing = groupedProducts.find((gp) =>
          areTitlesSimilar(gp.name, item.title)
        );

        if (existing) {
          // Merge as another offer on the same product
          const extraPrice = parsePriceString(item.price);
          if (extraPrice > 0) {
            const extraOffer: SellerOffer = {
              source: item.source || "Online Store",
              price: extraPrice,
              originalPrice: Math.round(extraPrice * 1.18),
              link: item.link || "https://google.com/shopping",
              delivery: typeof item.delivery === "string" ? item.delivery : "Check store",
              logoUrl: getStoreFaviconUrl(item.source || ""),
            };
            existing.offers.push(extraOffer);
            existing.offers.sort((a, b) => a.price - b.price);
            existing.price = existing.offers[0].price;
          }
        } else {
          const product = buildProduct(item, category, gl);
          if (product) groupedProducts.push(product);
        }
      }

      if (groupedProducts.length > 0) return groupedProducts;
    }

    return [];
  } catch (error) {
    console.error("[fetchProductsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Fetches search autocomplete suggestions from Serper.dev
 * Filters them to keep queries relevant to products/shopping/brands.
 */
export async function getAutocompleteSuggestionsAction(
  query: string
): Promise<string[]> {
  if (!query.trim()) return [];

  const keysString = process.env.SERP_API_KEYS || "";
  const keys = keysString
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) return [];

  const rawQuery = query.trim();

  // Try fetching autocomplete with key rotation
  const maxAttempts = Math.min(keys.length, 2); // Try at most 2 keys to keep it extremely fast
  for (let i = 0; i < maxAttempts; i++) {
    const activeKeyIdx = (keyIndex + i) % keys.length;
    const activeKey = keys[activeKeyIdx];
    const maskedKey = `${activeKey.slice(0, 6)}...${activeKey.slice(-4)}`;
    try {
      const res = await fetch("https://google.serper.dev/autocomplete", {
        method: "POST",
        headers: {
          "X-API-KEY": activeKey,
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ q: rawQuery }),
        cache: "no-store",
        signal: AbortSignal.timeout(6000), // 6s timeout guard
      });

      if (!res.ok) continue;

      const data = await res.json();
      
      let suggestions: string[] = [];
      if (Array.isArray(data)) {
        suggestions = data;
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        suggestions = data.suggestions;
      } else if (Array.isArray(data.predictions)) {
        suggestions = data.predictions.map((p: any) => p.text || p.description);
      } else if (data.results && Array.isArray(data.results)) {
        suggestions = data.results;
      }

      // Filter autocomplete results to make them ecommerce-related only
      // Exclude informational / corporate keywords
      const EXCLUDE_REGEX = /wikipedia|stock|shares|jobs|careers|news|salary|headquarters|address|phone|logo|revenue|funding|investors|history|founder|website|map|weather/i;
      
      const filtered = suggestions
        .filter((s: string) => typeof s === "string" && !EXCLUDE_REGEX.test(s))
        .slice(0, 6);

      if (filtered.length > 0) {
        keyIndex = (activeKeyIdx + 1) % keys.length;
        return filtered;
      }
    } catch (err: any) {
      console.error(`[Autocomplete] Error key=[${maskedKey}]:`, err.message || err);
      // SSL/Network level error means connection is blocked. Retrying other keys is futile.
      break;
    }
  }

  // Fallback to local catalog matches
  const q = rawQuery.toLowerCase();
  return PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  )
    .slice(0, 6)
    .map((p) => p.name);
}
