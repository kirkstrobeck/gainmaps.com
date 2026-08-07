"use client";

import {
  IconArrowDown,
  IconCheck,
  IconClock,
  IconFile,
  IconLock,
  IconPhotoUp,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SvgPreview } from "@/components/svg-preview";
import { useUltraMode } from "@/components/ultra-mode-toggle";
import { headroomFromBoost } from "@/lib/gain-map-encode";
import { isSvgFile, rasterizeSvgToPng } from "@/lib/svg-raster";
import { cn } from "@/lib/utils";

type JobState = "queued" | "processing" | "done" | "error";

interface JobSettings {
  boost: number;
}

interface Job {
  id: string;
  file: File;
  sourceUrl: string;
  state: JobState;
  progress: number;
  phase: string;
  settings?: JobSettings;
  startedAt?: number;
  elapsedMs?: number;
  result?: Blob;
  resultName?: string;
  resultUrl?: string;
  bytesIn?: number;
  bytesOut?: number;
  note?: string;
  error?: string;
}

const acceptedFormats = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/svg+xml",
];
const acceptedExtensionPattern = /\.(png|jpe?g|webp|avif|gif|heic|heif|svg)$/i;

function formatBytes(bytes?: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEta(job: Job) {
  if (job.state === "done") return "complete";
  if (job.state === "error") return "needs review";
  if (!job.startedAt || job.progress < 5) return "waiting";
  const elapsed = Date.now() - job.startedAt;
  const total = elapsed / Math.max(job.progress / 100, 0.05);
  const remaining = Math.max(total - elapsed, 0);
  if (remaining < 1000) return "under 1s";
  return `${Math.ceil(remaining / 1000)}s`;
}

function settingsChanged(a?: JobSettings, b?: JobSettings) {
  if (!a || !b) return false;
  return a.boost !== b.boost;
}

function concurrencyLimit() {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.min(Math.max(Math.floor(cores / 2), 2), 4);
}

const WORKER_START_TIMEOUT_MS = 12_000;

async function ensureProcessorRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }
  const registration = await navigator.serviceWorker.register("/hdr-service-worker.js", {
    scope: "/",
    updateViaCache: "none",
  });
  void registration.update();
  await navigator.serviceWorker.ready;
  return registration;
}

/** Always resolve the current activated worker — cached refs go redundant after SW rebuilds. */
async function resolveActiveWorker(): Promise<ServiceWorker> {
  const registration = await ensureProcessorRegistration();
  const worker = registration.active ?? navigator.serviceWorker.controller;
  if (!worker || worker.state === "redundant") {
    throw new Error("Service worker is not active yet.");
  }
  return worker;
}

async function prepareProcessFile(file: File): Promise<File> {
  if (!isSvgFile(file)) return file;
  return rasterizeSvgToPng(file);
}

function failJob(
  job: Job,
  options: JobSettings,
  startedAt: number,
  error: string,
  onUpdate: (job: Job) => void,
) {
  onUpdate({
    ...job,
    state: "error",
    settings: options,
    startedAt,
    elapsedMs: Date.now() - startedAt,
    phase: "Failed",
    progress: 100,
    error,
  });
}

function runServiceWorkerJob(
  job: Job,
  options: JobSettings,
  onUpdate: (job: Job) => void,
) {
  return new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    const startedAt = Date.now();
    const gate = { open: true };

    function finish() {
      if (!gate.open) return;
      gate.open = false;
      clearTimeout(startTimer);
      channel.port1.close();
      resolve();
    }

    onUpdate({
      ...job,
      state: "processing",
      settings: options,
      startedAt,
      phase: isSvgFile(job.file) ? "Rasterizing SVG" : "Starting",
      progress: 1,
      error: undefined,
      note: undefined,
    });

    const startTimer = setTimeout(() => {
      failJob(
        job,
        options,
        startedAt,
        "Worker did not start. Hard-refresh the page to reload the processor.",
        onUpdate,
      );
      finish();
    }, WORKER_START_TIMEOUT_MS);

    channel.port1.onmessage = (event: MessageEvent) => {
      const message = event.data;
      if (!gate.open) return;
      if (message.type === "progress") {
        clearTimeout(startTimer);
        onUpdate({
          ...job,
          state: "processing",
          settings: options,
          startedAt,
          elapsedMs: message.elapsedMs,
          phase: message.phase,
          progress: message.progress,
        });
      }
      if (message.type === "done") {
        clearTimeout(startTimer);
        const result = message.blob as Blob;
        const resultUrl = URL.createObjectURL(result);
        onUpdate({
          ...job,
          state: "done",
          settings: options,
          startedAt,
          elapsedMs: message.elapsedMs,
          phase: message.phase,
          progress: 100,
          result,
          resultUrl,
          resultName: message.name,
          bytesIn: message.bytesIn,
          bytesOut: message.bytesOut,
          note: message.note,
        });
        finish();
      }
      if (message.type === "error") {
        clearTimeout(startTimer);
        onUpdate({
          ...job,
          state: "error",
          settings: options,
          startedAt,
          elapsedMs: message.elapsedMs,
          phase: "Failed",
          progress: 100,
          error: message.error,
        });
        finish();
      }
    };

    void prepareProcessFile(job.file)
      .then(async (file) => {
        const worker = await resolveActiveWorker();
        if (!gate.open) return;
        worker.postMessage(
          {
            type: "PROCESS_IMAGE",
            id: job.id,
            file,
            options,
          },
          [channel.port2],
        );
      })
      .catch((error: unknown) => {
        failJob(
          job,
          options,
          startedAt,
          error instanceof Error ? error.message : String(error),
          onUpdate,
        );
        finish();
      });
  });
}

function download(job: Job) {
  if (!job.resultUrl || !job.resultName) return;
  const anchor = document.createElement("a");
  anchor.href = job.resultUrl;
  anchor.download = job.resultName;
  anchor.click();
}

export function HdrProcessor() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [boost, setBoost] = useState(0.5);
  const [autoDownload, setAutoDownload] = useState(false);
  const [workerState, setWorkerState] = useState<"checking" | "ready" | "error">("checking");
  const [dragActive, setDragActive] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const ultraMode = useUltraMode();
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
      .then(() => {
        if (gate.open) setWorkerState("ready");
      })
      .catch(() => {
        if (gate.open) setWorkerState("error");
      });
    return () => {
      gate.open = false;
    };
  }, []);

  useEffect(
    () => () => {
      for (const job of jobsRef.current) {
        URL.revokeObjectURL(job.sourceUrl);
        if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
      }
    },
    [],
  );

  useEffect(() => {
    if (workerState === "ready") void processQueue();
  }, [jobs, processQueue, workerState]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files)
      .filter((file) => acceptedFormats.includes(file.type) || acceptedExtensionPattern.test(file.name))
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
    if (jobs.length && !selectedJob) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJob, selectedJobId]);

  const selectJob = useCallback((job: Job) => {
    setSelectedJobId(job.id);
    if (!job.settings) return;
    setBoost(job.settings.boost);
  }, []);

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragActive(true);
    },
    onDragLeave: () => setDragActive(false),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragActive(false);
      addFiles(event.dataTransfer.files);
    },
  };

  if (jobs.length === 0) {
    return (
      <section
        {...dropHandlers}
        className={cn(
          "mx-auto grid h-[calc(100dvh-4rem)] w-full max-w-7xl place-items-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
          dragActive && "bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]",
        )}
      >
        <div className="grid max-h-full w-full max-w-5xl gap-5 text-center">
          <div
            className={cn(
              "relative grid min-h-[min(520px,calc(100dvh-9rem))] overflow-hidden rounded-[calc(var(--radius)*1.5)] border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_24%,var(--border))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_44%),var(--panel)] p-5 shadow-sm transition sm:p-8",
              dragActive && "scale-[0.99] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--panel))]",
            )}
          >
            <div className="grid place-items-center">
              <div className="grid max-w-3xl gap-5">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] shadow-sm [@media(max-height:680px)]:hidden">
                  <IconPhotoUp aria-hidden size={32} stroke={1.7} />
                </div>

                <div>
                  <p className="mx-auto mb-4 flex max-w-max items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                    <IconLock aria-hidden size={14} stroke={1.8} />
                    Privacy: These files do not go anywhere.
                  </p>
                  <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.02] tracking-normal text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                    Drop images here to make them HDR.
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                    Your browser processes each image locally with a service worker. Review the before and after, then download.
                  </p>
                </div>

                <div className="mx-auto flex flex-wrap items-center justify-center gap-3">
                  <Button asChild>
                    <label>
                      <IconPhotoUp aria-hidden size={18} stroke={1.7} />
                      Select files
                      <input
                        className="sr-only"
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.avif,.gif,.heic,.heif,.svg,image/*"
                        multiple
                        onChange={(event) => event.currentTarget.files && addFiles(event.currentTarget.files)}
                      />
                    </label>
                  </Button>
                  <span className="text-sm text-[var(--muted)]">
                    PNG, JPEG, WebP, AVIF, GIF, HEIC, and SVG (including animated)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-left text-sm text-[var(--muted)] sm:grid-cols-3 [@media(max-height:760px)]:hidden">
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-4">
                <span className="block font-medium text-[var(--foreground)]">Local</span>
                <span className="mt-1 block text-xs leading-5">No upload route. No server processing.</span>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-4">
                <span className="block font-medium text-[var(--foreground)]">Private</span>
                <span className="mt-1 block text-xs leading-5">Files stay in this browser tab.</span>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-4">
                <span className="block font-medium text-[var(--foreground)]">Adjustable</span>
                    <span className="mt-1 block text-xs leading-5">Tune Ultra intensity, then export Ultra JPEGs.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      {...dropHandlers}
      className={cn(
        "grid h-[calc(100dvh-4rem)] min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
        dragActive && "bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]",
      )}
    >
      <div className="ultra-surface min-h-0 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm sm:p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="boost">Ultra</Label>
              <span className="font-mono text-sm">{headroomFromBoost(boost).toFixed(2)}</span>
            </div>
            <input
              id="boost"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={boost}
              onChange={(event) => setBoost(Number(event.target.value))}
              className="w-full accent-[var(--foreground)]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 lg:justify-start">
            {selectedNeedsRegeneration ? (
              <Button
                className="h-10 px-4"
                disabled={!selectedJob || selectedJob.state === "processing"}
                onClick={redoSelected}
              >
                <IconRefresh aria-hidden size={18} stroke={1.7} />
                Regenerate
              </Button>
            ) : null}
            <Button
              className="h-10 px-4"
              disabled={selectedJob?.state !== "done"}
              onClick={() => selectedJob && download(selectedJob)}
            >
              <IconArrowDown aria-hidden size={17} stroke={1.7} />
              Download
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <IconShieldCheck aria-hidden size={15} stroke={1.7} />
              No server upload
            </span>
            <span>Worker {workerState}</span>
            <span>Running {totals.running}</span>
            <span>Finished {totals.done}/{totals.total}</span>
            <span>Failed {totals.failed}</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="accent-[var(--foreground)]"
              checked={autoDownload}
              onChange={(event) => setAutoDownload(event.target.checked)}
            />
            Automatically download completed files
          </label>
        </div>
      </div>

      <div className="grid min-h-0 gap-4 overflow-y-auto lg:grid-cols-[minmax(18rem,23rem)_minmax(0,1fr)] lg:overflow-hidden">
        <div className="ultra-surface order-2 flex min-h-0 max-h-[40dvh] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] shadow-sm lg:order-none lg:max-h-none">
          <div className="grid shrink-0 gap-3 border-b border-[var(--border)] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-normal text-[var(--foreground)]">Queue</h1>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">Click a row to tune and compare.</p>
              </div>
              <Button variant="secondary" className="h-9 px-3" onClick={clearJobs} aria-label="Clear queue">
                <IconRefresh aria-hidden size={18} stroke={1.7} />
              </Button>
            </div>

            <label
              className={cn(
                "grid cursor-pointer place-items-center gap-2 rounded-[var(--radius)] border border-dashed border-[color-mix(in_srgb,var(--foreground)_24%,var(--border))] bg-[var(--background)] px-3 py-4 text-center transition",
                dragActive && "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--background))]",
              )}
            >
              <IconPhotoUp aria-hidden size={22} stroke={1.7} />
              <span className="text-sm font-medium">Drop more images here</span>
              <span className="text-xs text-[var(--muted)]">PNG, JPEG, WebP, AVIF, GIF, HEIC, SVG</span>
              <input
                className="sr-only"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.avif,.gif,.heic,.heif,.svg,image/*"
                multiple
                onChange={(event) => event.currentTarget.files && addFiles(event.currentTarget.files)}
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-[var(--border)] overflow-auto">
            {jobs.map((job) => (
              <article
                key={job.id}
                data-testid="job-row"
                role="button"
                tabIndex={0}
                onClick={() => selectJob(job)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") selectJob(job);
                }}
                className={cn(
                  "grid cursor-pointer gap-3 p-3 outline-none transition hover:bg-[var(--panel-strong)] focus:bg-[var(--panel-strong)]",
                  selectedJob?.id === job.id && "bg-[var(--panel-strong)]",
                )}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]">
                      {job.state === "done" ? (
                        <IconCheck aria-hidden size={18} stroke={1.8} />
                      ) : job.state === "error" ? (
                        <IconX aria-hidden size={18} stroke={1.8} />
                      ) : (
                        <IconFile aria-hidden size={18} stroke={1.8} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">{job.file.name}</h3>
                      <p className="mt-1 truncate text-xs text-[var(--muted)]">
                        {job.phase} / {formatBytes(job.file.size)} / ETA {formatEta(job)}
                      </p>
                      {job.settings ? (
                        <p className="mt-1 truncate text-xs text-[var(--muted)]">
                          Ultra {headroomFromBoost(job.settings.boost).toFixed(2)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Progress value={job.progress} className="mt-3" />
                  {job.note ? <p className="mt-2 text-xs text-[var(--muted)]">{job.note}</p> : null}
                  {job.error ? <p className="mt-2 text-xs text-[var(--danger)]">{job.error}</p> : null}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {job.state === "done" ? formatBytes(job.bytesOut) : `${Math.round(job.progress)}%`}
                  </span>
                  <Button
                    variant="secondary"
                    className="h-8 px-3"
                    disabled={job.state !== "done"}
                    onClick={(event) => {
                      event.stopPropagation();
                      download(job);
                    }}
                  >
                    <IconArrowDown aria-hidden size={17} stroke={1.7} />
                    Download
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="ultra-surface order-1 flex min-h-0 flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_13%,transparent),transparent_38%),var(--panel)] shadow-sm lg:order-none">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-3 sm:p-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-normal">
                {selectedJob?.file.name ?? "Preview"}
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {selectedJob?.settings
                  ? `Processed with Ultra ${headroomFromBoost(selectedJob.settings.boost).toFixed(2)}`
                  : `Ready with Ultra ${headroomFromBoost(boost).toFixed(2)}`}
              </p>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">
              <div className="font-medium text-[var(--foreground)]">
                {selectedNeedsRegeneration ? "Settings changed" : "Settings matched"}
              </div>
              <div>Before and after preview</div>
            </div>
          </div>

          <div className="grid place-items-center p-4 lg:min-h-0 lg:flex-1 lg:overflow-auto">
            <div className="grid w-full max-w-full grid-cols-2 items-start gap-3 sm:gap-4 md:grid-cols-[minmax(0,300px)_auto_minmax(0,300px)] md:items-center md:justify-center">
              <figure className="grid min-w-0 gap-2">
                <figcaption className="text-center text-sm font-medium">Original</figcaption>
                <p className="text-center text-[11px] text-[var(--muted)]">SDR reference</p>
                <div className="grid aspect-square w-full max-w-[300px] place-items-center justify-self-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-3 shadow-sm">
                  {selectedJob && isSvgFile(selectedJob.file) ? (
                    <SvgPreview file={selectedJob.file} className="preview-original" />
                  ) : selectedJob ? (
                    <img
                      alt={`Original ${selectedJob.file.name}`}
                      src={selectedJob.sourceUrl}
                      className="preview-original max-h-full max-w-full object-contain"
                    />
                  ) : null}
                </div>
              </figure>

              <div className="hidden h-px w-12 bg-[var(--border)] md:block" />

              <figure className="grid min-w-0 gap-2">
                <figcaption className="text-center text-sm font-medium">Revised</figcaption>
                <p className="text-center text-[11px] text-[var(--muted)]" data-testid="ultra-preview-state">
                  {ultraMode === "on" ? "Ultra unlocked" : "Ultra clamped"}
                </p>
                <div className="grid aspect-square w-full max-w-[300px] place-items-center justify-self-center overflow-hidden rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))] bg-[var(--background)] p-3 shadow-sm">
                  {selectedJob?.resultUrl ? (
                    <img
                      alt={`Revised ${selectedJob.file.name}`}
                      src={selectedJob.resultUrl}
                      className="preview-revised max-h-full max-w-full object-contain"
                    />
                  ) : selectedJob ? (
                    <div className="grid w-full max-w-[220px] gap-3 text-center text-sm text-[var(--muted)]">
                      <IconSparkles aria-hidden className="mx-auto" size={28} stroke={1.7} />
                      <p>{selectedJob.state === "error" ? selectedJob.error : selectedJob.phase}</p>
                      <Progress value={selectedJob.progress} />
                    </div>
                  ) : null}
                </div>
              </figure>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-3 text-xs text-[var(--muted)] sm:p-4">
            <span className="flex items-center gap-2">
              <IconLock aria-hidden size={15} stroke={1.7} />
              Privacy: These files do not go anywhere. They are processed in this browser.
            </span>
            <span className="flex items-center gap-2">
              <IconClock aria-hidden size={15} stroke={1.7} />
              Queue adapts to browser CPU count.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
