import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://klqlmmnwzouwznfpbvfm.supabase.co"; // pegar la url del proyecto
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscWxtbW53em91d3puZnBidmZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM5NzMyOSwiZXhwIjoyMTAzOTczMzI5fQ.zVNhexQ-LLPEso5YS6cV5DmUQon6bkudgUfHT80nraE"; // anon key, no la service_role

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
