// ------------------ Utils ------------------

// ambiguous keywords that could belong to multiple categories, this will get flagged and user will need to review
export const AMBIGUOUS_KEYWORDS = [
  "paypal",
  "venmo",
  "cash app",
  "zelle",
  "7-eleven",
  "restaurant",
  "coffee",
  "entertainment",
  "amazon",
];

// keywords mapped to categories
export const CATEGORY_KEYWORDS: Record<string, string> = {
  education: "Student Loans",
  investment: "Investments",
  deposit: "Monthly Savings",
  housing: "Rent & Utilities",
  nebu: "Takeout",
  gas: "Transportation",
  uber: "Transportation",
  shopping: "Life & Extras",
  gambling: "Life & Extras",
  chipotle: "Takeout",
  "chick-fil-a": "Takeout",
  "raising cane's": "Takeout",
  subway: "Takeout",
  popeye: "Takeout",
  "mo bettahs": "Takeout",
  games: "Hobbies",
  books: "Hobbies",
  music: "Hobbies",
};

export const categories = [
  { name: "Investments", color: "var(--chart-1)" },
  { name: "Rent & Utilities", color: "var(--chart-2)" },
  { name: "Groceries", color: "var(--chart-3)" },
  { name: "Student Loans", color: "var(--chart-4)" },
  { name: "Dates", color: "var(--chart-5)" },
  { name: "Family", color: "var(--chart-6)" },
  { name: "Life & Extras", color: "var(--chart-7)" },
  { name: "Hobbies", color: "var(--chart-8)" },
  { name: "Takeout", color: "var(--chart-9)" },
  { name: "Transportation", color: "var(--chart-10)" },
  { name: "Monthly Savings", color: "var(--chart-11)" },
  { name: "House Savings", color: "var(--chart-12)" },
  { name: "Jazmin Purchases", color: "var(--chart-111)" },
];

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Loads a value from localStorage with type safety and fallback support.
 * @template T - The type of the value to load and return
 * @param key - The localStorage key to retrieve
 * @param fallback - The default value to return if the key doesn't exist or parsing fails
 * @returns The parsed value from localStorage, or the fallback value if the key is not found
 */
export function loadLS<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

/**
 * Determines if a transaction description contains ambiguous keywords.
 * @param desc - The transaction description to check for ambiguity
 * @returns `true` if the description contains any ambiguous keywords, `false` otherwise
 */
export function isAmbiguous(desc: string) {
  const text = desc.toLowerCase();
  // console.log("Checking ambiguity for:", text);
  return AMBIGUOUS_KEYWORDS.some((k) => text.includes(k));
}
/**
 * Categorizes a transaction description based on predefined keywords.
 * @param desc - The transaction description to categorize
 * @returns The category name if a keyword match is found, otherwise "Uncategorized"
 */
export function categorizeTransaction(desc: string): string {
  const text = desc.toLowerCase();
  for (const keyword in CATEGORY_KEYWORDS) {
    if (text.includes(keyword)) return CATEGORY_KEYWORDS[keyword];
  }
  return "Uncategorized";
}

/**
 * Determines if a transaction should be ignored based on its description and category.
 * @param description - The transaction description
 * @param category - The transaction category
 * @returns `true` if the transaction should be ignored, `false` otherwise
 */
export function shouldIgnoreTransaction(description: string, category: string) {
  if (category === "Wages") return true;
  if (description.toLowerCase().includes("transfer to")) return true;
  if (description.toLowerCase().includes("transfer from")) return true;

  return false;
}
