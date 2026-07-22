import { createClient } from "@supabase/supabase-js";

// Öffentliche Werte (anon key ist bewusst clientseitig – so von Supabase vorgesehen).
// Fallback ist fest hinterlegt, damit die App auch ohne gesetzte Env-Variablen läuft.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://silhmbzllxtndykuhjbw.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbGhtYnpsbHh0bmR5a3VoamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MTI1MTQsImV4cCI6MjEwMDI4ODUxNH0.mY5zX4WZJzGrcvnS6rfrLGfbc-q9bFb8PWiAhaVFN-I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});
