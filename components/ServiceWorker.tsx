"use client";

import { useEffect, useState } from "react";

export default function ServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isHindi, setIsHindi] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    setIsHindi(document.documentElement.lang.toLowerCase().startsWith("hi"));

    let registration: ServiceWorkerRegistration | undefined;
    let reloading = false;

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") void registration?.update().catch(() => {});
    };

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const watchRegistration = (reg: ServiceWorkerRegistration) => {
      registration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) setWaitingWorker(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller && reg.waiting) {
            setWaitingWorker(reg.waiting);
          }
        });
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
      .then(watchRegistration)
      .catch(() => {});
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", checkForUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, []);

  if (!waitingWorker) return null;

  const applyUpdate = () => {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-950 p-4 text-white shadow-2xl"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <p className="text-sm leading-5">
        {isHindi ? "Ashu Website का नया संस्करण उपलब्ध है। अपडेट करें?" : "A new version of Ashu Website is ready. Update now?"}
      </p>
      <button
        type="button"
        onClick={applyUpdate}
        className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
      >
        {isHindi ? "अपडेट करें" : "Update now"}
      </button>
    </div>
  );
}
