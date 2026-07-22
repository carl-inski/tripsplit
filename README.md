# TripSplit · Tour de France 🚴‍♂️

Ausgaben-Tracker für **Carl & Paul** auf der Reise zur Tour de France.
Unterstützt **Euro (€)** und **Schweizer Franken (CHF)**, funktioniert auf **Web & Mobil**,
sieht aus wie eine Apple-App (Liquid Glass) und synchronisiert in **Echtzeit**.

## Tech-Stack
- **Next.js 15** (App Router, React 19, TypeScript)
- **Supabase** – Postgres-Datenbank + Realtime
- **Vercel** – Hosting
- Handgeschriebenes Liquid-Glass-Design (CSS `backdrop-filter`), PWA-fähig

## Features
- Ausgaben in EUR **und** CHF erfassen
- Aufteilung pro Ausgabe: 50/50 geteilt oder nur für eine Person
- Automatischer Ausgleich („wer schuldet wem“) – pro Währung getrennt
- Optionale Zusammenfassung in EUR mit einstellbarem Wechselkurs
- Echtzeit-Sync: neue Ausgaben erscheinen sofort auf allen Geräten
- „Ich bin Carl/Paul“-Umschalter (lokal gespeichert)
- Als App zum Home-Bildschirm hinzufügbar (iOS/Android)

## Lokal starten
```bash
npm install
npm run dev
```
Die Supabase-Zugangsdaten sind als Fallback fest hinterlegt (öffentlicher anon-Key).
Optional per `.env.local` überschreibbar – siehe `.env.example`.

## Datenbank
Das Schema liegt in `supabase/migrations/0001_create_expenses.sql`.
Eine Tabelle `expenses` mit offener RLS (private Zwei-Personen-App) und aktiviertem Realtime.

## Deployment
Automatisch über Vercel (Framework: Next.js). Kein Extra-Setup nötig.
