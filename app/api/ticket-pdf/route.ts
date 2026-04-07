import { NextRequest, NextResponse } from "next/server";
import { generateTicketPdf } from "@/lib/pdf";

const API_BASE = "https://api.whop.com/api/v1";

export async function GET(request: NextRequest) {
  const membershipId = request.nextUrl.searchParams.get("membership_id");
  const locale = (request.nextUrl.searchParams.get("locale") as "es" | "en") || "es";

  if (!membershipId) {
    return NextResponse.json({ error: "membership_id is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/memberships/${membershipId}`, {
      headers: { Authorization: `Bearer ${process.env.WHOP_API_KEY}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const data = await res.json();
    const user = data.user as Record<string, string> | undefined;
    const product = data.product as Record<string, string> | undefined;

    const pdfBytes = await generateTicketPdf({
      membershipId: data.id as string,
      email: user?.email || "",
      plan: product?.title || "General Admission",
      createdAt: data.created_at as string,
      locale,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${membershipId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
