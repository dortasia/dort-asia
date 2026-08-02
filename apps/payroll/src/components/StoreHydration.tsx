"use client";

import { useLayoutEffect } from "react";
import { useAppStore } from "@/store";

/** Must run once on the client so persist middleware rehydrates after skipHydration. */
export function StoreHydration() {
  useLayoutEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);
  return null;
}
