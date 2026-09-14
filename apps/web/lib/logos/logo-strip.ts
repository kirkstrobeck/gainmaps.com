import type { Company } from "@/lib/logos/companies";
import { requireCompany } from "@/lib/logos/require-company";

export const LOGO_STRIP: readonly Company[] = [
  "microsoft",
  "toyota",
  "mcdonalds",
].map(requireCompany);
