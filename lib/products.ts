export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  ratingCount: number;
  reviewsCount: number;
  isAssured: boolean;
  freeDelivery: boolean;
  highlights: string[];
  specifications: Record<string, string>;
  offers: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", name: "All Categories", icon: "LayoutGrid" },
  { id: "mobiles", name: "Mobiles", icon: "Smartphone" },
  { id: "laptops", name: "Laptops", icon: "Laptop" },
  { id: "electronics", name: "Electronics", icon: "Headphones" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "home", name: "Home & Kitchen", icon: "Home" },
  { id: "books", name: "Books", icon: "BookOpen" },
  { id: "beauty", name: "Beauty & Care", icon: "Sparkles" },
  { id: "sports", name: "Sports", icon: "Dumbbell" },
  { id: "toys", name: "Toys & Games", icon: "Gamepad" },
  { id: "automotive", name: "Automotive", icon: "Car" },
];


export const PROMO_BANNERS = [
  {
    id: "banner-1",
    title: "Big Billion Days Are Coming!",
    subtitle: "Up to 80% Off on Top Brands • Early Access for Plus Members",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80",
    bgGradient: "from-blue-600 to-indigo-900",
    badge: "BIGGEST SALE",
  },
  {
    id: "banner-2",
    title: "Unleash Next-Gen Mobiles",
    subtitle: "No Cost EMI up to 12 months • Extra exchange value up to ₹5,000",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80",
    bgGradient: "from-amber-500 to-red-600",
    badge: "MOBILE BONANZA",
  },
  {
    id: "banner-3",
    title: "Upgrade Your Home Office",
    subtitle: "Laptops & Accessories starting from ₹15,999 • Free Delivery",
    image: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=1600&auto=format&fit=crop&q=80",
    bgGradient: "from-teal-600 to-cyan-900",
    badge: "MEGA ELECTRONICS",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Apple iPhone 15 Pro (Natural Titanium, 128 GB)",
    category: "mobiles",
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80"
    ],
    price: 127999,
    originalPrice: 134900,
    discount: 5,
    rating: 4.7,
    ratingCount: 14820,
    reviewsCount: 1120,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "128 GB ROM",
      "15.49 cm (6.1 inch) Super Retina XDR Display",
      "48MP + 12MP + 12MP Triple Rear Camera | 12MP Front Camera",
      "A17 Pro Chip with 6-core GPU",
      "Titanium Design with Ceramic Shield front",
      "Action button | USB-C connector with USB 3 support"
    ],
    specifications: {
      "Model Name": "iPhone 15 Pro",
      "Color": "Natural Titanium",
      "Display Size": "15.49 cm (6.1 inch)",
      "Resolution": "2556 x 1179 Pixels",
      "Processor Type": "A17 Pro Chip",
      "Internal Storage": "128 GB",
      "Primary Camera": "48MP + 12MP + 12MP",
      "Secondary Camera": "12MP Front Camera"
    },
    offers: [
      "Bank Offer: 10% instant discount on HDFC Bank Credit Cards, up to ₹1,500.",
      "Partner Offer: Sign up for Trendify Pay Later and get ₹500 Gift Voucher.",
      "No Cost EMI: Starting from ₹10,666/month."
    ]
  },
  {
    id: "p2",
    name: "Samsung Galaxy S24 Ultra 5G (Titanium Black, 256 GB)",
    category: "mobiles",
    brand: "Samsung",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610945415295-d9b226b15dff?w=600&auto=format&fit=crop&q=80"
    ],
    price: 129999,
    originalPrice: 144999,
    discount: 10,
    rating: 4.6,
    ratingCount: 8940,
    reviewsCount: 780,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "12 GB RAM | 256 GB ROM",
      "17.27 cm (6.8 inch) Quad HD+ Dynamic AMOLED 2X Display",
      "200MP + 50MP + 12MP + 10MP Quad Rear Camera | 12MP Front Camera",
      "Snapdragon 8 Gen 3 Processor",
      "S Pen Foldable & Built-in",
      "5000 mAh Lithium-ion Battery"
    ],
    specifications: {
      "Model Name": "Galaxy S24 Ultra",
      "Color": "Titanium Black",
      "Display Size": "17.27 cm (6.8 inch)",
      "RAM": "12 GB",
      "Internal Storage": "256 GB",
      "Processor": "Snapdragon 8 Gen 3",
      "Primary Camera": "200MP + 50MP + 12MP + 10MP",
      "Battery Capacity": "5000 mAh"
    },
    offers: [
      "Bank Offer: Flat ₹5,000 instant discount with ICICI Bank Cards.",
      "Exchange Offer: Get up to ₹15,000 off in exchange for your old phone.",
      "Special Price: Get extra ₹15,000 off (inclusive of cashback/coupon)."
    ]
  },
  {
    id: "p3",
    name: "OnePlus 12 5G (Flowy Emerald, 256 GB)",
    category: "mobiles",
    brand: "OnePlus",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
    ],
    price: 64999,
    originalPrice: 69999,
    discount: 7,
    rating: 4.5,
    ratingCount: 6510,
    reviewsCount: 420,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "12 GB RAM | 256 GB ROM",
      "17.32 cm (6.82 inch) 120 Hz 2K ProXDR Display",
      "50MP + 64MP + 48MP Rear Camera | 32MP Front Camera",
      "Snapdragon 8 Gen 3 Mobile Platform",
      "5400 mAh Battery | 100W SUPERVOOC Charging",
      "Hasselblad Camera for Mobile"
    ],
    specifications: {
      "Model Name": "OnePlus 12",
      "Color": "Flowy Emerald",
      "Display Size": "17.32 cm (6.82 inch)",
      "RAM": "12 GB",
      "Internal Storage": "256 GB",
      "Processor": "Snapdragon 8 Gen 3",
      "Primary Camera": "50MP + 64MP + 48MP",
      "Battery Capacity": "5400 mAh"
    },
    offers: [
      "Bank Offer: ₹2,000 Instant Discount with SBI Credit Cards.",
      "Freebie: Free protective bumper case inside the box.",
      "EMI: No Cost EMI starting at ₹5,417/month."
    ]
  },
  {
    id: "p4",
    name: "Apple MacBook Air M3 (13.6 inch, Space Gray, 8 GB RAM, 256 GB SSD)",
    category: "laptops",
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80"
    ],
    price: 104990,
    originalPrice: 114900,
    discount: 8,
    rating: 4.8,
    ratingCount: 3200,
    reviewsCount: 290,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "M3 Chip with 8-core CPU and 10-core GPU",
      "8 GB Unified Memory | 256 GB SSD",
      "34.46 cm (13.6 inch) Liquid Retina Display with True Tone",
      "1080p FaceTime HD Camera | Three-Microphone Array",
      "Backlit Magic Keyboard with Touch ID",
      "Up to 18 Hours of Battery Life"
    ],
    specifications: {
      "Model Name": "MacBook Air M3",
      "Color": "Space Gray",
      "Screen Size": "34.46 cm (13.6 inch)",
      "Processor": "Apple M3 Chip",
      "RAM": "8 GB Unified Memory",
      "SSD Capacity": "256 GB",
      "Operating System": "macOS Sonoma",
      "Weight": "1.24 kg"
    },
    offers: [
      "Bank Offer: ₹5,000 instant discount on all major credit cards.",
      "Student Offer: Extra ₹3,000 discount with verified Student ID.",
      "No Cost EMI: 6 & 9 months options available."
    ]
  },
  {
    id: "p5",
    name: "Sony WH-1000XM5 Wireless ANC Headphones (Black)",
    category: "electronics",
    brand: "Sony",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80"
    ],
    price: 26990,
    originalPrice: 34990,
    discount: 22,
    rating: 4.6,
    ratingCount: 15400,
    reviewsCount: 1980,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Industry Leading Active Noise Cancelling with Auto NC Optimizer",
      "Magnificent Sound with new Integrated Processor V1",
      "Crystal clear hands-free calling with 4 beamforming microphones",
      "Up to 30-hour battery life with quick charging (3 min charge for 3 hours play)",
      "Ultra-comfortable, lightweight design with soft fit leather",
      "Multipoint connection allows quick switching between devices"
    ],
    specifications: {
      "Model Name": "WH-1000XM5",
      "Color": "Black",
      "Headphone Type": "Over-Ear",
      "Connectivity": "Bluetooth v5.2",
      "Battery Life": "Up to 30 hours",
      "Charging Time": "3.5 hours",
      "Noise Cancellation": "Yes, Active Noise Cancellation",
      "Warranty": "1 Year domestic warranty"
    },
    offers: [
      "Bank Offer: ₹2,000 flat discount on AXIS Bank Credit cards.",
      "Special Discount: Extra ₹1,000 off applied automatically.",
      "EMI: Starting at ₹2,249/month."
    ]
  },
  {
    id: "p6",
    name: "HP Spectre x360 Intel Core i7 2-in-1 Touchscreen Laptop (16 GB, 1 TB SSD)",
    category: "laptops",
    brand: "HP",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80"
    ],
    price: 139990,
    originalPrice: 169990,
    discount: 17,
    rating: 4.4,
    ratingCount: 890,
    reviewsCount: 95,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Intel Evo Platform Core i7 13th Gen",
      "16 GB LPDDR5 RAM | 1 TB PCIe NVMe SSD",
      "34.3 cm (13.5 inch) OLED Touchscreen Display | 3K2K Resolution",
      "HP Rechargeable MPP 2.0 Tilt Pen Included",
      "Intel Iris Xe Graphics | Windows 11 Home",
      "Spectacular gem-cut design | Backlit Keyboard"
    ],
    specifications: {
      "Model Name": "Spectre x360 13.5-inch",
      "Color": "Nightfall Black",
      "Processor": "Intel Core i7 (13th Gen)",
      "RAM": "16 GB LPDDR5",
      "Storage": "1 TB SSD",
      "Screen": "Touchscreen OLED Display",
      "OS": "Windows 11 Home",
      "Battery Life": "Up to 15 hours"
    },
    offers: [
      "Bank Offer: 10% instant discount up to ₹2,500 on ICICI Credit Cards.",
      "Freebie: Free premium HP executive leather sleeve.",
      "No Cost EMI: Up to 12 months with selected bank credit cards."
    ]
  },
  {
    id: "p7",
    name: "Nike Air Max Pulse Casual Sneakers (White/Red)",
    category: "fashion",
    brand: "Nike",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80"
    ],
    price: 11899,
    originalPrice: 14995,
    discount: 20,
    rating: 4.3,
    ratingCount: 1240,
    reviewsCount: 145,
    isAssured: false,
    freeDelivery: true,
    highlights: [
      "Material: Breathable Mesh & Leather overlays",
      "Cushioning: Air Max unit in heel for high responsiveness",
      "Lifestyle: Casual wear, running, fitness training",
      "Outsole: Textured rubber for durability and grip",
      "Iconic swoosh logo details on side & tongue"
    ],
    specifications: {
      "Type": "Casual Sneakers",
      "Ideal For": "Men",
      "Material": "Mesh & Synthetic Leather",
      "Closure": "Lace-Up",
      "Sole Material": "Rubber Sole",
      "Cushioning": "Max Air Heel Unit",
      "Weight": "380g per shoe"
    },
    offers: [
      "Bank Offer: 5% Unlimited Cashback on Trendify Axis Bank Credit Card.",
      "Special Offer: Buy 2 get 10% off, Buy 3 get 15% off on Select Fashion items."
    ]
  },
  {
    id: "p8",
    name: "Levi's Men's Trucker Denim Jacket (Indigo Blue)",
    category: "fashion",
    brand: "Levi's",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80"
    ],
    price: 3499,
    originalPrice: 4999,
    discount: 30,
    rating: 4.2,
    ratingCount: 3950,
    reviewsCount: 310,
    isAssured: true,
    freeDelivery: false,
    highlights: [
      "100% Cotton, Non-stretch denim fabric",
      "Point collar; front button placket",
      "Long sleeves with button closures at cuffs",
      "Button-flap patch pockets at chest; welt side pockets",
      "Adjustable side tabs at hem for a customized fit"
    ],
    specifications: {
      "Type": "Denim Jacket",
      "Fit": "Regular Fit",
      "Fabric": "Pure Cotton Denim",
      "Sleeve": "Full Sleeve",
      "Pattern": "Solid",
      "Reversible": "No",
      "Care Instructions": "Machine Wash cold"
    },
    offers: [
      "Bank Offer: 10% off on Kotak Bank Debit/Credit Cards.",
      "Combo Offer: Extra ₹150 off on buying with any Levi's Jeans."
    ]
  },
  {
    id: "p9",
    name: "Dyson V15 Detect Cord-Free Vacuum Cleaner (Yellow/Nickel)",
    category: "home",
    brand: "Dyson",
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80"
    ],
    price: 59900,
    originalPrice: 65900,
    discount: 9,
    rating: 4.8,
    ratingCount: 710,
    reviewsCount: 88,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Laser reveals microscopic dust for absolute proof of clean",
      "Piezo sensor continuously sizes and counts dust particles",
      "LCD screen displays scientific proof of a deep clean in real time",
      "Dyson Hyperdymium motor spins up to 125,000rpm to generate powerful suction",
      "Up to 60 minutes of fade-free cleaning power"
    ],
    specifications: {
      "Model Name": "V15 Detect Cord-Free",
      "Type": "Handstick Vacuum Cleaner",
      "Power Source": "Battery Powered (Rechargeable)",
      "Run Time": "Up to 60 minutes",
      "Dust Bin Capacity": "0.76 L",
      "Suction Power": "240 AW",
      "Weight": "3.1 kg",
      "Warranty": "2 Years Dyson India Warranty"
    },
    offers: [
      "Bank Offer: ₹3,000 instant discount on HSBC credit cards.",
      "Installation: Free video demo and home installation setup by Dyson technicians."
    ]
  },
  {
    id: "p10",
    name: "Nespresso Vertuo Next Espresso Coffee Maker by De'Longhi (Cherry Red)",
    category: "home",
    brand: "Nespresso",
    image: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=600&auto=format&fit=crop&q=80"
    ],
    price: 18999,
    originalPrice: 22999,
    discount: 17,
    rating: 4.5,
    ratingCount: 2240,
    reviewsCount: 176,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Centrifusion technology gently and fully brews various coffee sizes",
      "Capsule recognition adjusts temperature, flow rate & speed for each blend",
      "Brew 5 cup sizes: Espresso, Double Espresso, Gran Lungo, Mug, and Alto",
      "Fast heat-up in 30 seconds; auto off after 2 minutes of idle",
      "Modern, sustainable design made from 54% recycled plastics"
    ],
    specifications: {
      "Model Name": "Vertuo Next GCV1",
      "Color": "Cherry Red",
      "Water Tank Capacity": "1.1 L",
      "Pressure": "Centrifusion Extraction Technology",
      "Power consumption": "1500 Watts",
      "Capsule Type": "Nespresso Vertuo Pods Only",
      "Dimensions": "14 x 42.9 x 31.7 cm"
    },
    offers: [
      "Welcome Offer: Free 12 Vertuo capsule starter pack included in the box.",
      "Bank Offer: 5% instant discount on Axis Bank debit cards."
    ]
  },
  {
    id: "p11",
    name: "Philips Air Fryer XXL 7.3L with Smart Sensing (HD9867/90)",
    category: "home",
    brand: "Philips",
    image: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80"
    ],
    price: 21999,
    originalPrice: 29999,
    discount: 26,
    rating: 4.7,
    ratingCount: 3840,
    reviewsCount: 420,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Smart Sensing Technology automatically adjusts time and temperature",
      "XXL Family size capacity: Fits a whole chicken or 1.4 kg of fries",
      "Fat Removal technology separates and captures excess fat",
      "Rapid Air technology for 7x faster airflow and crispier results",
      "Keep Warm mode keeps your food hot for up to 30 minutes"
    ],
    specifications: {
      "Model Name": "Premium Airfryer XXL HD9867/90",
      "Capacity": "7.3 L",
      "Color": "Black and Copper",
      "Power Consumption": "2225 Watts",
      "Temperature Range": "40°C - 200°C",
      "Presets": "5 Smart Chef Programs",
      "Dishwasher Safe": "Yes, all removable parts"
    },
    offers: [
      "Bank Offer: 10% instant discount on IDFC First Bank Credit Cards.",
      "Recipe book: Free NutriU App download with 500+ easy air fryer recipes."
    ]
  },
  {
    id: "p12",
    name: "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)",
    category: "electronics",
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=600&auto=format&fit=crop&q=80"
    ],
    price: 22999,
    originalPrice: 24900,
    discount: 7,
    rating: 4.7,
    ratingCount: 22890,
    reviewsCount: 2190,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Apple-designed H2 chip delivers advanced audio performance and noise cancellation",
      "Up to 2x more Active Noise Cancellation than the previous generation",
      "Adaptive Audio dynamically blends Transparency mode and Active Noise Cancellation",
      "Customizable fit with four sizes of silicone ear tips (XS, S, M, L)",
      "Up to 6 hours of listening time with ANC enabled, 30 hours total with MagSafe Charging Case",
      "MagSafe Charging Case (USB-C) with speaker and lanyard loop"
    ],
    specifications: {
      "Model Name": "AirPods Pro (2nd Gen)",
      "Color": "White",
      "Headphone Type": "In-Ear",
      "Connectivity": "Bluetooth v5.3",
      "Chip": "Apple H2 chip, U1 chip in charging case",
      "Water Resistance": "IP54 sweat and water resistant",
      "Charging Port": "USB-C, MagSafe, Apple Watch Charger"
    },
    offers: [
      "Bank Offer: Extra ₹1,500 off on Axis Bank Credit Cards.",
      "Apple Music: Get 6 months of Apple Music for free with your new AirPods Pro."
    ]
  },
  {
    id: "p13",
    name: "Atomic Habits by James Clear (Hardcover)",
    category: "books",
    brand: "Penguin",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"],
    price: 499,
    originalPrice: 799,
    discount: 37,
    rating: 4.8,
    ratingCount: 8520,
    reviewsCount: 1040,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Hardcover Edition",
      "Over 10 million copies sold worldwide",
      "Easy and proven way to build good habits and break bad ones",
      "Features tools, strategies, and templates for habit tracking"
    ],
    specifications: {
      "Author": "James Clear",
      "Publisher": "Penguin Random House",
      "Language": "English",
      "Binding": "Hardcover",
      "Pages": "320 pages"
    },
    offers: [
      "Bank Offer: 5% Unlimited Cashback on Flipkart Axis Bank Credit Card.",
      "Combo Offer: Buy 2 books get 10% off."
    ]
  },
  {
    id: "p14",
    name: "The Psychology of Money by Morgan Housel",
    category: "books",
    brand: "Harriman House",
    image: "https://images.unsplash.com/photo-1592492159418-09f31333c269?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1592492159418-09f31333c269?w=600&auto=format&fit=crop&q=80"],
    price: 299,
    originalPrice: 399,
    discount: 25,
    rating: 4.7,
    ratingCount: 12050,
    reviewsCount: 1540,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Paperback Edition",
      "19 short stories exploring the strange ways people think about money",
      "Learn how to make better sense of life's most important financial decisions"
    ],
    specifications: {
      "Author": "Morgan Housel",
      "Publisher": "Harriman House",
      "Language": "English",
      "Binding": "Paperback",
      "Pages": "252 pages"
    },
    offers: [
      "Special Price: Flat ₹100 off on first purchase."
    ]
  },
  {
    id: "p15",
    name: "L'Oreal Paris Hyaluronic Acid Serum (30ml)",
    category: "beauty",
    brand: "L'Oreal",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"],
    price: 699,
    originalPrice: 999,
    discount: 30,
    rating: 4.4,
    ratingCount: 4500,
    reviewsCount: 310,
    isAssured: true,
    freeDelivery: false,
    highlights: [
      "1.5% Hyaluronic Acid content",
      "Deeply hydrates skin and reduces fine lines by 60%",
      "Lightweight, non-sticky formula suitable for all skin types",
      "Dermatologically tested"
    ],
    specifications: {
      "Volume": "30 ml",
      "Skin Type": "All Skin Types",
      "Form": "Serum",
      "Application Area": "Face & Neck"
    },
    offers: [
      "Bank Offer: 10% instant discount on HDFC Bank Cards.",
      "Freebie: Free face wash sample on purchases above ₹1,000."
    ]
  },
  {
    id: "p16",
    name: "Philips Selfie Hair Straightener (HP8302/00)",
    category: "beauty",
    brand: "Philips",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80"],
    price: 1199,
    originalPrice: 1499,
    discount: 20,
    rating: 4.3,
    ratingCount: 31200,
    reviewsCount: 2890,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Infused ceramic plates for ultra-smooth gliding",
      "210°C styling temperature for perfect styling results",
      "Fast heat-up time, ready to use in 60 seconds",
      "1.6 m power cord for maximum flexibility"
    ],
    specifications: {
      "Plate Material": "Ceramic",
      "Maximum Temperature": "210°C",
      "Heat Up Time": "60 seconds",
      "Power Cord Length": "1.6 m",
      "Warranty": "2 Years Philips India Warranty"
    },
    offers: [
      "Warranty Extension: 1 Year extra warranty upon registration."
    ]
  },
  {
    id: "p17",
    name: "Decathlon Dumbbell Set (10kg)",
    category: "sports",
    brand: "Decathlon",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80"],
    price: 1999,
    originalPrice: 2999,
    discount: 33,
    rating: 4.5,
    ratingCount: 2310,
    reviewsCount: 198,
    isAssured: true,
    freeDelivery: false,
    highlights: [
      "10 kg adjustable dumbbell set (includes plates & bar)",
      "Ergonomic chrome bar handles for secure grip",
      "High durability steel and rubber plates",
      "Ideal for beginners and home gym setups"
    ],
    specifications: {
      "Weight": "10 kg",
      "Material": "Cast Iron / Rubberized",
      "Adjustable": "Yes",
      "In the Box": "1 Bar, 2 Collars, 4x 1.25kg plates, 2x 2kg plates"
    },
    offers: [
      "Bank Offer: 10% Off on Axis Bank Credit Cards."
    ]
  },
  {
    id: "p18",
    name: "Nivia Storm Football (Size 5)",
    category: "sports",
    brand: "Nivia",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80"],
    price: 499,
    originalPrice: 699,
    discount: 28,
    rating: 4.2,
    ratingCount: 15400,
    reviewsCount: 1200,
    isAssured: false,
    freeDelivery: true,
    highlights: [
      "Size 5 football (Official Match Size)",
      "32-panel rubberized stitched design",
      "Excellent flight control and shape retention",
      "Ideal for training and casual play"
    ],
    specifications: {
      "Size": "5",
      "Material": "Rubber",
      "Stitched": "Machine Stitched",
      "Bladder": "Butyl Bladder"
    },
    offers: [
      "Bank Offer: Get 5% cashback on Flipkart Axis Bank card."
    ]
  },
  {
    id: "p19",
    name: "Lego Classic Medium Creative Brick Box",
    category: "toys",
    brand: "Lego",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80"],
    price: 2299,
    originalPrice: 2799,
    discount: 17,
    rating: 4.8,
    ratingCount: 5600,
    reviewsCount: 680,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Includes 484 pieces in 35 different colors",
      "Features 18 tires and 18 wheel rims",
      "Special pieces include green baseplate, windows, and eyes",
      "Comes in a useful plastic storage box"
    ],
    specifications: {
      "Age Group": "4+ Years",
      "Number of Pieces": "484",
      "Model Number": "10696",
      "Theme": "Lego Classic"
    },
    offers: [
      "Bank Offer: 10% instant discount on ICICI Bank Cards."
    ]
  },
  {
    id: "p20",
    name: "Monopoly Deluxe Edition Board Game",
    category: "toys",
    brand: "Hasbro",
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80"],
    price: 1499,
    originalPrice: 1999,
    discount: 25,
    rating: 4.6,
    ratingCount: 9400,
    reviewsCount: 870,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "Premium deluxe board and gold-colored tokens",
      "Classic fast-dealing property trading game",
      "Includes wooden houses and hotels",
      "Perfect for family game nights (2-6 players)"
    ],
    specifications: {
      "Age Group": "8+ Years",
      "Number of Players": "2 to 6",
      "Type": "Board Game",
      "In the Box": "Board, Tokens, Title Deeds, Play Money, Dice, Houses/Hotels"
    },
    offers: [
      "Bank Offer: Flat ₹150 off on select bank cards."
    ]
  },
  {
    id: "p21",
    name: "Qubo Smart Dash Car Cam (1080p Full HD)",
    category: "automotive",
    brand: "Qubo",
    image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&auto=format&fit=crop&q=80"],
    price: 3490,
    originalPrice: 4990,
    discount: 30,
    rating: 4.3,
    ratingCount: 1200,
    reviewsCount: 140,
    isAssured: true,
    freeDelivery: true,
    highlights: [
      "1080p Full HD recording with Wide Angle lens",
      "Built-in Wi-Fi & App Connectivity for easy video sharing",
      "G-Sensor for automatic collision detection and loop recording",
      "Super capacitor for heat resistance"
    ],
    specifications: {
      "Resolution": "1080p Full HD",
      "Display": "App Screen Only",
      "Field of View": "140 Degrees",
      "Night Vision": "Yes, enhanced low light"
    },
    offers: [
      "Bank Offer: 10% instant discount on Axis Bank Cards."
    ]
  },
  {
    id: "p22",
    name: "GoMechanic Smart USB Fast Car Charger",
    category: "automotive",
    brand: "GoMechanic",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80"],
    price: 399,
    originalPrice: 799,
    discount: 50,
    rating: 4.1,
    ratingCount: 4200,
    reviewsCount: 310,
    isAssured: false,
    freeDelivery: true,
    highlights: [
      "Dual port fast charger (QC 3.0 + Type-C PD 20W)",
      "Smart IC technology protects against overheating and overcharging",
      "Universal compatibility with iOS and Android devices",
      "Premium aluminum alloy body with LED indicator"
    ],
    specifications: {
      "Total Output": "38 Watts",
      "Ports": "1x USB-A (QC 3.0), 1x Type-C (PD)",
      "Material": "Aluminum Alloy",
      "Voltage Input": "12V - 24V"
    },
    offers: [
      "Special Offer: Buy 2 get 10% off."
    ]
  }
];

export interface SellerOffer {
  source: string;
  price: number;
  originalPrice: number;
  link: string;
  delivery: string;
  logoUrl?: string;
}

export interface ComparatorProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  ratingCount: number;
  reviewsCount: number;
  isAssured: boolean;
  freeDelivery: boolean;
  highlights: string[];
  specifications: Record<string, string>;
  offers: SellerOffer[];
  currencySymbol?: string;
}

