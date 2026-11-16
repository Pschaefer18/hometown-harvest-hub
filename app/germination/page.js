"use client";

import ClimatePanel from "@/components/ClimatePanel";
import { CLIMATE_SOURCES } from "@/lib/config";

export default function GerminationPage() {
  return <ClimatePanel source={CLIMATE_SOURCES.germination} />;
}
