import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateTicketPdf } from "@/lib/pdf";
import { t } from "@/lib/translations";

const API_BASE = "https://api.whop.com/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { membership_id, locale = "es" } = body;

  if (!membership_id) {
    return NextResponse.json({ error: "membership_id is required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_BASE}/memberships/${membership_id}`, {
      headers: { Authorization: `Bearer ${process.env.WHOP_API_KEY}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const data = await res.json();
    const user = data.user as Record<string, string> | undefined;
    const product = data.product as Record<string, string> | undefined;
    const email = user?.email || "";
    const plan = product?.title || "General Admission";

    if (!email) {
      return NextResponse.json({ error: "No email on membership" }, { status: 400 });
    }

    const pdfBytes = await generateTicketPdf({
      membershipId: data.id as string,
      email,
      plan,
      createdAt: data.created_at as string,
      locale,
    });

    const resend = new Resend(resendKey);
    const senderEmail = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";

    const { error: sendError } = await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: `${t("email.subject", locale)} — ${plan}`,
      text: t("email.body", locale),
      attachments: [
        {
          filename: `ticket-${membership_id}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send ticket error:", err);
    return NextResponse.json({ error: "Failed to send ticket" }, { status: 500 });
  }
}
