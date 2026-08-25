import type { EditorDescriptor } from "../editors/editorDescriptor";
import type { TupleType } from "../structure/tupleInfo";
import { getAffixes } from "./textViewAffixes";
import TextView from "./TextViewEditor";

const tupleTypeToTextViewType = (type: TupleType) => {
  switch (type) {
    case "predicate":
      return "predicate_interpretation";
    case "function":
      return "function_interpretation";
  }
};

export type TextEditorDescriptor = Omit<EditorDescriptor, "render">;

export const textEditorAdapter = (
  entry: TextEditorDescriptor,
): EditorDescriptor => ({
  ...entry,
  render: ({ tupleInfo, renderControlButtons, tupleDisplayName, ...props }) => (
    <TextView
      {...props}
      {...getAffixes({
        type: tupleTypeToTextViewType(tupleInfo.type),
        name: tupleInfo.name,
        displayName: tupleDisplayName,
      })}
      name={tupleInfo.name}
      textViewType={tupleTypeToTextViewType(tupleInfo.type)}
      controlButtons={renderControlButtons()}
    />
  ),
});
