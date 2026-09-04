// Config del negocio. Todo lo que cambia negocio por negocio va acá adentro,
// nada de esto debería aparecer pisado en el resto del código.

export const NEGOCIO = {
  nombre: "Lubricentro MP",
  telefono: "541151656144", // 011 5165-6144 → si no engancha por WhatsApp, probar con "5491151656144" (con el 9 de celular)
  direccion: "Av. Juan Bautista Justo 3557, Villa del Parque, CABA",
  googlePlaceId: "", // pendiente: sacarlo desde el buscador de Place ID de Google
  instagram: "",
  colorPrimario: "#1e3a5f",
  colorAcento: "#f2a900",

  horarios: [
    { dia: "Lunes a viernes", desde: "08:30", hasta: "18:30" },
    { dia: "Sábados", desde: "09:00", hasta: "13:00" },
  ],

  duracionTurnoDefault: 30, // minutos, se puede overridear por servicio
  aniosEnMercado: 5, // DATO DE PRUEBA — completar con los años reales del negocio

  // marcas de aceite/lubricantes con las que trabaja el negocio (líderes del mercado)
  marcas: ["Elaion", "Castrol", "Shell", "Total", "Motul", "YPF", "Valvoline", "Mobil 1"],

  // aditivos para motor conocidos que también se ofrecen/aplican
  aditivos: ["Liqui Moly", "STP", "Bardahl", "Wynn's"],
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
  rating: 5.0, // dato real de Google (41 reseñas)
  total: 41,
  reviews: [
    { author_name: "Dario Fernandez", rating: 5, text: "Excelente atención no solo telefónica sino también en persona, fui a hacer un cambio de aceite y filtros y todo joya, hasta me dieron factura. Muy recomendable." },
    { author_name: "Emiliano Rodriguez", rating: 5, text: "Siempre que puedo lo llevo ahí, me atienden muy bien y se fijan en detalles extra que otros capaz pasan por alto. También limpian el motor y la zona del aceite. 100% recomendable." },
    { author_name: "Brian Levin", rating: 5, text: "Un fenómeno Néstor. Te atiende de lujo. Cambio de aceite y filtro de diez. Muy buena atención y precios." },
    { author_name: "Nicolas Ramis", rating: 5, text: "El mejor lubricentro al que fui. Lugar muy amplio, lleno de productos, gran variedad. Hacen servicios a camiones también." },
    { author_name: "María del Carmen Colque Jimenez", rating: 5, text: "Honestidad, calidad y calidez. Quedó re lindo el motor del auto, gracias." },
    { author_name: "Anu", rating: 5, text: "Excelente servicio, super recomendable y honesto." },
    { author_name: "Gonzalo Martinez Lalis", rating: 5, text: "Muy buena atención. Además me limpiaron el motor y lo dejaron impecable." },
    { author_name: "Joaquin Rodriguez", rating: 5, text: "Excelente atención, muy amables y muy buenos precios. Totalmente recomendable." },
    { author_name: "Adrian Salvatierra", rating: 5, text: "Buenos precios, buena atención, hice cambio de aceite y de caja. Vuelvo seguro." },
    { author_name: "Claudio Moya", rating: 5, text: "Siempre excelente atención y buenos precios." },
    { author_name: "Leoncio Guanuco", rating: 5, text: "Buena atención al cliente, rapidez, y preguntan todo para hacer bien el trabajo. Volvería sin dudas." },
    { author_name: "Adriana Villarreal", rating: 5, text: "Excelente atención y trabajo realizado, fui por cambio de aceite y filtros, y hasta el motor dejaron impecable. Recomiendo al 100%." },
    { author_name: "Alejandro Figueroa", rating: 5, text: "Lo recomiendo, son rápidos y se nota que la tienen clara. Sin dudas vuelvo a cambiar el aceite y filtros." },
    { author_name: "Maria de los Angeles Castaño", rating: 5, text: "Hace dos años que vamos porque es totalmente recomendable en la atención y en los precios. También te limpian el motor." },
    { author_name: "Max Fer", rating: 5, text: "Hace 4 años que llevo el auto a hacer cambio de aceite y filtro. Te atienden con la mejor amabilidad y hacen un excelente laburo." },
    { author_name: "Gustavo Casasola", rating: 5, text: "Excelente trato y profesionalismo. Recomendable por donde se lo mire, variedad, buenos precios y eficiencia." },
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
