import type { EditorDescriptor } from "../editors/editorDescriptor";
import { tupleTypeToTextViewType } from "../structure/tupleInfo";
import TextView from "./TextViewEditor";

export type TextEditorDescriptor = Omit<EditorDescriptor, "component">;

export const textEditorAdapter = (
  entry: TextEditorDescriptor,
): EditorDescriptor => ({
  ...entry,
  component: ({ tupleInfo, renderControlButtons, ...props }) => (
    <TextView
      {...props}
      name={tupleInfo.name}
      textViewType={tupleTypeToTextViewType(tupleInfo.type)}
      controlButtons={renderControlButtons()}
    />
  ),
});
