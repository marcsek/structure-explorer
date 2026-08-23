import type { ReactNode, ReactElement } from "react";
import type { AppThunk, RootState } from "../../app/store";
import type { InterpretationError } from "../../shared/core/errors";
import type { EditorFilters } from "../editorToolbar/components/EditorToolbar";
import type { EditorDescriptor } from "../editors/editorDescriptor";
import type { DrawerEditorType } from "../editors/editorTypes";
import type { TupleInfo } from "../structure/tupleInfo";
import DrawerEditorWrapper from "./DrawerEditorWrapper";

export interface EditorErrorSource {
  select: (
    state: RootState,
    tupleInfo: TupleInfo,
  ) => InterpretationError | undefined;
  fixButton?: ReactNode;
  onFix?: (tupleInfo: TupleInfo) => AppThunk;
}

export const resolveEditorError = (
  sources: EditorErrorSource[],
  state: RootState,
  tupleInfo: TupleInfo,
) => {
  for (const source of sources) {
    const error = source.select(state, tupleInfo);

    if (error) return { error, source };
  }

  return undefined;
};

export interface DrawerEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  locked: boolean;
  expandedView: boolean;
  setExpandedView: (value: boolean) => void;
}

export type RenderDrawerEditor = (props: DrawerEditorProps) => ReactElement;

export interface DrawerEditorConfig {
  type: DrawerEditorType;
  displayName: string;
  toolbar: false | { disabledFilters?: EditorFilters[] };
  errors: EditorErrorSource[];
  render: RenderDrawerEditor;
}

export interface DrawerEditorDescriptor
  extends Omit<EditorDescriptor, "type" | "render">, DrawerEditorConfig {}

export const drawerEditorAdapter = ({
  render,
  toolbar,
  errors,
  ...shared
}: DrawerEditorDescriptor): EditorDescriptor => {
  const config: DrawerEditorConfig = {
    type: shared.type,
    displayName: shared.displayName,
    toolbar,
    errors,
    render,
  };

  return {
    ...shared,
    render: (props) => <DrawerEditorWrapper {...props} config={config} />,
  };
};
