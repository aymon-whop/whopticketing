import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.whop.com/api/v1";

function authHeaders() {
  return { Authorization: `Bearer ${process.env.WHOP_API_KEY}` };
}

export async function GET(request: NextRequest) {
  const membershipId = request.nextUrl.searchParams.get("membership_id");

  if (!membershipId) {
    return NextResponse.json(
      { error: "membership_id is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${API_BASE}/memberships/${membershipId}`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      return NextResponse.json({
        valid: false,
        reason: "not_found",
        email: "",
        scan_count: 0,
      });
    }

    const data = await res.json();
    const user = data.user as Record<string, string> | undefined;
    const product = data.product as Record<string, string> | undefined;
    const metadata = (data.metadata || {}) as Record<string, unknown>;

    const email = user?.email || "";
    const plan = product?.title || "General Admission";

    const prevCount = typeof metadata.scan_count === "number" ? metadata.scan_count : 0;
    const newCount = prevCount + 1;

    const updateRes = await fetch(`${API_BASE}/memberships/${membershipId}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        metadata: {
          ...metadata,
          scan_count: newCount,
          last_scanned_at: new Date().toISOString(),
        },
      }),
    });

    if (!updateRes.ok) {
      const body = await updateRes.text();
      console.error("Whop update error:", updateRes.status, body);
    }

    return NextResponse.json({ valid: true, email, plan, scan_count: newCount });
  } catch (err) {
    console.error("Validate error:", err);
    return NextResponse.json(
      { valid: false, reason: "error", email: "", scan_count: 0 },
      { status: 500 }
    );
  }
}
