"use client";
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { posthog } from "./posthog";
import { Id } from "@convex/_generated/dataModel";
import { UAParser } from "ua-parser-js";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "ib_sid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getSeq(): number {
  if (typeof window === "undefined") return 0;
  const key = "ib_seq";
  const n = parseInt(sessionStorage.getItem(key) ?? "0") + 1;
  sessionStorage.setItem(key, String(n));
  return n;
}

function getUtms() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource: p.get("utm_source") ?? undefined,
    utmMedium: p.get("utm_medium") ?? undefined,
    utmCampaign: p.get("utm_campaign") ?? undefined,
  };
}

export function useAnalytics(convexUserId?: Id<"users">) {
  const { userId: clerkId } = useAuth();
  const pathname = usePathname();
  const logEvent = useMutation(api.analytics.logEvent);
  const upsertSession = useMutation(api.analytics.upsertSession);
  const updateSession = useMutation(api.analytics.updateSession);

  const sessionId = useRef("");
  const sessionStarted = useRef(false);
  const prevPath = useRef("");
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const idleStart = useRef(0);
  const IDLE_MS = 2 * 60 * 1000;

  const capture = useCallback(
    async (
      eventName: string,
      eventCategory: string,
      properties?: Record<string, unknown>
    ) => {
      if (!convexUserId) return;
      if (!sessionId.current) sessionId.current = getSessionId();
      if (!sessionId.current || typeof window === "undefined") return;
      const now = Date.now();
      const seq = getSeq();
      posthog.capture(eventName, {
        ...properties,
        sessionId: sessionId.current,
        seq,
      });
      await logEvent({
        userId: convexUserId,
        sessionId: sessionId.current,
        eventName,
        eventCategory,
        properties: properties ?? {},
        pageUrl: window.location.href,
        pageTitle: document.title,
        previousPageUrl: prevPath.current
          ? window.location.origin + prevPath.current
          : undefined,
        timestamp: now,
        sequenceNumber: seq,
      });
      await updateSession({
        sessionId: sessionId.current,
        incrementEvent: true,
      });
    },
    [convexUserId, logEvent, updateSession]
  );

  // Session start
  useEffect(() => {
    if (!convexUserId || sessionStarted.current) return;
    sessionId.current = getSessionId();
    if (!sessionId.current) return;
    sessionStarted.current = true;
    const parser = new UAParser(navigator.userAgent).getResult();
    const device = parser.device.type ?? "desktop";
    const os = parser.os.name;
    const browser = parser.browser.name;
    const utms = getUtms();
    const isFirst = !localStorage.getItem("ib_ever_sessioned");
    if (isFirst) localStorage.setItem("ib_ever_sessioned", "1");

    posthog.identify(clerkId ?? String(convexUserId), { convexUserId });

    upsertSession({
      userId: convexUserId,
      sessionId: sessionId.current,
      startedAt: Date.now(),
      entryPage: window.location.href,
      isFirstSession: isFirst,
      device,
      os,
      browser,
      referrer: document.referrer || undefined,
      ...utms,
    });

    capture("SESSION_STARTED", "navigation", {
      isFirst,
      device,
      os,
      browser,
      ...utms,
    });

    const onHide = () => {
      updateSession({
        sessionId: sessionId.current,
        exitPage: window.location.href,
        endedAt: Date.now(),
      });
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
  }, [convexUserId]);

  // Page views
  useEffect(() => {
    if (!convexUserId || !pathname) return;
    capture("PAGE_VIEW", "navigation", {
      url: pathname,
      previousUrl: prevPath.current,
    });
    updateSession({ sessionId: sessionId.current, incrementPage: true });
    prevPath.current = pathname;
  }, [pathname, convexUserId]);

  // Scroll depth
  useEffect(() => {
    if (!convexUserId) return;
    const fired = new Set<number>();
    const onScroll = () => {
      const el = document.documentElement;
      const pct = Math.round(
        (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100
      );
      [25, 50, 75, 100].forEach((t) => {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          capture("SCROLL_DEPTH", "navigation", { depthPct: t, url: pathname });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, convexUserId]);

  // Idle detection
  useEffect(() => {
    if (!convexUserId) return;
    const reset = () => {
      if (idleStart.current) {
        const sec = Math.floor((Date.now() - idleStart.current) / 1000);
        capture("APP_RETURNED_FROM_IDLE", "navigation", {
          idleDurationSeconds: sec,
        });
        updateSession({
          sessionId: sessionId.current,
          addIdleSeconds: sec,
        });
        idleStart.current = 0;
      }
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        idleStart.current = Date.now();
        capture("IDLE_DETECTED", "navigation", { url: pathname });
      }, IDLE_MS);
    };
    ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach((e) =>
      window.addEventListener(e, reset, { passive: true })
    );
    reset();
    return () => {
      ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach((e) =>
        window.removeEventListener(e, reset)
      );
      clearTimeout(idleTimer.current);
    };
  }, [convexUserId, pathname]);

  return { capture };
}
