import {
  withUnsplashReferral,
  type Photo,
} from "@/lib/photos/catalog";

export function PhotoCredit({ photo }: { photo: Photo }) {
  return (
    <p className="text-xs leading-5 text-[var(--muted)]">
      Photo by{" "}
      <a
        className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
        href={withUnsplashReferral(photo.photographerUrl)}
        rel="noreferrer"
        target="_blank"
      >
        {photo.photographer}
      </a>{" "}
      on{" "}
      <a
        className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
        href={withUnsplashReferral("https://unsplash.com")}
        rel="noreferrer"
        target="_blank"
      >
        Unsplash
      </a>
      {" · "}
      <a
        className="underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
        href={withUnsplashReferral(photo.photoUrl)}
        rel="noreferrer"
        target="_blank"
      >
        Original
      </a>
    </p>
  );
}
