# Lubricentro — Fase 1

## Setup
1. Crear proyecto en Supabase, correr `sql/schema.sql` en el SQL editor.
2. Pegar URL + anon key en `js/supabaseClient.js`.
3. Completar `js/config.js` con los datos reales del negocio.
4. Cargar servicios desde el SQL editor o armar un admin después (Fase 2).
5. Para las reseñas: crear la edge function con `sql/edge-function-google-reviews.ts`,
   settear los secrets `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` en Supabase,
   y deployar con `supabase functions deploy google-reviews`.
6. Cargar fotos en un bucket público de Storage e insertar las URLs en `fotos_galeria`.
7. Deploy a Vercel, igual que los otros proyectos.

## SEO ya implementado
- Meta tags, canonical y schema.org (AutoRepair + AggregateRating + FAQPage + Service) armados dinámicamente desde `config.js` y Supabase — nada hardcodeado en el HTML
- URL limpia por servicio: `/servicios/[slug]` vía rewrite en `vercel.json`, apuntando a `servicio.html`
- `sitemap.xml` dinámico en `api/sitemap.js` (Vercel Serverless Function) — se arma solo con los servicios activos en la DB
- `robots.txt` en la raíz

### Antes de publicar con dominio propio, reemplazar
- `ubricentro-web.vercel.app` (dominio provisorio de Vercel) por el dominio real en `index.html`, `robots.txt`, `js/servicio-detalle.js`, `api/sitemap.js`, `nosotros.html`, `resenas.html`, `servicios.html`
- Variables de entorno en Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL`
- Cargar `slug` en cada fila de la tabla `servicios` (ej: `cambio-de-aceite`)

## Panel de administración
- Entrar a `/admin.html` (no está linkeado desde el sitio público, se accede por URL directa)
- Login: solo pide contraseña (el usuario `ibarrajuan0806@gmail.com` queda fijo internamente en `js/admin.js`)
- **Importante**: en Supabase → Authentication → Users, la contraseña de ese usuario tiene que estar seteada en `13221` (si la creaste con otra, entrá al usuario y cambiala desde ahí)
- Desde el panel: marcar turnos como completados/cancelados, crear/editar/borrar servicios y precios, subir/borrar fotos del taller

## Pendiente para las próximas fases
- Admin panel (turnos, clientes, analíticas)
- PWA + push notifications
- Historial por vehículo y alertas de km
- Ticket digital / fidelización
- Blog de tips técnicos (contenido SEO a mediano plazo)
- Google Search Console + GA4 conectados
