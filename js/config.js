// Config del negocio. Todo lo que cambia negocio por negocio va acá adentro,
// nada de esto debería aparecer pisado en el resto del código.

export const NEGOCIO = {
  nombre: "Lubricentro MP",
  telefono: "541151656144", // 011 5165-6144 → si no engancha por WhatsApp, probar con "5491151656144" (con el 9 de celular)
  direccion: "Av. Juan Bautista Justo 3557, CABA",
  googlePlaceId: "", // pendiente: sacarlo desde el buscador de Place ID de Google
  instagram: "",
  colorPrimario: "#1e3a5f",
  colorAcento: "#f2a900",

  horarios: [
    { dia: "Lunes a viernes", desde: "08:30", hasta: "18:30" },
    { dia: "Sábados", desde: "09:00", hasta: "13:00" },
  ],

  duracionTurnoDefault: 30, // minutos, se puede overridear por servicio
};

// --- DATOS DE PRUEBA PARA EL BOCETO ---
// Todo lo de acá para abajo se usa SOLO cuando Supabase todavía no está
// conectado (o falla la consulta), para que la página se vea completa
// mientras armamos la base real. Una vez que Supabase esté andando con
// datos reales, esto deja de usarse solo, no hay que borrarlo a mano.

export const SERVICIOS_FALLBACK = [
  {
    id: "demo-1",
    slug: "cambio-de-aceite",
    nombre: "Cambio de aceite",
    descripcion: "Aceite + filtro, revisión de niveles incluida.",
    duracion_min: 30,
    precio: 25000,
  },
  {
    id: "demo-2",
    slug: "cambio-de-filtros",
    nombre: "Cambio de filtros",
    descripcion: "Filtro de aire, aceite y habitáculo.",
    duracion_min: 25,
    precio: 18000,
  },
  {
    id: "demo-3",
    slug: "alineacion-y-balanceo",
    nombre: "Alineación y balanceo",
    descripcion: "Con equipo computarizado, incluye control de suspensión.",
    duracion_min: 45,
    precio: 32000,
  },
  {
    id: "demo-4",
    slug: "revision-de-frenos",
    nombre: "Revisión de frenos",
    descripcion: "Chequeo de pastillas, discos y líquido de frenos.",
    duracion_min: 30,
    precio: 15000,
  },
];

export const REVIEWS_FALLBACK = {
  rating: 5.0, // dato real de Google (41 reseñas), esto se puede pisar ya
  total: 41,
  reviews: [
    // el texto de las reseñas todavía es de prueba — cuando conectemos la
    // Edge Function con el Place ID real, esto se reemplaza solo por las
    // reseñas de verdad
    { author_name: "Martín G.", rating: 5, text: "Rapidísimo y muy prolijos, te explican todo antes de hacerlo." },
    { author_name: "Ceci R.", rating: 5, text: "Excelente atención, ya es mi lubricentro de siempre." },
    { author_name: "Fede A.", rating: 5, text: "Buen precio y buena onda, volvería sin dudar." },
    { author_name: "Lucía P.", rating: 5, text: "Me avisaron por WhatsApp cuando estaba listo, muy cómodo." },
    { author_name: "Nico D.", rating: 5, text: "Turno online súper fácil de sacar, sin vueltas." },
    { author_name: "Vero S.", rating: 5, text: "Todo bien, tardaron un poco más de lo esperado pero el trabajo quedó bien." },
  ],
};

// Fotos de stock solo para maquetar (picsum genera una imagen distinta por
// "seed"). Reemplazar por fotos reales del taller antes de publicar.
export const FOTOS_FALLBACK = [
  { url: "https://picsum.photos/seed/taller1/500/400", categoria: "Elevador y zona de trabajo" },
  { url: "https://picsum.photos/seed/taller2/500/400", categoria: "Cambio de aceite en curso" },
  { url: "https://picsum.photos/seed/taller3/500/400", categoria: "Frente del local" },
  { url: "https://picsum.photos/seed/taller4/500/400", categoria: "Herramientas y equipo" },
  { url: "https://picsum.photos/seed/taller5/500/400", categoria: "Sala de espera" },
  { url: "https://picsum.photos/seed/taller6/500/400", categoria: "Equipo de trabajo" },
];

// Imagen de fondo del hero y del popup de cotización (ya es una foto real
// subida al bucket, no una de stock).
export const HERO_IMAGEN_FALLBACK = "https://klqlmmnwzouwznfpbvfm.supabase.co/storage/v1/object/public/galeria/ChatGPT%20Image%203%20sept%202026,%2012_12_58%20a.m..png";
