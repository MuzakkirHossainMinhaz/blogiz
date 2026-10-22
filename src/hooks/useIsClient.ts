"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** True after hydration on the client; false during SSR. */
export function useIsClient() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
