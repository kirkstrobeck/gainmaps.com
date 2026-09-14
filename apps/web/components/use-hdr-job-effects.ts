"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

import type { Job } from "@/lib/hdr-job";

export function useAutoDownload(
  jobs: Job[],
  jobsRef: RefObject<Job[]>,
  enabled: boolean,
  downloaded: RefObject<Set<string>>,
  downloadJob: (job: Job, source: string) => void,
) {
  useEffect(() => {
    jobsRef.current = jobs;
    if (!enabled) return;
    for (const job of jobs) {
      if (job.state === "done" && job.resultUrl && !downloaded.current.has(job.id)) {
        downloaded.current.add(job.id);
        downloadJob(job, "auto_download");
      }
    }
  }, [downloadJob, downloaded, enabled, jobs, jobsRef]);
}

export function useJobCleanup(cancel: () => void, jobs: RefObject<Job[]>) {
  useEffect(() => () => {
    cancel();
    for (const job of jobs.current) {
      URL.revokeObjectURL(job.sourceUrl);
      if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
    }
  }, [cancel, jobs]);
}
