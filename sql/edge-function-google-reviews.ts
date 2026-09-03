// supabase/functions/google-reviews/index.ts
// Cachea las reviews en la tabla reviews_cache por 12hs para no consumir
// la cuota de Google Places en cada visita a la página.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const PLACE_ID = Deno.env.get("GOOGLE_PLACE_ID")!;
const CACHE_HORAS = 12;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: cache } = await supabase
    .from("reviews_cache")
    .select("data, updated_at")
    .eq("google_place_id", PLACE_ID)
    .maybeSingle();

  const cacheVigente =
    cache && Date.now() - new Date(cache.updated_at).getTime() < CACHE_HORAS * 60 * 60 * 1000;

  if (cacheVigente) {
    return Response.json(cache.data);
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,reviews&language=es&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  const payload = {
    rating: json.result?.rating ?? 0,
    total: json.result?.user_ratings_total ?? 0,
    reviews: json.result?.reviews ?? [],
  };

  await supabase
    .from("reviews_cache")
    .upsert({ google_place_id: PLACE_ID, data: payload, updated_at: new Date().toISOString() });

  return Response.json(payload);
});
