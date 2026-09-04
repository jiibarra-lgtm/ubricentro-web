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
- Login con email + contraseña real de Supabase Auth — para dar acceso a más de una persona, creá un usuario nuevo por cada una en Supabase → Authentication → Users
- **Turnos**: vista lista o semanal, cargar turnos manuales (atajo: tecla `n`), marcar completado (pide mecánico y km, arma el historial del vehículo solo), cancelar, exportar a CSV
- **Clientes**: buscador por patente o teléfono, historial de services por vehículo, alerta si hace 6+ meses que no viene, notas internas editables
- **Servicios y precios**: alta/baja/edición, guarda automáticamente el historial de cambios de precio en `precios_historial`
- **Papelera**: los servicios borrados se pueden restaurar, no se pierden para siempre
- **Fotos**: subida directa al bucket `galeria`, categorización, borrado
- **Dashboard**: turnos del mes, ingresos estimados, gráfico de servicios más pedidos y de ocupación por horario
- Botón de modo oscuro (🌙) arriba a la derecha, se recuerda entre sesiones

## Pendiente para las próximas fases
- Admin panel (turnos, clientes, analíticas)
- PWA + push notifications
- Historial por vehículo y alertas de km
- Ticket digital / fidelización
- Blog de tips técnicos (contenido SEO a mediano plazo)
- Google Search Console + GA4 conectados
