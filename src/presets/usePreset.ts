import { useEffect } from "react";
import { useAppDispatch } from "../app/hooks";
import { UndoActions } from "../features/undoHistory/undoHistory";
import type { AppDispatch } from "../app/store";
import basic from "./basic";
import chess from "./chess";
import preview from "./preview";

export type Preset = (dispatch: AppDispatch) => void;
const presets: Record<string, Preset> = { basic, preview, chess };

export default function usePreset() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("preset");
    const preset = name ? presets[name] : undefined;

    if (!preset) return;

    preset(dispatch);
    dispatch(UndoActions.clearHistory());
  }, [dispatch]);
}
