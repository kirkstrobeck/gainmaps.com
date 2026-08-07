import type { Metadata } from "next";

import { AppearanceLab } from "@/components/appearance-lab";

export const metadata: Metadata = {
  title: "Appearance · Theme / Ultra",
  description: "Theme and Ultra controls — same pigments, Ultra intensity.",
};

export default function Base() {
  return <AppearanceLab />;
}
