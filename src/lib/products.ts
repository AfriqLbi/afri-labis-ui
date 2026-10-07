export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: "women" | "men" | "accessories" | "prints";
  tags: string[];
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  details: string[];
  inStock: boolean;
  /** Available stock (stock − reserved). Used to cap cart quantity. */
  availableStock?: number;
  tag?: "New" | "Bestseller" | "Limited" | "Sale";
};

export const PRODUCTS: Product[] = [
  {
    id: "adunola-wrap-dress",
    name: "Adunola Wrap Dress",
    price: 42000,
    category: "women",
    tags: ["dress", "ankara", "women"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blue/Gold", "Red/Black"],
    images: [
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1574442624044-945f29ccb2a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "A figure-flattering wrap silhouette cut from hand-printed ankara fabric. The Adunola dress moves beautifully and transitions effortlessly from day events to evening affairs.",
    details: [
      "100% hand-printed ankara cotton",
      "Wrap style with adjustable tie",
      "V-neckline, flutter sleeves",
      "Midi length",
      "Dry clean recommended",
      "Made in Lagos, Nigeria",
    ],
    inStock: true,
    tag: "New",
  },
  {
    id: "aso-oke-maxi-set",
    name: "Aso-Oke Maxi Set",
    price: 68000,
    category: "women",
    tags: ["set", "aso-oke", "women", "maxi"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Gold/Black", "Ivory/Navy"],
    images: [
      "https://images.unsplash.com/photo-1625646741211-711bdd65c570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1649532355669-fe4004398063?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1649532345555-700311244b3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "Woven from authentic aso-oke fabric, this co-ord set is a celebration of Yoruba weaving heritage. The structured top and sweeping maxi skirt create an unforgettable silhouette.",
    details: [
      "Handwoven aso-oke fabric",
      "Two-piece: crop top + maxi skirt",
      "Side slit, elasticated waist",
      "Dry clean only",
      "Handcrafted in Iseyin, Oyo State",
    ],
    inStock: true,
    tag: "Bestseller",
  },
  {
    id: "kente-blazer",
    name: "Kente Blazer",
    price: 55000,
    category: "women",
    tags: ["blazer", "kente", "women"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Multicolour"],
    images: [
      "https://images.unsplash.com/photo-1709809081557-78f803ce93a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1611580045568-7201033c7a3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1523983254932-c7e6571c9d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "A tailored blazer constructed from vibrant kente cloth panels. Power dressing with a distinctly African identity. Pairs equally well with trousers or a midi skirt.",
    details: [
      "Kente cloth exterior, satin lining",
      "Single button closure",
      "Two front patch pockets",
      "Dry clean only",
      "Tailored in Accra, Ghana",
    ],
    inStock: true,
    tag: "New",
  },
  {
    id: "adire-trench-coat",
    name: "Adire Trench Coat",
    price: 78000,
    category: "women",
    tags: ["coat", "adire", "women", "outerwear"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Indigo", "Forest Green"],
    images: [
      "https://images.unsplash.com/photo-1784904935282-7a2719276b05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1648220667677-55f124ff486e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "A statement outerwear piece crafted from hand-dyed adire fabric using the traditional Yoruba resist-dyeing technique. Each coat is entirely unique.",
    details: [
      "Hand-dyed adire fabric",
      "Belt tie closure",
      "Storm flap, epaulettes",
      "Midi length",
      "Dry clean only",
      "Each piece is one-of-a-kind",
    ],
    inStock: true,
    tag: "Limited",
  },
  {
    id: "dashiki-polo",
    name: "Dashiki Polo",
    price: 28000,
    category: "men",
    tags: ["polo", "dashiki", "men"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Orange/Blue", "Red/White"],
    images: [
      "https://images.unsplash.com/photo-1556136412-3813d7367e4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1623678011430-7a44a120a2c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1578249797164-8304b35ef97c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "A contemporary take on the classic dashiki. Refined embroidery at the collar and cuffs elevates this everyday essential into something worth remembering.",
    details: [
      "Soft cotton-blend fabric",
      "Hand-embroidered detailing",
      "V-neck with two-button placket",
      "Regular fit",
      "Machine wash cold",
    ],
    inStock: true,
    tag: "New",
  },
  {
    id: "ankara-agbada-set",
    name: "Ankara Agbada Set",
    price: 95000,
    category: "men",
    tags: ["agbada", "ankara", "men", "formal"],
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Blue/Gold", "Black/Gold"],
    images: [
      "https://images.unsplash.com/photo-1653242832879-d730d48617f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1658748793187-d26acd71e607?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1623678011430-7a44a120a2c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "A full three-piece agbada set in bold ankara print. Designed for occasions that demand presence. Includes the wide outer robe, inner shirt, and matching trousers.",
    details: [
      "100% premium ankara cotton",
      "Three-piece: robe, shirt, trousers",
      "Intricate gold thread embroidery",
      "Hand-tailored to order",
      "Dry clean recommended",
    ],
    inStock: true,
    tag: "Bestseller",
  },
  {
    id: "guinea-brocade-kaftan",
    name: "Guinea Brocade Kaftan",
    price: 35000,
    category: "men",
    tags: ["kaftan", "brocade", "men"],
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Champagne", "Charcoal", "Burgundy"],
    images: [
      "https://images.unsplash.com/photo-1658748831275-8be3aa437bad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1663044022726-889ee51a682e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1578905323862-738dbb4641ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "Lightweight guinea brocade in a relaxed kaftan silhouette. The ideal piece for owambe events, summer evenings, and anytime you want to move with ease and elegance.",
    details: [
      "Guinea brocade fabric",
      "Embroidered neckline",
      "Side slit hem",
      "Relaxed fit",
      "Dry clean only",
    ],
    inStock: true,
    tag: "New",
  },
  {
    id: "beaded-ankara-bag",
    name: "Beaded Ankara Clutch",
    price: 18500,
    originalPrice: 22000,
    category: "accessories",
    tags: ["bag", "accessories", "ankara"],
    sizes: ["One Size"],
    colors: ["Blue/Gold", "Red/Black"],
    images: [
      "https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1578509566163-068acd11b8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1610573600031-bc1c2a16c6e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    description:
      "Hand-beaded clutch constructed from ankara fabric. A statement accessory that pairs effortlessly with both traditional and contemporary outfits.",
    details: [
      "Ankara exterior, satin lining",
      "Hand-beaded flap closure",
      "Removable gold chain strap",
      "Interior slip pocket",
    ],
    inStock: true,
    tag: "Sale",
  },
];

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "accessories", label: "Accessories" },
  { id: "prints", label: "Prints" },
] as const;

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export const PRICE_RANGES = [
  { id: "all", label: "All Prices" },
  { id: "under30", label: "Under ₦30,000" },
  { id: "30to60", label: "₦30,000 – ₦60,000" },
  { id: "over60", label: "Over ₦60,000" },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function formatPrice(price: number | null | undefined): string {
  if (price == null || isNaN(price)) return "₦0";
  return `₦${price.toLocaleString("en-NG")}`;
}

export function filterProducts(
  products: Product[],
  category: CategoryId,
  priceRange: PriceRangeId,
  sizes: string[],
  sort: string,
): Product[] {
  let result = [...products];

  if (category !== "all") {
    result = result.filter((p) => p.category === category);
  }

  if (priceRange === "under30") {
    result = result.filter((p) => p.price < 30000);
  } else if (priceRange === "30to60") {
    result = result.filter((p) => p.price >= 30000 && p.price <= 60000);
  } else if (priceRange === "over60") {
    result = result.filter((p) => p.price > 60000);
  }

  if (sizes.length > 0) {
    result = result.filter((p) => sizes.some((s) => p.sizes.includes(s)));
  }

  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}
