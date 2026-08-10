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
  const {
    tupleInfo: stableTupleInfo,
    openedEditor,
    selectEditor,
  } = useOpenedEditor(tupleInfo);

  const { name, type } = stableTupleInfo;

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

  const Editor = editorDescriptors[openedEditor].component;

  return (
    <Editor
      id={id}
      tupleInfo={stableTupleInfo}
      lock={lock}
      selectLock={selectLock}
      renderControlButtons={getEditorControls}
    />
  );
}

export default TupleInterpretationEditor;
