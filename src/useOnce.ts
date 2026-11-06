import { useEffect, useRef } from "react";

/**
 * Run a scripted sequence (talk, animate, then onDone) exactly once per mount.
 * React StrictMode mounts effects twice in development; a plain useEffect would start the
 * script twice and call onDone twice, skipping a lesson step.
 */
export function useOnce(fn: () => void) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fn();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
