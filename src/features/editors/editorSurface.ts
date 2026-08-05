import type { ComponentType, ReactNode } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { InterpretationError } from "../../shared/core/errors";
import type { TupleInfo } from "../structure/tupleInfo";
import type { TextViewType } from "../textView/textViews";
import type { DrawerEditorType } from "./editorTypes";

export interface ErrorOverride {
  editor: DrawerEditorType;
  error: InterpretationError;
  fixButton: ReactNode;
  onFixButtonClick: () => void;
}

export interface DrawerEditorProps {
  tupleInfo: TupleInfo;
  locked: boolean;
  expandedView: boolean;
  setExpandedView: (value: boolean) => void;
  setErrorOverride: (value: ErrorOverride | null) => void;
}

export interface StandaloneEditorProps {
  id: string;
  name: string;
  textViewType: TextViewType;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
  controlButtons: ReactNode;
}

export type DrawerEditorComponent = ComponentType<DrawerEditorProps>;

export type StandaloneEditorComponent = ComponentType<StandaloneEditorProps>;
