import { useAppSelector } from "../../app/hooks";
import { selectHasWrongArityError } from "./structureSlice";
import ControlButtons from "../../shared/ui/ControlButtons/ControlButtons";
import { editorDescriptors } from "../editors/editorRegistry";
import { buildEditorControlButtons } from "../editors/editorControlButtons";
import type { EditorType } from "../editors/editorTypes";
import type { TupleInfo } from "./tupleInfo";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { useOpenedEditor } from "../editorToolbar/useOpenedEditor";
import { memo, useMemo } from "react";
import { tupleLatexName } from "../textView/textViewAffixes";

export interface TupleInterpretationEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
}

function TupleInterpretationEditor({
  id,
  lock,
  tupleInfo,
  selectLock,
}: TupleInterpretationEditorProps) {
  const { name, type, arity } = tupleInfo;

  const stableTupleInfo = useMemo(
    () => ({ name, type, arity }),
    [name, type, arity],
  );

  const { openedEditor, selectEditor } = useOpenedEditor(stableTupleInfo);

  const wrongArityError = useAppSelector((state) =>
    selectHasWrongArityError(state, name, type),
  );

  const getEditorControls = (omit?: EditorType[]) => (
    <ControlButtons
      id={`controls-${id}`}
      buttons={buildEditorControlButtons(tupleInfo, omit)}
      selected={openedEditor}
      onSelected={selectEditor}
      disabled={wrongArityError}
    />
  );

  const tupleDisplayName = tupleLatexName(name, arity);

  return editorDescriptors[openedEditor].render({
    id,
    tupleInfo: stableTupleInfo,
    tupleDisplayName,
    lock,
    selectLock,
    renderControlButtons: getEditorControls,
  });
}

export default memo(
  TupleInterpretationEditor,
  (prev, next) =>
    prev.id === next.id &&
    prev.tupleInfo.arity === next.tupleInfo.arity &&
    prev.tupleInfo.name === next.tupleInfo.name &&
    prev.tupleInfo.type === next.tupleInfo.type,
);
