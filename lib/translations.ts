export type Locale = "es" | "en";

const translations = {
  // Main page - email lookup form
  "ticket.title": {
    es: "Obtener Tu Entrada",
    en: "Get Your Ticket",
  },
  "ticket.subtitle": {
    es: "Ingresa el correo electrónico que usaste para comprar en Whop",
    en: "Enter the email you used to purchase on Whop",
  },
  "ticket.emailPlaceholder": {
    es: "tu@ejemplo.com",
    en: "you@example.com",
  },
  "ticket.findButton": {
    es: "Buscar Mi Entrada",
    en: "Find My Ticket",
  },
  "ticket.searching": {
    es: "Buscando...",
    en: "Looking up...",
  },
  "ticket.footerHint": {
    es: "¿Compraste en Whop? Encontraremos tu entrada.",
    en: "Purchased on Whop? We'll find your ticket.",
  },

  // Main page - ticket display
  "ticket.yourTicket": {
    es: "Tu Entrada",
    en: "Your Ticket",
  },
  "ticket.purchased": {
    es: "Comprado el",
    en: "Purchased",
  },
  "ticket.downloadPdf": {
    es: "Descargar PDF",
    en: "Download PDF",
  },
  "ticket.sendEmail": {
    es: "Enviar por Correo",
    en: "Send to Email",
  },
  "ticket.sendingEmail": {
    es: "Enviando...",
    en: "Sending...",
  },
  "ticket.emailSent": {
    es: "¡Entrada enviada a tu correo!",
    en: "Ticket sent to your email!",
  },
  "ticket.emailError": {
    es: "Error al enviar el correo. Intenta de nuevo.",
    en: "Failed to send email. Please try again.",
  },
  "ticket.showQr": {
    es: "Muestra este código QR en la puerta para entrar",
    en: "Show this QR code at the door for entry",
  },
  "ticket.downloading": {
    es: "Descargando...",
    en: "Downloading...",
  },

  // Admin page
  "admin.title": {
    es: "Escáner de Puerta",
    en: "Door Scanner",
  },
  "admin.toggleHint": {
    es: "Activa el modo admin para comenzar a escanear",
    en: "Toggle admin mode to start scanning",
  },
  "admin.cameraHint": {
    es: "Apunta la cámara al código QR de la entrada",
    en: "Point camera at a ticket QR code",
  },
  "admin.retry": {
    es: "Reintentar",
    en: "Retry",
  },
  "admin.scanNumber": {
    es: "Escaneo #",
    en: "Scan #",
  },
  "admin.scannedTimes": {
    es: "escaneos",
    en: "times",
  },
  "admin.scannedOnce": {
    es: "escaneo",
    en: "time",
  },
  "admin.tapToScan": {
    es: "Toca en cualquier lugar para escanear de nuevo",
    en: "Tap anywhere to scan again",
  },
  "admin.ticketNotFound": {
    es: "Entrada No Encontrada",
    en: "Ticket Not Found",
  },
  "admin.invalidTicket": {
    es: "Entrada Inválida",
    en: "Invalid Ticket",
  },

  // Navigation
  "nav.tickets": {
    es: "Entradas",
    en: "Tickets",
  },
  "nav.scanner": {
    es: "Escáner",
    en: "Scanner",
  },
  // Common
  "common.loading": {
    es: "Cargando...",
    en: "Loading...",
  },

  // PDF content
  "pdf.ticket": {
    es: "ENTRADA",
    en: "TICKET",
  },
  "pdf.email": {
    es: "Correo",
    en: "Email",
  },
  "pdf.purchaseDate": {
    es: "Fecha de compra",
    en: "Purchase date",
  },
  "pdf.qrInstruction": {
    es: "Muestra este código QR en la puerta para entrar",
    en: "Show this QR code at the door for entry",
  },

  // Email
  "email.subject": {
    es: "Tu Entrada",
    en: "Your Ticket",
  },
  "email.body": {
    es: "Adjuntamos tu entrada en formato PDF. Muestra el código QR en la puerta para entrar.",
    en: "Your ticket is attached as a PDF. Show the QR code at the door for entry.",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export default translations;
