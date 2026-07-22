import { Currency, Expense, Person } from "./types";

export interface CurrencyStats {
  currency: Currency;
  total: number;
  spentBy: Record<Person, number>;
  // Positiver Wert: Paul schuldet Carl. Negativer Wert: Carl schuldet Paul.
  carlNet: number;
}

/**
 * Berechnet pro Währung, wie viel jeder ausgegeben hat und wer wem was schuldet.
 *
 * Aufteilungs-Logik je Ausgabe (Betrag a, bezahlt von p):
 *  - split "both": die jeweils andere Person schuldet p die Hälfte (a/2).
 *  - split = andere Person: diese Person schuldet p den vollen Betrag a.
 *  - split = Zahler selbst: keine Schuld (war nur für ihn/sie).
 */
export function computeStats(expenses: Expense[]): Record<Currency, CurrencyStats> {
  const make = (currency: Currency): CurrencyStats => ({
    currency,
    total: 0,
    spentBy: { Carl: 0, Paul: 0 },
    carlNet: 0,
  });

  const stats: Record<Currency, CurrencyStats> = {
    EUR: make("EUR"),
    CHF: make("CHF"),
  };

  for (const e of expenses) {
    const s = stats[e.currency];
    if (!s) continue;
    const amount = Number(e.amount) || 0;
    s.total += amount;
    s.spentBy[e.paid_by] += amount;

    const other: Person = e.paid_by === "Carl" ? "Paul" : "Carl";

    let debtor: Person | null = null;
    let owed = 0;
    if (e.split_for === "both") {
      debtor = other;
      owed = amount / 2;
    } else if (e.split_for === other) {
      debtor = other;
      owed = amount;
    } // split_for === paid_by -> keine Schuld

    if (debtor) {
      // owed geht an den Zahler (Gläubiger)
      if (e.paid_by === "Carl") s.carlNet += owed; // Paul schuldet Carl
      else s.carlNet -= owed; // Carl schuldet Paul
    }
  }

  return stats;
}

export interface Settlement {
  currency: Currency;
  from: Person;
  to: Person;
  amount: number;
}

export function settlementFor(stats: CurrencyStats): Settlement | null {
  const net = Math.round(stats.carlNet * 100) / 100;
  if (Math.abs(net) < 0.005) return null;
  if (net > 0) return { currency: stats.currency, from: "Paul", to: "Carl", amount: net };
  return { currency: stats.currency, from: "Carl", to: "Paul", amount: -net };
}
