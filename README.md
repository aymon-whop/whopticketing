# QR Ticket — Whop-Powered Ticketing

Minimal ticketing app: sell tickets on Whop, generate QR codes, scan at the door. No database — Whop is the source of truth.

## Setup

### 1. Environment Variables

Create `.env.local` in the project root (already included if you cloned this):

```
WHOP_API_KEY=your_whop_api_key_here
WHOP_PRODUCT_ID=your_product_id_here
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

- **WHOP_API_KEY** — Get this from [Whop Developer Settings](https://dash.whop.com/settings/developer). Create an API key with membership read/write permissions.
- **WHOP_PRODUCT_ID** — Find this in your Whop dashboard under the product you're selling. It looks like `prod_XXXXX`.
- **NEXT_PUBLIC_ADMIN_PASSWORD** — Simple password for the admin toggle (client-side only, not real security).

### 2. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. Someone buys a ticket on your Whop product page (normal Whop checkout)
2. After purchase, they go to `localhost:3000` and enter the email they used on Whop
3. The app searches your product's memberships via the Whop API, matches by email, and generates a QR code from their membership ID
4. They download or screenshot their QR ticket
5. At the door, open `/admin`, toggle admin mode, and scan QR codes with your phone camera
6. The scanner calls `/api/validate` which checks Whop membership metadata for `checked_in`
7. If not checked in: marks `checked_in: true` in metadata and shows a green "valid" screen
8. If already checked in: shows a red "already used" screen

Direct link also works: `/?membership_id=mem_xxxx` will skip the email form and go straight to the ticket (useful if you want to send links directly).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Buyer ticket page — enter email to claim ticket, or pass `?membership_id=mem_xxxx` |
| `/admin` | Door scanner — toggle admin mode, scan QR codes with camera |
| `/api/membership` | Server-side: fetch membership by `?membership_id=` or `?email=` |
| `/api/validate` | Server-side: validate + check-in a ticket via Whop metadata |

## Tech Stack

- **Next.js** (App Router) — single repo, no separate backend
- **Tailwind CSS** — styling
- **qrcode** — client-side QR code generation
- **html5-qrcode** — camera-based QR scanning
- **Whop API** — membership data and check-in state (no database needed)
