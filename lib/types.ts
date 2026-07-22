export type Person = "Carl" | "Paul";
export type Currency = "EUR" | "CHF";
export type SplitFor = "both" | "Carl" | "Paul";

export interface Expense {
  id: string;
  created_at: string;
  spent_on: string;
  description: string;
  amount: number;
  currency: Currency;
  paid_by: Person;
  split_for: SplitFor;
  category: string;
}

export type NewExpense = Omit<Expense, "id" | "created_at">;

export const PEOPLE: Person[] = ["Carl", "Paul"];
export const CURRENCIES: Currency[] = ["EUR", "CHF"];

export const CATEGORIES = [
  "Tickets",
  "Unterkunft",
  "Essen & Trinken",
  "Transport",
  "Sprit",
  "Einkauf",
  "Sonstiges",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Tickets: "🎫",
  Unterkunft: "🏨",
  "Essen & Trinken": "🍽️",
  Transport: "🚆",
  Sprit: "⛽️",
  Einkauf: "🛍️",
  Sonstiges: "✨",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  CHF: "CHF",
};

export function formatMoney(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return currency === "EUR" ? `${formatted} €` : `${formatted} CHF`;
}
