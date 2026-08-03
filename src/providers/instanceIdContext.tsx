import { createContext, useContext } from "react";
import { nanoid } from "@reduxjs/toolkit";

export const InstanceIdContext = createContext<string>("");

export function useInstanceId() {
  return useContext(InstanceIdContext);
}

export function generateInstanceId() {
  return nanoid();
}
