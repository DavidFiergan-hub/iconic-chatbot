// config/responses.js - Todas las respuestas predefinidas del bot Iconic
module.exports = {
  // Saludos
  greetings: {
    es: [
      "¡Hola! Soy el asistente virtual de Iconic Cirugía Plástica. ¿En qué puedo ayudarte hoy?",
      "¡Bienvenido/a a Iconic! Estoy aquí para asistirte. ¿Cómo puedo ayudarte?",
      "¡Hola! Gracias por contactar a Iconic. ¿En qué puedo orientarte?"
    ],
    options: [
      "📋 Ver servicios",
      "📅 Agendar consulta",
      "💲 Consultar precios",
      "👨‍⚕️ Conocer nuestros especialistas",
      "📍 Ubicación y horarios",
      "📞 Contacto directo"
    ]
  },

  // Servicios
  services: {
    title: "🌟 NUESTROS SERVICIOS PRINCIPALES 🌟",
    list: [
      "• 🎯 **Rinoplastia** - Corrección y armonización nasal",
      "• 👙 **Mamoplastia** - Aumento, reducción o elevación mamaria",
      "• 📏 **Liposucción** - Moldeamiento corporal",
      "• 👁️ **Blefaroplastia** - Cirugía de párpados",
      "• 🤰 **Abdominoplastia** - Cirugía abdominal",
      "• 💉 **Tratamientos no invasivos**: Botox, Rellenos, Láser",
      "• 🧴 **Medicina Estética** avanzada"
    ],
    note: "Cada procedimiento es personalizado según tus necesidades. ¿Te gustaría agendar una consulta para evaluar tu caso?"
  },

  // Especialistas
  specialists: {
    title: "👨‍⚕️ NUESTRO EQUIPO MÉDICO 👩‍⚕️",
    team: [
      {
        name: "Dr. Alejandro Rodríguez",
        specialty: "Cirujano Plástico - Director Médico",
        experience: "15 años de experiencia",
        certification: "Certificado por la Sociedad Mexicana de Cirugía Plástica"
      },
      {
        name: "Dra. María González",
        specialty: "Cirugía Estética Facial y Corporal",
        experience: "12 años de experiencia",
        certification: "Miembro de ISAPS"
      },
      {
        name: "Dr. Carlos Martínez",
        specialty: "Microcirugía y Reconstructiva",
        experience: "10 años de experiencia",
        certification: "Fellowship en Harvard Medical School"
      }
    ]
  },

  // Precios
  pricing: {
    disclaimer: "💰 **INFORMACIÓN DE COSTOS**\n\nLos precios varían según:\n• Procedimiento específico\n• Complejidad del caso\n• Anestesia requerida\n• Hospitalización\n\nTe recomendamos agendar una consulta de valoración gratuita para recibir un presupuesto personalizado.\n\n💡 *Financiamiento disponible*"
  },

  // Ubicación y contacto
  location: {
    address: "🏥 **Iconic Cirugía Plástica**\nAv. Paseo de la Reforma 505, Col. Cuauhtémoc\nCiudad de México, CDMX 06500",
    hours: {
      weekdays: "Lunes a Viernes: 9:00 AM - 7:00 PM",
      saturday: "Sábados: 9:00 AM - 2:00 PM",
      sunday: "Domingos: Cerrado"
    },
    contact: "📞 Teléfono: (55) 1234-5678\n📧 Email: info@iconicplastica.com\n🌐 Web: www.iconicplastica.com"
  },

  // Agendamiento
  appointment: {
    steps: [
      "1️⃣ **Paso 1**: Necesitamos algunos datos para tu consulta",
      "2️⃣ **Paso 2**: ¿Qué servicio te interesa?",
      "3️⃣ **Paso 3**: Selecciona fecha y hora disponible",
      "4️⃣ **Paso 4**: Confirmación y preparación"
    ],
    questions: [
      "¿Cuál es tu nombre completo?",
      "¿Tu edad?",
      "¿Número de teléfono?",
      "¿Correo electrónico?",
      "¿Qué procedimiento te interesa?",
      "¿Prefieres consulta presional o virtual?"
    ]
  },

  // Preguntas frecuentes (FAQ)
  autoResponses: {
    thanks: "¡Gracias por tu mensaje! Un asesor se pondrá en contacto contigo en breve.",
    faq: {
      "¿Cuánto tiempo dura la recuperación?": "El tiempo varía:\n• Cirugías menores: 1-2 semanas\n• Cirugías mayores: 4-6 semanas\n• No invasivos: 1-3 días",
      "¿Es doloroso?": "Usamos técnicas avanzadas. El dolor postoperatorio es manejable con medicación.",
      "¿Qué garantías ofrecen?": "Ofrecemos garantía de resultados y seguimiento postoperatorio por 1 año.",
      "¿Tienen financiamiento?": "Sí, planes de financiamiento a meses sin intereses.",
      "¿Requiere hospitalización?": "Depende del procedimiento. Algunos son ambulatorios."
    }
  }
};