export const CATEGORIES = [
  "Electronics",
  "Wallet & ID",
  "Keys",
  "Bag & Luggage",
  "Clothing",
  "Jewelry",
  "Documents",
  "Books & Stationery",
  "Pet",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
