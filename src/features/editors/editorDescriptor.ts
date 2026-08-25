import type { ReactElement, ReactNode } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { TupleInfo } from "../structure/tupleInfo";
import type { EditorType } from "./editorTypes";

export type EditorGroup = "tables" | "graphs";

export interface InterpretationEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  tupleDisplayName: string;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
  renderControlButtons: (omit?: EditorType[]) => ReactNode;
}

export type RenderInterpretationEditor = (
  props: InterpretationEditorProps,
) => ReactElement;

export interface EditorDescriptor {
  type: EditorType;
  displayName: string;
  buttonText: string;
  group?: EditorGroup;
  supportsFullscreen?: boolean;
  isAvailable: (tuple: TupleInfo) => boolean;
  render: RenderInterpretationEditor;
}
