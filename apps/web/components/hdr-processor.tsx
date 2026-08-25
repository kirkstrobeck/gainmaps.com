"use client";

import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HdrEmpty } from "@/components/hdr-empty";
import { HdrControlsBar } from "@/components/hdr-controls-bar";
import { HdrQueue } from "@/components/hdr-queue";
import { HdrDetail } from "@/components/hdr-detail";
import {
  type Job,
  ACCEPTED_FORMATS,
  ACCEPTED_EXT_PATTERN,
  settingsChanged,
  download,
} from "@/lib/hdr-job";
import { concurrencyLimit, ensureProcessorRegistration, runServiceWorkerJob } from "@/lib/hdr-worker";
import { dequeueFiles } from "@/lib/file-queue";
import { cn } from "@/lib/utils";

export function HdrProcessor() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [boost, setBoost] = useState(0.5);
  const [autoDownload, setAutoDownload] = useState(false);
  const [workerState, setWorkerState] = useState<"checking" | "ready" | "error">("checking");
  const [dragActive, setDragActive] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const queueRunning = useRef(false);
  const inflightIds = useRef(new Set<string>());
  const downloaded = useRef(new Set<string>());
  const jobsRef = useRef(jobs);

  const updateJob = useCallback((next: Job) => {
    setJobs((current) => current.map((job) => (job.id === next.id ? { ...job, ...next } : job)));
  }, []);

  const currentSettings = useMemo(() => ({ boost }), [boost]);

  const processQueue = useCallback(async () => {
    if (queueRunning.current || workerState !== "ready") return;
    queueRunning.current = true;
    try {
      while (true) {
        const queued = jobsRef.current.filter(
          (job) => job.state === "queued" && !inflightIds.current.has(job.id),
        );
        if (queued.length === 0) break;
        const batch = queued.slice(0, concurrencyLimit());
        for (const job of batch) inflightIds.current.add(job.id);
        try {
          await Promise.all(
            batch.map((job) =>
              runServiceWorkerJob(job, job.settings ?? currentSettings, updateJob),
            ),
          );
        } finally {
          for (const job of batch) inflightIds.current.delete(job.id);
        }
      }
    } finally {
      queueRunning.current = false;
    }
  }, [currentSettings, updateJob, workerState]);

  useEffect(() => {
    jobsRef.current = jobs;
    if (autoDownload) {
      for (const job of jobs) {
        if (job.state === "done" && job.resultUrl && !downloaded.current.has(job.id)) {
          downloaded.current.add(job.id);
          download(job);
        }
      }
    }
  }, [autoDownload, jobs]);

  useEffect(() => {
    const gate = { open: true };
    ensureProcessorRegistration()
      .then(() => { if (gate.open) setWorkerState("ready"); })
      .catch(() => { if (gate.open) setWorkerState("error"); });
    return () => { gate.open = false; };
  }, []);

  useEffect(() => () => {
    for (const job of jobsRef.current) {
      URL.revokeObjectURL(job.sourceUrl);
      if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
    }
  }, []);

  useEffect(() => { if (workerState === "ready") void processQueue(); }, [jobs, processQueue, workerState]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files)
      .filter((file) => ACCEPTED_FORMATS.includes(file.type) || ACCEPTED_EXT_PATTERN.test(file.name))
      .map<Job>((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        sourceUrl: URL.createObjectURL(file),
        state: "queued",
        progress: 0,
        phase: "Queued",
        settings: currentSettings,
      }));
    if (next[0]) setSelectedJobId(next[0].id);
    setJobs((current) => [...next, ...current]);
  }, [currentSettings]);

  useEffect(() => {
    const files = dequeueFiles();
    if (files.length > 0) addFiles(files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearJobs = useCallback(() => {
    for (const job of jobsRef.current) {
      URL.revokeObjectURL(job.sourceUrl);
      if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
    }
    downloaded.current.clear();
    setJobs([]);
    setSelectedJobId(null);
  }, []);

  const redoSelected = useCallback(() => {
    const selected = jobsRef.current.find((job) => job.id === selectedJobId);
    if (!selected) return;
    const nextSelectedId = `${selected.file.name}-${selected.file.size}-${selected.file.lastModified}-${crypto.randomUUID()}`;
    setJobs((current) =>
      current.map((job) => {
        if (job.id !== selectedJobId) return job;
        if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
        downloaded.current.delete(job.id);
        return {
          id: nextSelectedId,
          file: job.file,
          sourceUrl: job.sourceUrl,
          state: "queued",
          progress: 0,
          phase: "Queued",
          settings: currentSettings,
        };
      }),
    );
    setSelectedJobId(nextSelectedId);
  }, [currentSettings, selectedJobId]);

  const totals = useMemo(() => {
    const done = jobs.filter((job) => job.state === "done").length;
    const running = jobs.filter((job) => job.state === "processing").length;
    const failed = jobs.filter((job) => job.state === "error").length;
    return { done, running, failed, total: jobs.length };
  }, [jobs]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );
  const selectedNeedsRegeneration = settingsChanged(selectedJob?.settings, currentSettings);

  useEffect(() => {
    if (!jobs.length && selectedJobId) setSelectedJobId(null);
    if (jobs.length && !selectedJob) setSelectedJobId(jobs[0]!.id);
  }, [jobs, selectedJob, selectedJobId]);

  const selectJob = useCallback((job: Job) => {
    setSelectedJobId(job.id);
    if (!job.settings) return;
    setBoost(job.settings.boost);
  }, []);

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragActive(true); },
    onDragLeave: () => setDragActive(false),
    onDrop: (event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragActive(false); addFiles(event.dataTransfer.files); },
  };

  if (jobs.length === 0) {
    return <HdrEmpty addFiles={addFiles} dragActive={dragActive} dropHandlers={dropHandlers} />;
  }

  return (
    <section
      {...dropHandlers}
      className={cn(
        "grid h-[calc(100dvh-4rem)] min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
        dragActive && "bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]",
      )}
    >
      <HdrControlsBar
        boost={boost}
        setBoost={setBoost}
        autoDownload={autoDownload}
        setAutoDownload={setAutoDownload}
        workerState={workerState}
        totals={totals}
        selectedJob={selectedJob}
        selectedNeedsRegeneration={selectedNeedsRegeneration}
        redoSelected={redoSelected}
        onDownload={() => selectedJob && download(selectedJob)}
      />
      <div className="grid min-h-0 gap-4 overflow-y-auto lg:grid-cols-[minmax(18rem,23rem)_minmax(0,1fr)] lg:overflow-hidden">
        <HdrQueue
          jobs={jobs}
          selectedJob={selectedJob}
          onSelectJob={selectJob}
          onDownloadJob={download}
          clearJobs={clearJobs}
          dragActive={dragActive}
          addFiles={addFiles}
        />
        <HdrDetail
          selectedJob={selectedJob}
          boost={boost}
          selectedNeedsRegeneration={selectedNeedsRegeneration}
        />
      </div>
    </section>
  );
}
