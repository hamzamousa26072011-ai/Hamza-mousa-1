import { useEffect, useRef, useState } from "react";

// Safe fallback interface for environments with older DOM types
interface ScreenWakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: "screen";
  release(): Promise<void>;
  addEventListener(type: "release", listener: (this: ScreenWakeLockSentinel, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: "release", listener: (this: ScreenWakeLockSentinel, ev: Event) => any, options?: boolean | EventListenerOptions): void;
}

/**
 * Hook to keep the device screen on (prevent sleeping/locking) whenever `isActive` is true.
 * Uses the official W3C Screen Wake Lock API (supported in Chrome, Edge, Safari 16.4+, Firefox)
 * with automatic re-acquisition on tab visibility and focus changes.
 */
export function useScreenWakeLock(isActive: boolean) {
  const wakeLockRef = useRef<ScreenWakeLockSentinel | null>(null);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const releaseLock = async () => {
      try {
        if (wakeLockRef.current && !wakeLockRef.current.released) {
          await wakeLockRef.current.release();
        }
      } catch {
        // Ignore release errors
      } finally {
        wakeLockRef.current = null;
        if (isMounted) {
          setIsWakeLockActive(false);
        }
      }
    };

    const requestLock = async () => {
      if (!isActive) return;

      // Ensure document is visible before requesting wake lock
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      const nav = navigator as unknown as {
        wakeLock?: {
          request: (type: "screen") => Promise<ScreenWakeLockSentinel>;
        };
      };

      if (nav.wakeLock && typeof nav.wakeLock.request === "function") {
        try {
          // If we already hold an active wake lock, do not re-request
          if (wakeLockRef.current && !wakeLockRef.current.released) {
            return;
          }

          const sentinel = await nav.wakeLock.request("screen");
          wakeLockRef.current = sentinel;
          if (isMounted) {
            setIsWakeLockActive(true);
          }

          sentinel.addEventListener("release", () => {
            if (wakeLockRef.current === sentinel) {
              wakeLockRef.current = null;
              if (isMounted) {
                setIsWakeLockActive(false);
              }
            }
          });
        } catch (err) {
          // Can fail if battery is critically low or system settings prevent it
          console.warn("Screen Wake Lock request error:", err);
          if (isMounted) {
            setIsWakeLockActive(false);
          }
        }
      }
    };

    if (isActive) {
      requestLock();

      const handleVisibilityOrFocus = () => {
        if (document.visibilityState === "visible" && isActive) {
          requestLock();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityOrFocus);
      window.addEventListener("focus", handleVisibilityOrFocus);

      return () => {
        isMounted = false;
        document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        window.removeEventListener("focus", handleVisibilityOrFocus);
        releaseLock();
      };
    } else {
      releaseLock();
    }

    return () => {
      isMounted = false;
      releaseLock();
    };
  }, [isActive]);

  return { isWakeLockActive };
}
