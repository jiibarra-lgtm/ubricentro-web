// api/sitemap.js — Vercel Serverless Function
// Se genera solicitando los servicios activos a Supabase, así el sitemap
// nunca queda desactualizado cuando se agrega o saca un servicio.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const DOMINIO = process.env.SITE_URL || "https://ubricentro-web.vercel.app";

export default async function handler(req, res) {
  const { data: servicios } = await supabase
    .from("servicios")
    .select("slug")
    .eq("activo", true);

  const urlsEstaticas = [
    "",
    "/servicios.html",
    "/resenas.html",
    "/nosotros.html",
    "/turno.html",
    "/como-medir-el-aceite.html",
    "/cuando-cambiar-el-aceite.html",
    "/mitos-y-verdades-aceite.html",
  ];
  const urlsServicios = (servicios || []).map((s) => `/servicios/${s.slug}`);
  const todas = [...urlsEstaticas, ...urlsServicios];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${todas.map((u) => `  <url><loc>${DOMINIO}${u}</loc></url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
