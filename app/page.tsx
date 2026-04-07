"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import QRCode from "qrcode";
import { useI18n } from "@/lib/i18n-context";

interface TicketData {
  id: string;
  email: string;
  plan: string;
  created_at: string;
}

function TicketContent() {
  const searchParams = useSearchParams();
  const membershipIdParam = searchParams.get("membership_id");
  const { t, locale } = useI18n();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "error">("idle");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchTicket = useCallback(async (query: string) => {
    setLoading(true);
    setError("");
    setTicket(null);

    try {
      const res = await fetch(`/api/membership?${query}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Ticket not found");
      }
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your ticket.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (membershipIdParam) {
      fetchTicket(`membership_id=${encodeURIComponent(membershipIdParam)}`);
    }
  }, [membershipIdParam, fetchTicket]);

  useEffect(() => {
    if (ticket && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, ticket.id, {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [ticket]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    fetchTicket(`email=${encodeURIComponent(email.trim())}`);
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!ticket) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/ticket-pdf?membership_id=${encodeURIComponent(ticket.id)}&locale=${locale}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${ticket.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }, [ticket]);

  const handleSendEmail = useCallback(async () => {
    if (!ticket) return;
    setSendingEmail(true);
    setEmailStatus("idle");
    try {
      const res = await fetch("/api/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership_id: ticket.id, locale }),
      });
      if (!res.ok) throw new Error("Send failed");
      setEmailStatus("sent");
    } catch {
      setEmailStatus("error");
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailStatus("idle"), 4000);
    }
  }, [ticket]);

  if (ticket) {
    const dateLocaleStr = locale === "es" ? "es-ES" : "en-US";
    const purchaseDate = new Date(ticket.created_at).toLocaleDateString(dateLocaleStr, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/diekpower-hero.jpg" alt="DiekPower" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-bold text-gray-900 tracking-tight">DiekPower</span>
          </div>
          <h1 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {t("ticket.yourTicket")}
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{ticket.plan}</h2>

          <div className="flex justify-center mb-6">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="space-y-1 mb-6">
            <p className="text-sm text-gray-500">{ticket.email}</p>
            <p className="text-sm text-gray-400">
              {t("ticket.purchased")} {purchaseDate}
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {downloadingPdf ? t("ticket.downloading") : t("ticket.downloadPdf")}
            </button>

            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full bg-white text-gray-900 py-3 px-6 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendingEmail ? t("ticket.sendingEmail") : t("ticket.sendEmail")}
            </button>
          </div>

          {emailStatus === "sent" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
              <p className="text-green-700 text-sm">{t("ticket.emailSent")}</p>
            </div>
          )}
          {emailStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
              <p className="text-red-700 text-sm">{t("ticket.emailError")}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            {t("ticket.showQr")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/diekpower-hero.jpg" alt="DiekPower" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-bold text-gray-900 tracking-tight">DiekPower</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("ticket.title")}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t("ticket.subtitle")}
        </p>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("ticket.emailPlaceholder")}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? t("ticket.searching") : t("ticket.findButton")}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          {t("ticket.footerHint")}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  );
}
