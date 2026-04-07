import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.whop.com/api/v1";

function authHeaders() {
  return { Authorization: `Bearer ${process.env.WHOP_API_KEY}` };
}

export async function GET(request: NextRequest) {
  const membershipId = request.nextUrl.searchParams.get("membership_id");
  const email = request.nextUrl.searchParams.get("email");

  if (membershipId) return fetchByMembershipId(membershipId);
  if (email) return fetchByEmail(email);

  return NextResponse.json(
    { error: "membership_id or email is required" },
    { status: 400 }
  );
}

async function fetchByMembershipId(id: string) {
  try {
    const res = await fetch(`${API_BASE}/memberships/${id}`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(formatMembership(data));
  } catch {
    return NextResponse.json({ error: "Failed to fetch membership" }, { status: 500 });
  }
}

async function fetchByEmail(email: string) {
  const headers = authHeaders();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let cursor: string | undefined;
    const maxPages = 10;

    for (let page = 0; page < maxPages; page++) {
      const url = new URL(`${API_BASE}/members`);
      if (cursor) url.searchParams.set("after", cursor);

      const res = await fetch(url.toString(), { headers });

      if (!res.ok) {
        const body = await res.text();
        console.error("Whop list members error:", res.status, body);
        return NextResponse.json({ error: "Failed to search members" }, { status: res.status });
      }

      const data = await res.json();
      const members = data.data;

      if (!Array.isArray(members) || members.length === 0) break;

      const match = members.find(
        (m: Record<string, unknown>) => {
          const user = m.user as Record<string, string> | undefined;
          return user?.email && user.email.toLowerCase().trim() === normalizedEmail;
        }
      );

      if (match) {
        const memberId = match.id as string;
        const memberRes = await fetch(`${API_BASE}/members/${memberId}`, { headers });
        if (!memberRes.ok) {
          return NextResponse.json({ error: "Failed to fetch member details" }, { status: 500 });
        }
        const memberDetail = await memberRes.json();
        const company = memberDetail.company as Record<string, string> | undefined;
        const companyId = company?.id;
        if (!companyId) {
          return NextResponse.json({ error: "Could not determine company" }, { status: 500 });
        }

        const payUrl = new URL(`${API_BASE}/payments`);
        payUrl.searchParams.set("company_id", companyId);
        const user = match.user as Record<string, string>;
        const userId = user?.id;

        const payRes = await fetch(payUrl.toString(), { headers });
        if (!payRes.ok) {
          return NextResponse.json({ error: "Failed to search payments" }, { status: 500 });
        }
        const payData = await payRes.json();
        const payments = payData.data as Record<string, unknown>[];

        const payment = payments?.find((p) => {
          const pUser = p.user as Record<string, string> | undefined;
          return pUser?.id === userId;
        });

        if (payment) {
          const membership = payment.membership as Record<string, string> | undefined;
          if (membership?.id) {
            const memRes = await fetch(`${API_BASE}/memberships/${membership.id}`, { headers });
            if (memRes.ok) {
              const memData = await memRes.json();
              return NextResponse.json(formatMembership(memData));
            }
          }
        }

        return NextResponse.json({ error: "No ticket found for this email" }, { status: 404 });
      }

      const pageInfo = data.page_info;
      if (!pageInfo?.has_next_page) break;
      cursor = pageInfo.end_cursor;
    }

    return NextResponse.json({ error: "No ticket found for this email" }, { status: 404 });
  } catch (err) {
    console.error("Whop API error:", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}

function formatMembership(data: Record<string, unknown>) {
  const user = data.user as Record<string, string> | undefined;
  const product = data.product as Record<string, string> | undefined;
  return {
    id: data.id,
    email: user?.email || "",
    plan: product?.title || "General Admission",
    created_at: data.created_at,
  };
}
