import type { Metadata } from "next";
import { Suspense } from "react";

import { TextPageClient } from "@/app/text/client";

export const metadata: Metadata = {
  title: "Ultra text demo · Gainmaps",
  description: "Drag the slider to push text past SDR reference white on an HDR display.",
};

export default function Base() {
  return (
    <Suspense>
      <TextPageClient />
    </Suspense>
  );
}
