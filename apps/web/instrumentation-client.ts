async function initPostHog() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return; // Skip analytics when token is not configured (local dev, CI)
  const { default: posthog } = await import('posthog-js')
  posthog.init(token, {
    api_host: "/ingest",
    defaults: '2026-05-30',
    disable_session_recording: true,
    disable_surveys: true,
    capture_performance: false,
  })
}

document.readyState === 'complete'
  ? initPostHog().catch(() => {})
  : window.addEventListener('load', () => initPostHog().catch(() => {}))
