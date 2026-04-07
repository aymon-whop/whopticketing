"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useI18n } from "@/lib/i18n-context";

interface ScanResult {
  valid: boolean;
  reason?: string;
  email: string;
  plan?: string;
  scan_count: number;
}

export default function AdminPage() {
  const { t } = useI18n();
  const [adminMode, setAdminMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // scanner already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScan = useCallback(async (decodedText: string) => {
    await stopScanner();

    try {
      const res = await fetch(`/api/validate?membership_id=${encodeURIComponent(decodedText)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, reason: "error", email: "", scan_count: 0 });
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setScanError("");
    setScanning(true);

    await new Promise((r) => setTimeout(r, 100));

    const el = document.getElementById(scannerContainerId);
    if (!el) {
      setScanError("Scanner container not found");
      setScanning(false);
      return;
    }

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : "Could not access camera. Make sure you granted camera permissions."
      );
      setScanning(false);
    }
  }, [handleScan]);

  useEffect(() => {
    if (adminMode && !scanning && !result) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [adminMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissResult = useCallback(() => {
    setResult(null);
    setTimeout(() => startScanner(), 200);
  }, [startScanner]);

  const toggleAdmin = () => {
    if (adminMode) {
      stopScanner();
      setResult(null);
    }
    setAdminMode(!adminMode);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/diekpower-hero.jpg" alt="DiekPower" className="h-8 w-8 rounded-full object-cover" />
          <h1 className="text-lg font-semibold text-gray-900">{t("admin.title")}</h1>
        </div>
        <button
          onClick={toggleAdmin}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
            adminMode ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              adminMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {!adminMode ? (
          <div className="text-center">
            <p className="text-gray-500 text-lg">{t("admin.toggleHint")}</p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {scanError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 mb-4">{scanError}</p>
                <button
                  onClick={startScanner}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
                >
                  {t("admin.retry")}
                </button>
              </div>
            ) : (
              <div>
                <div
                  id={scannerContainerId}
                  className="rounded-xl overflow-hidden"
                />
                {scanning && (
                  <p className="text-center text-sm text-gray-400 mt-4">
                    {t("admin.cameraHint")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <div
          onClick={dismissResult}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer ${
            result.valid ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {result.valid ? (
            <>
              <svg
                className="w-32 h-32 text-white mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-white text-2xl font-bold mb-2">{result.email}</p>
              <p className="text-white/80 text-xl mb-4">{result.plan}</p>
              <div className="bg-white/20 rounded-xl px-6 py-3 mt-2">
                <p className="text-white text-lg font-semibold">
                  {t("admin.scanNumber")}{result.scan_count}
                  {result.scan_count > 1 && (
                    <span className="text-white/70 font-normal">
                      {" "}— {result.scan_count}{" "}
                      {result.scan_count !== 1 ? t("admin.scannedTimes") : t("admin.scannedOnce")}
                    </span>
                  )}
                </p>
              </div>
            </>
          ) : (
            <>
              <svg
                className="w-32 h-32 text-white mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <p className="text-white text-3xl font-bold mb-2">
                {result.reason === "not_found"
                  ? t("admin.ticketNotFound")
                  : t("admin.invalidTicket")}
              </p>
            </>
          )}
          <p className="text-white/50 text-sm mt-8">{t("admin.tapToScan")}</p>
        </div>
      )}
    </div>
  );
}
