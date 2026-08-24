/**
 * Seed list for the /logos showcase: the 100 most recognizable global brands,
 * in Interbrand Best Global Brands 2025 order.
 *
 * Interbrand ranks brands, not companies — a brand only qualifies if it is
 * recognized worldwide, so this is a recognition list rather than a market-cap
 * one. Entries are the brand Interbrand names, which is often not the listed
 * parent: Google rather than Alphabet, Facebook and Instagram rather than Meta,
 * Coca-Cola rather than The Coca-Cola Company.
 *
 * `svglTitle` is an exact api.svgl.app title. When present the pipeline takes
 * the svgl asset first, because those are hand-curated brand SVGs.
 *
 * `wikipedia` is an en.wikipedia article title, resolved through redirects to a
 * Wikidata item and then to its P154 (logo image) file.
 *
 * `commonsFile` overrides P154 when Wikidata has no SVG, or points at an
 * outdated logo. It is a file name without the `File:` prefix, resolved through
 * en.wikipedia's Special:FilePath — which serves Commons files and the
 * enwiki-local uploads (non-free brand marks) that Commons does not host.
 *
 * `ticker` is optional and left unset here: most of these are product or
 * private brands (Instagram, Louis Vuitton, Pampers, Chanel) with no ticker of
 * their own, and a brand's parent ticker would be a different entity.
 *
 * Rank 101 is not an Interbrand rank. Monster (#70) publishes no vector logo
 * anywhere the pipeline can reach — Wikimedia Commons, en.wikipedia and svgl
 * all carry raster art only — so its seed stays in place for the record and
 * American Express, #27 in Best Global Brands 2024, fills the hundredth tile.
 */
export type LogoSeed = {
  readonly rank: number;
  readonly name: string;
  readonly slug: string;
  readonly wikipedia: string;
  /** Stock ticker, when the brand is itself a listed company. */
  readonly ticker?: string;
  readonly svglTitle?: string;
  readonly commonsFile?: string;
};

export const LOGO_SEEDS: readonly LogoSeed[] = [
  { rank: 1, name: "Apple", slug: "apple", wikipedia: "Apple Inc.", svglTitle: "Apple" },
  { rank: 2, name: "Microsoft", slug: "microsoft", wikipedia: "Microsoft", svglTitle: "Microsoft" },
  { rank: 3, name: "Amazon", slug: "amazon", wikipedia: "Amazon (company)" },
  { rank: 4, name: "Google", slug: "google", wikipedia: "Google", svglTitle: "Google" },
  { rank: 5, name: "Samsung", slug: "samsung", wikipedia: "Samsung" },
  { rank: 6, name: "Toyota", slug: "toyota", wikipedia: "Toyota" },
  { rank: 7, name: "Coca-Cola", slug: "coca-cola", wikipedia: "Coca-Cola" },
  { rank: 8, name: "Instagram", slug: "instagram", wikipedia: "Instagram", svglTitle: "Instagram" },
  { rank: 9, name: "McDonald's", slug: "mcdonalds", wikipedia: "McDonald's", commonsFile: "McDonald's Golden Arches.svg" },
  { rank: 10, name: "Mercedes-Benz", slug: "mercedes-benz", wikipedia: "Mercedes-Benz" },
  { rank: 11, name: "Cisco", slug: "cisco", wikipedia: "Cisco", svglTitle: "Cisco" },
  { rank: 12, name: "Louis Vuitton", slug: "louis-vuitton", wikipedia: "Louis Vuitton" },
  { rank: 13, name: "YouTube", slug: "youtube", wikipedia: "YouTube", svglTitle: "YouTube" },
  { rank: 14, name: "BMW", slug: "bmw", wikipedia: "BMW" },
  { rank: 15, name: "NVIDIA", slug: "nvidia", wikipedia: "Nvidia", svglTitle: "NVIDIA" },
  { rank: 16, name: "Oracle", slug: "oracle", wikipedia: "Oracle Corporation" },
  { rank: 17, name: "Disney", slug: "disney", wikipedia: "The Walt Disney Company" },
  { rank: 18, name: "SAP", slug: "sap", wikipedia: "SAP" },
  { rank: 19, name: "Facebook", slug: "facebook", wikipedia: "Facebook", svglTitle: "Facebook" },
  { rank: 20, name: "Adobe", slug: "adobe", wikipedia: "Adobe Inc.", svglTitle: "Adobe" },
  { rank: 21, name: "Hermès", slug: "hermes", wikipedia: "Hermès" },
  { rank: 22, name: "IBM", slug: "ibm", wikipedia: "IBM", svglTitle: "IBM" },
  { rank: 23, name: "Nike", slug: "nike", wikipedia: "Nike, Inc." },
  { rank: 24, name: "Chanel", slug: "chanel", wikipedia: "Chanel" },
  { rank: 25, name: "Tesla", slug: "tesla", wikipedia: "Tesla, Inc." },
  // P154 gives the JPMorganChase corporate mark; Interbrand ranks the J.P. Morgan brand.
  { rank: 26, name: "J.P. Morgan", slug: "jp-morgan", wikipedia: "JPMorgan Chase", commonsFile: "J P Morgan Logo 2008.svg" },
  { rank: 27, name: "Allianz", slug: "allianz", wikipedia: "Allianz" },
  { rank: 28, name: "Netflix", slug: "netflix", wikipedia: "Netflix", svglTitle: "Netflix" },
  { rank: 29, name: "Honda", slug: "honda", wikipedia: "Honda" },
  { rank: 30, name: "Hyundai", slug: "hyundai", wikipedia: "Hyundai Motor Company" },
  { rank: 31, name: "BlackRock", slug: "blackrock", wikipedia: "BlackRock" },
  { rank: 32, name: "Booking.com", slug: "booking-com", wikipedia: "Booking.com" },
  { rank: 33, name: "Visa", slug: "visa", wikipedia: "Visa Inc.", commonsFile: "Visa Inc. logo (2021–present).svg" },
  { rank: 34, name: "Sony", slug: "sony", wikipedia: "Sony" },
  { rank: 35, name: "IKEA", slug: "ikea", wikipedia: "IKEA" },
  { rank: 36, name: "Mastercard", slug: "mastercard", wikipedia: "Mastercard" },
  { rank: 37, name: "Accenture", slug: "accenture", wikipedia: "Accenture" },
  { rank: 38, name: "Pepsi", slug: "pepsi", wikipedia: "Pepsi" },
  { rank: 39, name: "Qualcomm", slug: "qualcomm", wikipedia: "Qualcomm" },
  { rank: 40, name: "PayPal", slug: "paypal", wikipedia: "PayPal", svglTitle: "PayPal" },
  { rank: 41, name: "Zara", slug: "zara", wikipedia: "Zara (retailer)" },
  { rank: 42, name: "Salesforce", slug: "salesforce", wikipedia: "Salesforce", svglTitle: "Salesforce" },
  { rank: 43, name: "AXA", slug: "axa", wikipedia: "AXA" },
  { rank: 44, name: "GE Aerospace", slug: "ge-aerospace", wikipedia: "GE Aerospace" },
  { rank: 45, name: "Airbnb", slug: "airbnb", wikipedia: "Airbnb", svglTitle: "Airbnb" },
  { rank: 46, name: "UPS", slug: "ups", wikipedia: "United Parcel Service" },
  { rank: 47, name: "UNIQLO", slug: "uniqlo", wikipedia: "Uniqlo" },
  { rank: 48, name: "Siemens", slug: "siemens", wikipedia: "Siemens" },
  { rank: 49, name: "adidas", slug: "adidas", wikipedia: "Adidas" },
  { rank: 50, name: "LEGO", slug: "lego", wikipedia: "Lego" },
  { rank: 51, name: "Dell", slug: "dell", wikipedia: "Dell" },
  { rank: 52, name: "Audi", slug: "audi", wikipedia: "Audi" },
  { rank: 53, name: "Nintendo", slug: "nintendo", wikipedia: "Nintendo" },
  { rank: 54, name: "Ferrari", slug: "ferrari", wikipedia: "Ferrari" },
  { rank: 55, name: "Goldman Sachs", slug: "goldman-sachs", wikipedia: "Goldman Sachs" },
  { rank: 56, name: "Volkswagen", slug: "volkswagen", wikipedia: "Volkswagen" },
  { rank: 57, name: "Porsche", slug: "porsche", wikipedia: "Porsche" },
  { rank: 58, name: "Spotify", slug: "spotify", wikipedia: "Spotify", svglTitle: "Spotify" },
  { rank: 59, name: "L'Oréal Paris", slug: "loreal-paris", wikipedia: "L'Oréal" },
  { rank: 60, name: "Pampers", slug: "pampers", wikipedia: "Pampers", commonsFile: "Pampers logo.svg" },
  { rank: 61, name: "eBay", slug: "ebay", wikipedia: "eBay", svglTitle: "Ebay" },
  { rank: 62, name: "Citi", slug: "citi", wikipedia: "Citigroup" },
  { rank: 63, name: "Nescafé", slug: "nescafe", wikipedia: "Nescafé" },
  { rank: 64, name: "Uber", slug: "uber", wikipedia: "Uber", svglTitle: "Uber" },
  { rank: 65, name: "Schneider Electric", slug: "schneider-electric", wikipedia: "Schneider Electric" },
  { rank: 66, name: "Budweiser", slug: "budweiser", wikipedia: "Budweiser", commonsFile: "Budweiser Anheuser-Busch logo.svg" },
  { rank: 67, name: "HP", slug: "hp", wikipedia: "HP Inc." },
  { rank: 68, name: "H&M", slug: "h-and-m", wikipedia: "H&M" },
  { rank: 69, name: "Gucci", slug: "gucci", wikipedia: "Gucci" },
  // No vector logo on Commons, en.wikipedia or svgl — the article carries a
  // .webp raster only. Seeded for the record; the build reports it as a skip.
  { rank: 70, name: "Monster", slug: "monster", wikipedia: "Monster Energy" },
  { rank: 71, name: "Intel", slug: "intel", wikipedia: "Intel", commonsFile: "Intel logo 2023.svg" },
  { rank: 72, name: "HSBC", slug: "hsbc", wikipedia: "HSBC" },
  { rank: 73, name: "Cartier", slug: "cartier", wikipedia: "Cartier (jeweler)" },
  { rank: 74, name: "Philips", slug: "philips", wikipedia: "Philips" },
  { rank: 75, name: "LinkedIn", slug: "linkedin", wikipedia: "LinkedIn", svglTitle: "LinkedIn" },
  { rank: 76, name: "Colgate", slug: "colgate", wikipedia: "Colgate (toothpaste)" },
  { rank: 77, name: "Santander", slug: "santander", wikipedia: "Banco Santander" },
  { rank: 78, name: "Gillette", slug: "gillette", wikipedia: "Gillette" },
  { rank: 79, name: "Nestlé", slug: "nestle", wikipedia: "Nestlé" },
  { rank: 80, name: "Corona", slug: "corona", wikipedia: "Corona (beer)" },
  { rank: 81, name: "Xiaomi", slug: "xiaomi", wikipedia: "Xiaomi" },
  { rank: 82, name: "Nissan", slug: "nissan", wikipedia: "Nissan", commonsFile: "Nissan 2020 logo.svg" },
  { rank: 83, name: "Dior", slug: "dior", wikipedia: "Dior" },
  { rank: 84, name: "Caterpillar", slug: "caterpillar", wikipedia: "Caterpillar Inc." },
  { rank: 85, name: "Nasdaq", slug: "nasdaq", wikipedia: "Nasdaq" },
  { rank: 86, name: "Prada", slug: "prada", wikipedia: "Prada" },
  { rank: 87, name: "3M", slug: "3m", wikipedia: "3M" },
  { rank: 88, name: "John Deere", slug: "john-deere", wikipedia: "John Deere", commonsFile: "John Deere Logo – Flat 2 Color.svg" },
  { rank: 89, name: "Kia", slug: "kia", wikipedia: "Kia" },
  { rank: 90, name: "BYD", slug: "byd", wikipedia: "BYD Auto" },
  { rank: 91, name: "Danone", slug: "danone", wikipedia: "Danone", commonsFile: "Danone dairy logo.svg" },
  { rank: 92, name: "FedEx", slug: "fedex", wikipedia: "FedEx" },
  { rank: 93, name: "Sephora", slug: "sephora", wikipedia: "Sephora" },
  { rank: 94, name: "Tiffany & Co.", slug: "tiffany-and-co", wikipedia: "Tiffany & Co." },
  { rank: 95, name: "Pandora", slug: "pandora", wikipedia: "Pandora (jewelry)" },
  { rank: 96, name: "Huawei", slug: "huawei", wikipedia: "Huawei" },
  { rank: 97, name: "Range Rover", slug: "range-rover", wikipedia: "Range Rover" },
  { rank: 98, name: "Nespresso", slug: "nespresso", wikipedia: "Nespresso" },
  { rank: 99, name: "Shopify", slug: "shopify", wikipedia: "Shopify", svglTitle: "Shopify" },
  { rank: 100, name: "DHL", slug: "dhl", wikipedia: "DHL" },
  // Stands in for Monster; see the note at the top of this file.
  { rank: 101, name: "American Express", slug: "american-express", wikipedia: "American Express" },
];
