import type { ComponentType, ReactNode } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { TupleInfo } from "../structure/tupleInfo";
import type { EditorType } from "./editorTypes";

export type EditorGroup = "tables" | "graphs";

export interface InterpretationEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
  renderControlButtons: (omit?: EditorType[]) => ReactNode;
}

export type InterpretationEditorComponent =
  ComponentType<InterpretationEditorProps>;

export interface EditorDescriptor {
  type: EditorType;
  displayName: string;
  buttonText: string;
  group?: EditorGroup;
  supportsFullscreen?: boolean;
  isAvailable: (tuple: TupleInfo) => boolean;
  component: InterpretationEditorComponent;
}
