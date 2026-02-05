import { memo, useCallback, useEffect, type ChangeEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { type GraphType } from "../graphView/graphs/plugins";
import DrawerEditor from "../drawerEditor/DrawerEditor";
import { selectTeacherMode } from "../teacherMode/teacherModeslice";
import type { RootState } from "../../app/store";
import type { TextViewType } from "../textView/textViews";
import { selectValidation } from "../textView/textViewSlice";
import { selectHasWrongArityError, type TupleType } from "./structureSlice";
import {
  editorOpened,
  selectOpenedEditor,
} from "../editorToolbar/editorToolbarSlice";
import TextView from "../textView/TextViewEditor";
import ControlButtons from "../../components_helper/ControlButtons/ControlButtons";
import { omitControlButtons } from "../../components_helper/ControlButtons/omitControlButtons";
import getEditorControlButtons from "./editorControlButtonsFactory";

export type EditorType = "text" | "matrix" | "database" | GraphType;

interface InterpretationEditorProps {
  id: string;
  name: string;
  type: TupleType;
  arity: number;
  textViewType: TextViewType;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
  lockSelector: (state: RootState, name: string) => boolean;
}

const editorTypeFullNameLookup: Record<EditorType, string> = {
  oriented: "Oriented Graph",
  hasse: "Hasse Diagram",
  bipartite: "Bipartite Graph",
  matrix: "Matrix Editor",
  database: "Database Table Editor",
  text: "Text Editor",
};

function InterpretationEditor({
  name,
  id,
  type,
  textViewType,
  locker,
  lockSelector,
  arity,
}: InterpretationEditorProps) {
  const dispatch = useAppDispatch();
  const openedEditor = useAppSelector((state) =>
    selectOpenedEditor(state, name),
  );
  const validation = useAppSelector((state) =>
    selectValidation(state, textViewType, name),
  );
  const locked = useAppSelector((state) => lockSelector(state, name));
  const wrongArityError = useAppSelector((state) =>
    selectHasWrongArityError(state, name, type),
  );
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

  const escapedName = name.replace(/_/g, "\\_");
  const prefixRawNoEnd = `i(\\text{\\textsf{${escapedName}}})`;

  const handleEditorSelect = useCallback(
    (editor: EditorType) => {
      dispatch(editorOpened({ id: name, editor }));
    },
    [dispatch, name],
  );

  useEffect(() => {
    if (wrongArityError) handleEditorSelect("text");
  }, [handleEditorSelect, wrongArityError]);

  const controlButtons = getEditorControlButtons(type, arity);

  return openedEditor === "text" ? (
    <TextView
      id={id}
      name={name}
      textViewType={textViewType}
      locker={locker}
      lockSelector={lockSelector}
      controlButtons={
        <ControlButtons
          id={`controls-${id}`}
          buttons={controlButtons}
          selected={openedEditor}
          onSelected={handleEditorSelect}
          disabled={wrongArityError}
        />
      }
    />
  ) : (
    <DrawerEditor
      tupleName={name}
      tupleArity={arity}
      type={openedEditor}
      tupleType={type as TupleType}
      tupleDisplayName={prefixRawNoEnd}
      editorDisplayName={editorTypeFullNameLookup[openedEditor]}
      locker={locker}
      locked={locked}
      error={validation}
      buildControlButtons={(omit) => (
        <ControlButtons
          id={`controls-${id}`}
          buttons={omitControlButtons(controlButtons, [...(omit ?? [])])}
          selected={openedEditor}
          onSelected={handleEditorSelect}
          teacherMode={teacherMode}
          locked={locked}
          locker={locker}
        />
      )}
    />
  );
}

export default memo(
  InterpretationEditor,
  (prev, next) =>
    prev.name === next.name &&
    prev.id === next.id &&
    prev.type === next.type &&
    prev.textViewType === next.textViewType &&
    prev.arity === next.arity,
);
