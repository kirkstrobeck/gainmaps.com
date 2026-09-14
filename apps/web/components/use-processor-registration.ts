"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

import { ANALYTICS_EVENTS, errorBucket, track } from "@/lib/analytics";
import { ensureProcessorRegistration } from "@/lib/hdr-worker";

export type WorkerState = "checking" | "ready" | "error";

export function useProcessorRegistration(
  hasJobs: boolean,
  setWorkerState: Dispatch<SetStateAction<WorkerState>>,
) {
  useEffect(() => {
    if (!hasJobs) return;
    const gate = { open: true };
    ensureProcessorRegistration()
      .then(() => {
        /* v8 ignore next */
        if (gate.open) {
          setWorkerState("ready");
          track(ANALYTICS_EVENTS.converterWorkerReady, { worker_type: "service_worker" });
        }
      })
      .catch((error: unknown) => {
        /* v8 ignore next */
        if (gate.open) {
          setWorkerState("error");
          track(ANALYTICS_EVENTS.converterWorkerError, {
            worker_type: "service_worker",
            error_bucket: errorBucket(error),
          });
        }
      });
    return () => { gate.open = false; };
  }, [hasJobs, setWorkerState]);
}
