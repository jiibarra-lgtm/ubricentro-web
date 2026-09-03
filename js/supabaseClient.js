import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://xjzewiglqjfksxbaoxdp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqemV3aWdscWpma3N4YmFveGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTc0ODIsImV4cCI6MjEwMzk3MzQ4Mn0.ZiTvdCSXX7OoFAed9ignzYdCSK67Wh2bMyGKwtAbM4Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
