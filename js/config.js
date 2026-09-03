// Config del negocio. Todo lo que cambia negocio por negocio va acá adentro,
// nada de esto debería aparecer pisado en el resto del código.

export const NEGOCIO = {
  nombre: "Lubricentro del Sur", // DATO DE PRUEBA — completar con el real
  telefono: "5491122334455", // DATO DE PRUEBA — formato para wa.me, sin + ni espacios
  direccion: "Av. Directorio 3200, Parque Avellaneda, CABA", // DATO DE PRUEBA
  googlePlaceId: "", // ChIJ..., se usa en reviews.js para traer las reseñas reales
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
  rating: 4.8,
  total: 132,
  reviews: [
    { author_name: "Martín G.", rating: 5, text: "Rapidísimo y muy prolijos, te explican todo antes de hacerlo." },
    { author_name: "Ceci R.", rating: 5, text: "Excelente atención, ya es mi lubricentro de siempre." },
    { author_name: "Fede A.", rating: 4, text: "Buen precio y buena onda, volvería sin dudar." },
    { author_name: "Lucía P.", rating: 5, text: "Me avisaron por WhatsApp cuando estaba listo, muy cómodo." },
    { author_name: "Nico D.", rating: 5, text: "Turno online súper fácil de sacar, sin vueltas." },
    { author_name: "Vero S.", rating: 4, text: "Todo bien, tardaron un poco más de lo esperado pero el trabajo quedó bien." },
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

// Imagen de fondo del hero (también de stock, mismo criterio que arriba).
export const HERO_IMAGEN_FALLBACK = "https://picsum.photos/seed/lubricentro-hero/1600/900";
