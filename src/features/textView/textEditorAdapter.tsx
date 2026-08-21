import type { EditorDescriptor } from "../editors/editorDescriptor";
import type { TupleType } from "../structure/tupleInfo";
import TextView from "./TextViewEditor";
import type { TextViewType } from "./textViews";

const tupleTypeToTextViewType = (type: TupleType): TextViewType => {
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
  render: ({ tupleInfo, renderControlButtons, ...props }) => (
    <TextView
      {...props}
      name={tupleInfo.name}
      textViewType={tupleTypeToTextViewType(tupleInfo.type)}
      controlButtons={renderControlButtons()}
    />
  ),
});
