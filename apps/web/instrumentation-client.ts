import { posthogClientConfig } from "@/lib/posthog-client-config"

type QueuedEvent = [event: string, properties?: Record<string, unknown>]

async function initPostHog(config: NonNullable<ReturnType<typeof posthogClientConfig>>, queue: QueuedEvent[]): Promise<void> {
  const { default: posthog } = await import("posthog-js/dist/module.slim")
  posthog.init(config.token, {
    api_host: config.api_host,
    defaults: config.defaults,
    capture_pageview: "history_change",
    capture_pageleave: true,
    disable_session_recording: true,
    disable_surveys: true,
    capture_performance: false,
  })
  window.gainmapsPostHog = { capture: posthog.capture.bind(posthog) }
  queue.forEach(([event, properties]) => posthog.capture(event, properties))
}

function schedulePostHog(): void {
  const config = posthogClientConfig()
  if (!config) return
  const queue: QueuedEvent[] = []
  window.gainmapsPostHog = {
    capture: (event, properties) => { queue.push([event, properties]) },
  }
  let started = false
  let idleId = 0
  let timeoutId = 0

  const start = () => {
    if (started) return
    started = true
    window.cancelIdleCallback?.(idleId)
    window.clearTimeout(timeoutId)
    window.removeEventListener("pointerdown", start)
    window.removeEventListener("keydown", start)
    void initPostHog(config, queue).catch(() => {
      queue.length = 0
      delete window.gainmapsPostHog
    })
  }
  window.addEventListener("pointerdown", start, { once: true, passive: true })
  window.addEventListener("keydown", start, { once: true })
  const afterLoad = () => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 5000 })
      return
    }
    timeoutId = window.setTimeout(start, 0)
  }
  if (document.readyState === "complete") afterLoad()
  if (document.readyState !== "complete") window.addEventListener("load", afterLoad, { once: true })
}

schedulePostHog()
