import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "fs/promises";
import { join } from "path";
import { t, type Locale } from "./translations";

export interface TicketPdfData {
  membershipId: string;
  email: string;
  plan: string;
  createdAt: string;
  locale: Locale;
}

export async function generateTicketPdf(data: TicketPdfData): Promise<Uint8Array> {
  const { membershipId, email, plan, createdAt, locale } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 650]);
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const darkColor = rgb(0.09, 0.09, 0.09);
  const grayColor = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.85, 0.85, 0.85);

  // DiekPower logo
  const logoPath = join(process.cwd(), "public", "diekpower-hero.jpg");
  const logoBytes = await readFile(logoPath);
  const logoImage = await pdfDoc.embedJpg(logoBytes);
  const logoSize = 50;
  const logoX = (width - logoSize) / 2;
  const logoY = height - 65;
  page.drawImage(logoImage, {
    x: logoX,
    y: logoY,
    width: logoSize,
    height: logoSize,
  });

  // DiekPower brand name
  const brandName = "DiekPower";
  const brandWidth = helveticaBold.widthOfTextAtSize(brandName, 16);
  page.drawText(brandName, {
    x: (width - brandWidth) / 2,
    y: logoY - 18,
    size: 16,
    font: helveticaBold,
    color: darkColor,
  });

  // Header label
  const headerLabel = t("pdf.ticket", locale);
  const headerWidth = helveticaBold.widthOfTextAtSize(headerLabel, 12);
  page.drawText(headerLabel, {
    x: (width - headerWidth) / 2,
    y: height - 105,
    size: 12,
    font: helveticaBold,
    color: grayColor,
  });

  // Plan name
  const planWidth = helveticaBold.widthOfTextAtSize(plan, 24);
  page.drawText(plan, {
    x: (width - planWidth) / 2,
    y: height - 135,
    size: 24,
    font: helveticaBold,
    color: darkColor,
  });

  // QR Code
  const qrDataUrl = await QRCode.toDataURL(membershipId, {
    width: 240,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrImageBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0));
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  const qrSize = 220;
  page.drawImage(qrImage, {
    x: (width - qrSize) / 2,
    y: height - 375,
    width: qrSize,
    height: qrSize,
  });

  // Divider line
  const lineY = height - 400;
  page.drawLine({
    start: { x: 60, y: lineY },
    end: { x: width - 60, y: lineY },
    thickness: 1,
    color: lightGray,
  });

  // Email
  const emailLabel = t("pdf.email", locale);
  page.drawText(emailLabel, {
    x: 60,
    y: lineY - 30,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  page.drawText(email, {
    x: 60,
    y: lineY - 46,
    size: 13,
    font: helveticaBold,
    color: darkColor,
  });

  // Purchase date
  const dateLabel = t("pdf.purchaseDate", locale);
  const dateLocaleStr = locale === "es" ? "es-ES" : "en-US";
  const formattedDate = new Date(createdAt).toLocaleDateString(dateLocaleStr, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  page.drawText(dateLabel, {
    x: 60,
    y: lineY - 80,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  page.drawText(formattedDate, {
    x: 60,
    y: lineY - 96,
    size: 13,
    font: helveticaBold,
    color: darkColor,
  });

  // Footer branding
  const footerBrand = "DiekPower";
  const footerBrandWidth = helveticaBold.widthOfTextAtSize(footerBrand, 10);
  page.drawText(footerBrand, {
    x: (width - footerBrandWidth) / 2,
    y: 50,
    size: 10,
    font: helveticaBold,
    color: lightGray,
  });

  // Footer instruction
  const footerText = t("pdf.qrInstruction", locale);
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 9);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 30,
    size: 9,
    font: helvetica,
    color: grayColor,
  });

  return pdfDoc.save();
}
