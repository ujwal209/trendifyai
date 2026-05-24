import { SellerOffer } from "./products";

/**
 * Normalizes a text string for similarity comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if two product titles are highly similar (≥50% significant word overlap)
 */
export function areTitlesSimilar(t1: string, t2: string): boolean {
  const n1 = normalizeTitle(t1);
  const n2 = normalizeTitle(t2);
  const words1 = n1.split(" ");
  const words2 = n2.split(" ");

  const intersection = words1.filter((w) => words2.includes(w) && w.length > 2);
  const minLength = Math.min(words1.length, words2.length);

  if (minLength === 0) return false;
  return intersection.length / minLength >= 0.5;
}

export interface SimulatedSource {
  name: string;
  offset: number;
  delivery: string;
  logoUrl: string;
}

const REGIONAL_SOURCES: Record<string, SimulatedSource[]> = {
  in: [
    { name: "Flipkart", offset: 0, delivery: "Free delivery tomorrow", logoUrl: "https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/favicon-60f9e7.ico" },
    { name: "Amazon India", offset: 0.012, delivery: "Free delivery with Prime", logoUrl: "https://www.amazon.in/favicon.ico" },
    { name: "Croma", offset: -0.008, delivery: "Store pickup in 2 hours", logoUrl: "https://www.croma.com/favicon.ico" },
    { name: "Reliance Digital", offset: 0.018, delivery: "Free delivery in 3 days", logoUrl: "https://www.reliancedigital.in/favicon.ico" }
  ],
  uk: [
    { name: "Amazon UK", offset: 0, delivery: "Free Prime delivery tomorrow", logoUrl: "https://www.amazon.co.uk/favicon.ico" },
    { name: "Currys", offset: 0.015, delivery: "Store pickup in 1 hour", logoUrl: "https://www.currys.co.uk/favicon.ico" },
    { name: "Argos", offset: -0.005, delivery: "Same day home delivery", logoUrl: "https://www.argos.co.uk/favicon.ico" },
    { name: "John Lewis", offset: 0.025, delivery: "Free standard delivery", logoUrl: "https://www.johnlewis.com/favicon.ico" }
  ],
  ca: [
    { name: "Amazon Canada", offset: 0, delivery: "Free Prime delivery", logoUrl: "https://www.amazon.ca/favicon.ico" },
    { name: "Walmart Canada", offset: 0.01, delivery: "Free shipping over $35", logoUrl: "https://www.walmart.ca/favicon.ico" },
    { name: "Best Buy Canada", offset: -0.008, delivery: "Free store pickup", logoUrl: "https://www.bestbuy.ca/favicon.ico" },
    { name: "Canadian Tire", offset: 0.022, delivery: "Curbside pickup in 2 hours", logoUrl: "https://www.canadiantire.ca/favicon.ico" }
  ],
  au: [
    { name: "Amazon Australia", offset: 0, delivery: "Free delivery with Prime", logoUrl: "https://www.amazon.com.au/favicon.ico" },
    { name: "JB Hi-Fi", offset: 0.014, delivery: "Store pickup in 1 hour", logoUrl: "https://www.jbhifi.com.au/favicon.ico" },
    { name: "Harvey Norman", offset: 0.028, delivery: "Click & Collect in 2 hours", logoUrl: "https://www.harveynorman.com.au/favicon.ico" },
    { name: "Kmart Australia", offset: -0.012, delivery: "Standard delivery $3", logoUrl: "https://www.kmart.com.au/favicon.ico" }
  ],
  de: [
    { name: "Amazon Germany", offset: 0, delivery: "Kostenlose Lieferung mit Prime", logoUrl: "https://www.amazon.de/favicon.ico" },
    { name: "MediaMarkt", offset: 0.01, delivery: "Abholung im Markt in 30 Min", logoUrl: "https://www.mediamarkt.de/favicon.ico" },
    { name: "Saturn", offset: -0.005, delivery: "Abholung im Markt", logoUrl: "https://www.saturn.de/favicon.ico" },
    { name: "Otto", offset: 0.024, delivery: "Lieferung in 2-3 Werktagen", logoUrl: "https://www.otto.de/favicon.ico" }
  ],
  fr: [
    { name: "Amazon France", offset: 0, delivery: "Livraison gratuite avec Prime", logoUrl: "https://www.amazon.fr/favicon.ico" },
    { name: "Fnac", offset: 0.012, delivery: "Retrait gratuit en magasin 1h", logoUrl: "https://www.fnac.com/favicon.ico" },
    { name: "Darty", offset: -0.006, delivery: "Retrait gratuit en magasin", logoUrl: "https://www.darty.com/favicon.ico" },
    { name: "Cdiscount", offset: 0.018, delivery: "Livraison en point retrait", logoUrl: "https://www.cdiscount.com/favicon.ico" }
  ],
  jp: [
    { name: "Amazon Japan", offset: 0, delivery: "プライム会員送料無料", logoUrl: "https://www.amazon.co.jp/favicon.ico" },
    { name: "Yodobashi Camera", offset: 0.008, delivery: "店舗受取最速30分 · ポイント還元", logoUrl: "https://www.yodobashi.com/favicon.ico" },
    { name: "Bic Camera", offset: -0.004, delivery: "最短当日配送 · ポイント還元", logoUrl: "https://www.biccamera.com/favicon.ico" },
    { name: "Rakuten", offset: 0.015, delivery: "送料無料ラインあり", logoUrl: "https://www.rakuten.co.jp/favicon.ico" }
  ],
  us: [
    { name: "Amazon", offset: 0, delivery: "Free Prime delivery tomorrow", logoUrl: "https://www.amazon.com/favicon.ico" },
    { name: "Walmart", offset: 0.015, delivery: "Free 2-day delivery", logoUrl: "https://www.walmart.com/favicon.ico" },
    { name: "Best Buy", offset: -0.01, delivery: "Free store pickup · In stock", logoUrl: "https://www.bestbuy.com/favicon.ico" },
    { name: "Target", offset: 0.02, delivery: "Free shipping over $35", logoUrl: "https://www.target.com/favicon.ico" }
  ]
};

/**
 * Helper to simulate comparator offers across multiple retailers.
 * Uses country code to load regional retailers.
 */
export function getSimulatedOffers(
  basePrice: number,
  originalPrice: number,
  productName: string = "deals",
  gl: string = "us"
): SellerOffer[] {
  const countryKey = gl.toLowerCase();
  const sources = REGIONAL_SOURCES[countryKey] || REGIONAL_SOURCES["us"];

  return sources.map((src) => {
    const finalPrice = Math.round(basePrice * (1 + src.offset));
    const finalOriginal = Math.round(originalPrice * (1 + src.offset));
    
    // Generate realistic search link for the specific product on the store's site
    let link = "";
    const query = encodeURIComponent(productName);

    switch (src.name.toLowerCase()) {
      case "amazon":
      case "amazon india":
      case "amazon uk":
      case "amazon canada":
      case "amazon australia":
      case "amazon germany":
      case "amazon france":
      case "amazon japan": {
        let amznDomain = "com";
        if (countryKey === "in") amznDomain = "in";
        else if (countryKey === "uk" || countryKey === "gb") amznDomain = "co.uk";
        else if (countryKey === "ca") amznDomain = "ca";
        else if (countryKey === "au") amznDomain = "com.au";
        else if (countryKey === "de") amznDomain = "de";
        else if (countryKey === "fr") amznDomain = "fr";
        else if (countryKey === "jp") amznDomain = "co.jp";
        link = `https://www.amazon.${amznDomain}/s?k=${query}`;
        break;
      }
      case "walmart":
      case "walmart canada":
        link = `https://www.walmart.${countryKey === "ca" ? "ca" : "com"}/search?q=${query}`;
        break;
      case "best buy":
      case "bestbuy":
      case "best buy canada":
        link = `https://www.bestbuy.${countryKey === "ca" ? "ca" : "com"}/site/searchpage.jsp?st=${query}`;
        break;
      case "target":
        link = `https://www.target.com/s?searchTerm=${query}`;
        break;
      case "flipkart":
        link = `https://www.flipkart.com/search?q=${query}`;
        break;
      case "croma":
        link = `https://www.croma.com/search?q=${query}`;
        break;
      case "reliance digital":
        link = `https://www.reliancedigital.in/search?q=${query}`;
        break;
      case "currys":
        link = `https://www.currys.co.uk/search?q=${query}`;
        break;
      case "argos":
        link = `https://www.argos.co.uk/search/static/search.xhtml?q=${query}`;
        break;
      case "john lewis":
        link = `https://www.johnlewis.com/search?search-term=${query}`;
        break;
      case "canadian tire":
        link = `https://www.canadiantire.ca/en/search-results.html?q=${query}`;
        break;
      case "jb hi-fi":
        link = `https://www.jbhifi.com.au/search?query=${query}`;
        break;
      case "harvey norman":
        link = `https://www.harveynorman.com.au/catalogsearch/result/?q=${query}`;
        break;
      case "kmart australia":
        link = `https://www.kmart.com.au/search?searchTerm=${query}`;
        break;
      case "mediamarkt":
        link = `https://www.mediamarkt.de/de/search.html?query=${query}`;
        break;
      case "saturn":
        link = `https://www.saturn.de/de/search.html?query=${query}`;
        break;
      case "otto":
        link = `https://www.otto.de/suche/${query}/`;
        break;
      case "fnac":
        link = `https://recherche.fnac.com/SearchResult/ResultList.aspx?Search=${query}`;
        break;
      case "darty":
        link = `https://www.darty.com/nav/recherche/${query}.html`;
        break;
      case "cdiscount":
        link = `https://www.cdiscount.com/search/10/${query}.html`;
        break;
      case "yodobashi camera":
        link = `https://www.yodobashi.com/?word=${query}`;
        break;
      case "bic camera":
        link = `https://www.biccamera.com/bc/main/SearchHeaderFlow.jsp?q=${query}`;
        break;
      case "rakuten": {
        const d = countryKey === "jp" ? "co.jp" : "com";
        link = `https://search.rakuten.${d}/search/mall/${query}/`;
        break;
      }
      default:
        link = `https://www.google.com/search?q=${encodeURIComponent(src.name + " " + productName)}`;
    }

    return {
      source: src.name,
      price: finalPrice,
      originalPrice: finalOriginal,
      link,
      delivery: src.delivery,
      logoUrl: src.logoUrl,
    };
  });
}

/**
 * Get a well-known favicon URL for a store name.
 * Falls back to a Google favicon service URL.
 */
export function getStoreFaviconUrl(source: string): string {
  const lower = source.toLowerCase();

  // Map well-known stores to their favicon
  const KNOWN: Record<string, string> = {
    amazon: "https://www.amazon.com/favicon.ico",
    walmart: "https://www.walmart.com/favicon.ico",
    "best buy": "https://www.bestbuy.com/favicon.ico",
    bestbuy: "https://www.bestbuy.com/favicon.ico",
    target: "https://www.target.com/favicon.ico",
    "b&h": "https://www.bhphotovideo.com/favicon.ico",
    "b&h photo": "https://www.bhphotovideo.com/favicon.ico",
    newegg: "https://www.newegg.com/favicon.ico",
    costco: "https://www.costco.com/favicon.ico",
    flipkart: "https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/favicon-60f9e7.ico",
    apple: "https://www.apple.com/favicon.ico",
    samsung: "https://www.samsung.com/favicon.ico",
    "samsung us": "https://www.samsung.com/favicon.ico",
    motorola: "https://www.motorola.com/favicon.ico",
    google: "https://www.google.com/favicon.ico",
    verizon: "https://www.verizon.com/favicon.ico",
    "t-mobile": "https://www.t-mobile.com/favicon.ico",
    "t-mobile for business": "https://www.t-mobile.com/favicon.ico",
    "boost mobile": "https://www.boostmobile.com/favicon.ico",
    "cricket wireless": "https://www.cricketwireless.com/favicon.ico",
    "at&t": "https://www.att.com/favicon.ico",
    att: "https://www.att.com/favicon.ico",
    ebay: "https://www.ebay.com/favicon.ico",
    "rakuten": "https://www.rakuten.com/favicon.ico",
    "adorama": "https://www.adorama.com/favicon.ico",
    "croma": "https://www.croma.com/favicon.ico",
    "reliance digital": "https://www.reliancedigital.in/favicon.ico",
    "vijay sales": "https://www.vijaysales.com/favicon.ico",
  };

  for (const [key, url] of Object.entries(KNOWN)) {
    if (lower.includes(key)) return url;
  }

  // Generic fallback: use Google's favicon service with the source as a domain hint
  // Extract a rough domain from the source name
  const domain = source.toLowerCase().replace(/\s+/g, "") + ".com";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Get the appropriate currency symbol for a country code (gl)
 */
export function getCurrencySymbol(gl: string): string {
  switch (gl?.toLowerCase()) {
    case "in": return "₹";
    case "uk":
    case "gb": return "£";
    case "ca": return "C$";
    case "au": return "A$";
    case "de":
    case "fr": return "€";
    case "jp": return "¥";
    case "us":
    default: return "$";
  }
}

/**
 * Automatically detects the user's home country based on timezone first,
 * falling back to navigator language locale. Defaults to "us".
 */
export function detectUserCountry(): string {
  if (typeof window === "undefined") return "us";

  // Try timezone detection first
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const lowerTz = tz.toLowerCase();
      if (lowerTz.includes("kolkata") || lowerTz.includes("calcutta")) return "in";
      if (lowerTz.includes("london")) return "uk";
      if (lowerTz.includes("toronto") || lowerTz.includes("vancouver") || lowerTz.includes("montreal")) return "ca";
      if (lowerTz.includes("sydney") || lowerTz.includes("melbourne") || lowerTz.includes("brisbane") || lowerTz.includes("australia")) return "au";
      if (lowerTz.includes("tokyo")) return "jp";
      if (lowerTz.includes("paris")) return "fr";
      if (lowerTz.includes("berlin") || lowerTz.includes("munich") || lowerTz.includes("frankfurt")) return "de";
    }
  } catch (_) {}

  // Fallback to browser locale language/country tag
  try {
    const locale = navigator.language || (navigator as any).userLanguage || "";
    const countryPart = locale.split("-")[1]?.toLowerCase();
    if (countryPart) {
      if (countryPart === "in") return "in";
      if (countryPart === "gb") return "uk";
      if (countryPart === "ca") return "ca";
      if (countryPart === "au") return "au";
      if (countryPart === "jp") return "jp";
      if (countryPart === "de") return "de";
      if (countryPart === "fr") return "fr";
    }
    const langPart = locale.split("-")[0]?.toLowerCase();
    if (langPart) {
      if (langPart === "ja") return "jp";
      if (langPart === "de") return "de";
      if (langPart === "fr") return "fr";
    }
  } catch (_) {}

  return "us";
}


