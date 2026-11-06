import { useEffect, useMemo, useRef, type DependencyList } from "react";
import { say, stopVoice } from "./audio";

export interface SequenceScope {
  active(): boolean;
  /** False when this run was cancelled, including while waiting. */
  wait(ms: number): Promise<boolean>;
  /** False when this run was cancelled or another voice interrupted it. */
  say(urls: string[], gap?: number): Promise<boolean>;
}

interface Run extends SequenceScope {
  cancel(): void;
}

// Only the run currently speaking may stop the shared voice during its cleanup.
let voiceOwner: { run: Run; interrupt(): void } | null = null;

function createRun(): Run {
  let live = true;
  const waits = new Set<() => void>();
  const run: Run = {
    active: () => live,
    wait(ms) {
      if (!live) return Promise.resolve(false);
      return new Promise((resolve) => {
        const cancel = () => {
          clearTimeout(timer);
          waits.delete(cancel);
          resolve(false);
        };
        const timer = setTimeout(() => {
          waits.delete(cancel);
          resolve(live);
        }, ms);
        waits.add(cancel);
      });
    },
    async say(urls, gap) {
      if (!live) return false;
      // Resolve the previous caller immediately, even if its audio is still loading.
      voiceOwner?.interrupt();
      let interrupt!: () => void;
      const interrupted = new Promise<boolean>((resolve) => {
        interrupt = () => resolve(false);
      });
      const lease = { run, interrupt };
      voiceOwner = lease;
      try {
        const completed = await Promise.race([say(urls, gap), interrupted]);
        return live && completed;
      } finally {
        if (voiceOwner === lease) voiceOwner = null;
      }
    },
    cancel() {
      if (!live) return;
      live = false;
      for (const cancel of [...waits]) cancel();
      if (voiceOwner?.run === run) {
        voiceOwner.interrupt();
        voiceOwner = null;
        stopVoice();
      }
    },
  };
  return run;
}

/**
 * A cancellable script per mount (or dependency change). Check each awaited boolean before
 * advancing. The returned stable controller is also safe for replay buttons and other events.
 */
export function useSequence(fn: (scope: SequenceScope) => void | Promise<void>, deps: DependencyList = []): SequenceScope {
  const current = useRef<Run | null>(null);
  const controller = useMemo<SequenceScope>(() => ({
    active: () => current.current?.active() ?? false,
    wait: (ms) => current.current?.wait(ms) ?? Promise.resolve(false),
    say: (urls, gap) => current.current?.say(urls, gap) ?? Promise.resolve(false),
  }), []);

  useEffect(() => {
    const run = createRun();
    current.current = run;
    // StrictMode cleans up its first effect before this task runs; only the live setup starts.
    void Promise.resolve().then(() => run.active() && fn(run)).catch((error: unknown) => {
      if (run.active()) {
        run.cancel();
        console.error("Learning sequence failed", error);
      }
    });
    return () => {
      if (current.current === run) current.current = null;
      run.cancel();
    };
  }, deps); // Scripts deliberately restart only for the dependencies supplied by the caller.

  return controller;
}
