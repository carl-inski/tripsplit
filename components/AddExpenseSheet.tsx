"use client";

import { useEffect, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  Currency,
  NewExpense,
  Person,
  SplitFor,
} from "@/lib/types";

interface Props {
  me: Person;
  onClose: () => void;
  onSave: (e: NewExpense) => Promise<void>;
}

export default function AddExpenseSheet({ me, onClose, onSave }: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [paidBy, setPaidBy] = useState<Person>(me);
  const [splitFor, setSplitFor] = useState<SplitFor>("both");
  const [category, setCategory] = useState<string>("Essen & Trinken");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Scrollen des Hintergrunds sperren, solange das Sheet offen ist
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const parsed = parseFloat(amount.replace(",", "."));
  const valid = !isNaN(parsed) && parsed > 0 && description.trim().length > 0;

  async function handleSave() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        amount: Math.round(parsed * 100) / 100,
        description: description.trim(),
        currency,
        paid_by: paidBy,
        split_for: splitFor,
        category,
        spent_on: new Date().toISOString().slice(0, 10),
      });
      onClose();
    } catch {
      setSaving(false);
    }
  }

  const other: Person = paidBy === "Carl" ? "Paul" : "Carl";

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>Neue Ausgabe</h2>

        <div className="field">
          <label>Betrag</label>
          <div className="amount-row">
            <input
              className="input"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="segment" style={{ width: 140 }}>
              {(["EUR", "CHF"] as Currency[]).map((c) => (
                <button
                  key={c}
                  className={currency === c ? "active" : ""}
                  onClick={() => setCurrency(c)}
                >
                  {c === "EUR" ? "€ EUR" : "CHF"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label>Wofür?</label>
          <input
            className="input"
            placeholder="z. B. Tankfüllung, Hotel Grenoble …"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Kategorie</label>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`cat-chip ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                <span className="em">{CATEGORY_ICONS[c]}</span>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Bezahlt von</label>
          <div className="segment">
            {(["Carl", "Paul"] as Person[]).map((p) => (
              <button
                key={p}
                className={`${paidBy === p ? "active " + (p === "Carl" ? "yellow" : "dark") : ""}`}
                onClick={() => setPaidBy(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Aufteilen</label>
          <div className="segment wrap">
            <button
              className={splitFor === "both" ? "active" : ""}
              onClick={() => setSplitFor("both")}
            >
              50 / 50 geteilt
            </button>
            <button
              className={splitFor === other ? "active" : ""}
              onClick={() => setSplitFor(other)}
            >
              Nur für {other}
            </button>
            <button
              className={splitFor === paidBy ? "active" : ""}
              onClick={() => setSplitFor(paidBy)}
            >
              Nur für {paidBy}
            </button>
          </div>
        </div>

        <button className="submit" disabled={!valid || saving} onClick={handleSave}>
          {saving ? "Speichern …" : "Ausgabe hinzufügen"}
        </button>
      </div>
    </div>
  );
}
