
const SUPABASE_URL = "https://hnoihvskvrrsexmlelkb.supabase.co";
const SUPABASE_KEY = "sb_publishable_wHaB1q0aObePTLAo7yxwaQ_96IhnTm1";

if (!window.supabase) {
    throw new Error("Supabase SDK не загружен!");
}

window.connectSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
