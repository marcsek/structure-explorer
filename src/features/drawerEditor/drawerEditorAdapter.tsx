import type { ReactNode, ReactElement } from "react";
import type { InterpretationError } from "../../shared/core/errors";
import type { EditorFilters } from "../editorToolbar/components/EditorToolbar";
import type { EditorDescriptor } from "../editors/editorDescriptor";
import type { DrawerEditorType } from "../editors/editorTypes";
import type { TupleInfo } from "../structure/tupleInfo";
import DrawerEditorWrapper from "./DrawerEditorWrapper";

export interface ErrorOverride {
  editor: DrawerEditorType;
  error: InterpretationError;
  fixButton: ReactNode;
  onFixButtonClick: () => void;
}

export interface DrawerEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  locked: boolean;
  expandedView: boolean;
  setExpandedView: (value: boolean) => void;
  setErrorOverride: (value: ErrorOverride | null) => void;
}

export type RenderDrawerEditor = (props: DrawerEditorProps) => ReactElement;

export interface DrawerEditorConfig {
  type: DrawerEditorType;
  displayName: string;
  toolbar: false | { disabledFilters?: EditorFilters[] };
  render: RenderDrawerEditor;
}

export interface DrawerEditorDescriptor
  extends Omit<EditorDescriptor, "type" | "render">, DrawerEditorConfig {}

export const drawerEditorAdapter = ({
  render,
  toolbar,
  ...shared
}: DrawerEditorDescriptor): EditorDescriptor => {
  const config: DrawerEditorConfig = {
    type: shared.type,
    displayName: shared.displayName,
    toolbar,
    render,
  };

  return {
    ...shared,
    render: (props) => <DrawerEditorWrapper {...props} config={config} />,
  };
};
