import { createContext, useContext } from "react";

export const InstanceIdContext = createContext<string>("");

export function useInstanceId() {
  return useContext(InstanceIdContext);
}

export function generateInstanceId() {
  return Math.random().toString(36).slice(2, 8);
}
