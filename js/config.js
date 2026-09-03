// Config del negocio. Todo lo que cambia negocio por negocio va acá adentro,
// nada de esto debería aparecer pisado en el resto del código.

export const NEGOCIO = {
  nombre: "Lubricentro", // completar
  telefono: "5491100000000", // formato para wa.me, sin + ni espacios
  direccion: "",
  googlePlaceId: "", // ChIJ..., se usa en reviews.js para traer las reseñas
  instagram: "",
  colorPrimario: "#1e3a5f",
  colorAcento: "#f2a900",

  horarios: [
    { dia: "Lunes a viernes", desde: "08:30", hasta: "18:30" },
    { dia: "Sábados", desde: "09:00", hasta: "13:00" },
  ],

  duracionTurnoDefault: 30, // minutos, se puede overridear por servicio
};

// Los servicios ahora viven en Supabase (tabla `servicios`), esto queda
// solo como fallback por si la consulta falla y no queremos que la página
// quede en blanco.
export const SERVICIOS_FALLBACK = [
  { nombre: "Cambio de aceite", duracion_min: 30 },
];
