"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  CATEGORY_ICONS,
  Currency,
  CURRENCIES,
  Expense,
  formatMoney,
  NewExpense,
  Person,
} from "@/lib/types";
import { computeStats, settlementFor } from "@/lib/balances";
import AddExpenseSheet from "@/components/AddExpenseSheet";

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Gestern";
  if (diff < 7) return `vor ${diff} Tagen`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export default function Page() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [me, setMe] = useState<Person>("Carl");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [rate, setRate] = useState(1.05); // 1 CHF ≈ x EUR

  // Persistierte Einstellungen laden
  useEffect(() => {
    const savedMe = localStorage.getItem("tripsplit.me");
    if (savedMe === "Carl" || savedMe === "Paul") setMe(savedMe);
    const savedRate = parseFloat(localStorage.getItem("tripsplit.rate") ?? "");
    if (!isNaN(savedRate) && savedRate > 0) setRate(savedRate);
  }, []);

  const setMePersist = (p: Person) => {
    setMe(p);
    localStorage.setItem("tripsplit.me", p);
  };
  const setRatePersist = (r: number) => {
    setRate(r);
    localStorage.setItem("tripsplit.rate", String(r));
  };

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setExpenses(data as Expense[]);
    else if (error) setExpenses([]);
  }, []);

  // Initial laden + Realtime-Abo
  useEffect(() => {
    load();
    const channel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => load()
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const addExpense = async (e: NewExpense) => {
    // optimistisches Update
    const optimistic: Expense = {
      ...e,
      id: `tmp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => (prev ? [optimistic, ...prev] : [optimistic]));
    const { error } = await supabase.from("expenses").insert(e);
    if (error) {
      setExpenses((prev) => (prev ? prev.filter((x) => x.id !== optimistic.id) : prev));
      alert("Konnte nicht speichern: " + error.message);
      throw error;
    }
    load();
  };

  const removeExpense = async (id: string) => {
    if (!confirm("Diese Ausgabe löschen?")) return;
    setExpenses((prev) => (prev ? prev.filter((x) => x.id !== id) : prev));
    await supabase.from("expenses").delete().eq("id", id);
    load();
  };

  const stats = useMemo(() => computeStats(expenses ?? []), [expenses]);

  const activeCurrencies = useMemo(
    () => CURRENCIES.filter((c) => stats[c].total > 0),
    [stats]
  );

  // Kombinierter Ausgleich in EUR (CHF via Kurs umgerechnet)
  const combinedEur = useMemo(() => {
    const eur = settlementFor(stats.EUR);
    const chf = settlementFor(stats.CHF);
    let carlNetEur = stats.EUR.carlNet + stats.CHF.carlNet * rate;
    void eur;
    void chf;
    return Math.round(carlNetEur * 100) / 100;
  }, [stats, rate]);

  const settlements = CURRENCIES.map((c) => settlementFor(stats[c])).filter(Boolean);
  const bothActive = activeCurrencies.length > 1;

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <span className="eyebrow">Tour de France · Urlaubskasse</span>
          <h1>TripSplit</h1>
        </div>
        <button
          className="whoami"
          onClick={() => setMePersist(me === "Carl" ? "Paul" : "Carl")}
          title="Zwischen Carl & Paul wechseln"
        >
          <span>Ich bin</span>
          <b>{me}</b>
          <span className={`avatar ${me}`}>{me[0]}</span>
        </button>
      </header>

      {/* Ausgleich / Wer schuldet wem */}
      <section className="glass hero">
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div className="label">Aktueller Ausgleich</div>
          <span className={`live ${live ? "on" : ""}`}>
            <span className="beat" />
            {live ? "Live" : "Verbinde …"}
          </span>
        </div>

        {expenses === null ? (
          <div className="settle-flow" style={{ color: "var(--text-faint)" }}>
            Lade …
          </div>
        ) : settlements.length === 0 ? (
          <div className="all-even">
            <span>✓</span> Alles ausgeglichen – niemand schuldet was.
          </div>
        ) : (
          settlements.map((s) => (
            <div className="settle-row" key={s!.currency}>
              <div className="settle-flow">
                <span className={`avatar ${s!.from}`}>{s!.from[0]}</span>
                <span className="arrow">→</span>
                <span className={`avatar ${s!.to}`}>{s!.to[0]}</span>
                <span style={{ marginLeft: 4, color: "var(--text-dim)" }}>
                  {s!.from} an {s!.to}
                </span>
              </div>
              <div className="settle-amount pos">
                {formatMoney(s!.amount, s!.currency)}
              </div>
            </div>
          ))
        )}

        {bothActive && (
          <>
            <div className="combined">
              <span className="k">≈ zusammengefasst in Euro</span>
              <span className="v">
                {Math.abs(combinedEur) < 0.005
                  ? "ausgeglichen"
                  : combinedEur > 0
                  ? `Paul → Carl ${formatMoney(combinedEur, "EUR")}`
                  : `Carl → Paul ${formatMoney(-combinedEur, "EUR")}`}
              </span>
            </div>
            <div className="rate-row">
              <span>Kurs 1 CHF =</span>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRatePersist(parseFloat(e.target.value) || 0)}
              />
              <span>EUR</span>
            </div>
          </>
        )}
      </section>

      {/* Ausgaben pro Person / Summe */}
      {activeCurrencies.map((c) => (
        <div key={c} className="stat-grid">
          <div className="glass stat">
            <div className="k">Gesamt ausgegeben ({c})</div>
            <div className="v">{formatMoney(stats[c].total, c as Currency)}</div>
          </div>
          <div className="glass stat">
            <div className="k">Carl / Paul ({c})</div>
            <div className="v" style={{ fontSize: 16 }}>
              {formatMoney(stats[c].spentBy.Carl, c as Currency)}
              <br />
              <small>{formatMoney(stats[c].spentBy.Paul, c as Currency)}</small>
            </div>
          </div>
        </div>
      ))}

      {/* Ausgabenliste */}
      <div className="section-title">
        <span>Ausgaben</span>
        {expenses && expenses.length > 0 && <span>{expenses.length}</span>}
      </div>

      {expenses === null ? (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      ) : expenses.length === 0 ? (
        <div className="glass empty">
          <div className="big">🚴‍♂️</div>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            Noch keine Ausgaben
          </div>
          <div>Tippe auf +, um die erste Ausgabe einzutragen.</div>
        </div>
      ) : (
        <div className="expense-list">
          {expenses.map((e) => (
            <div className="glass expense" key={e.id}>
              <div className="icon">{CATEGORY_ICONS[e.category] ?? "✨"}</div>
              <div className="meta">
                <div className="desc">{e.description}</div>
                <div className="sub">
                  <span className="pill">
                    <span className={`dot ${e.paid_by}`} />
                    {e.paid_by}
                  </span>
                  <span>
                    {e.split_for === "both"
                      ? "geteilt"
                      : `nur ${e.split_for}`}
                  </span>
                  <span>· {relativeDate(e.spent_on ?? e.created_at)}</span>
                </div>
              </div>
              <div className="amt">
                <div className="num">
                  {new Intl.NumberFormat("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(e.amount))}
                </div>
                <div className="cur">{e.currency}</div>
              </div>
              <button
                className="swipe-delete"
                onClick={() => removeExpense(e.id)}
                aria-label="Löschen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setSheetOpen(true)} aria-label="Ausgabe hinzufügen">
        +
      </button>

      {sheetOpen && (
        <AddExpenseSheet me={me} onClose={() => setSheetOpen(false)} onSave={addExpense} />
      )}
    </div>
  );
}
