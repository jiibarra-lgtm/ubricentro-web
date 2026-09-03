import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = ""; // pegar la url del proyecto
const SUPABASE_ANON_KEY = ""; // anon key, no la service_role

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
