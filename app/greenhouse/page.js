"use client";

import ClimatePanel from "@/components/ClimatePanel";
import { CLIMATE_SOURCES } from "@/lib/config";

export default function GreenhousePage() {
  return <ClimatePanel source={CLIMATE_SOURCES.greenhouse} />;
}
