import { NEGOCIO } from "./config.js";
import { getServicios } from "./servicios.js";

export async function inyectarSchemaNegocio({ rating, total } = {}) {
  const servicios = await getServicios();

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: NEGOCIO.nombre,
    telephone: `+${NEGOCIO.telefono}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Juan Bautista Justo 3557",
      addressLocality: "Villa del Parque",
      addressRegion: "Ciudad Autónoma de Buenos Aires",
      addressCountry: "AR",
    },
    areaServed: [
      { "@type": "Place", name: "Villa del Parque, CABA" },
      { "@type": "Place", name: "Agronomía, CABA" },
      { "@type": "Place", name: "Villa Devoto, CABA" },
      { "@type": "Place", name: "Caballito, CABA" },
    ],
    openingHoursSpecification: NEGOCIO.horarios.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dia,
      opens: h.desde,
      closes: h.hasta,
    })),
    makesOffer: servicios.map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.nombre,
        description: s.descripcion || undefined,
      },
    })),
  };

  if (rating && total) {
    localBusiness.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount: total,
    };
  }

  const el = document.getElementById("schema-local-business");
  if (el) el.textContent = JSON.stringify(localBusiness);
}

export function inyectarSchemaFAQ(selectorDetails = ".faq details") {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...document.querySelectorAll(selectorDetails)].map((d) => ({
      "@type": "Question",
      name: d.querySelector("summary").textContent.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: d.querySelector("p").textContent.trim(),
      },
    })),
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(faqPage);
  document.head.appendChild(script);
}
