import { useAppDispatch, useAppSelector } from "../../app/hooks";
import DrawerEditor from "../drawerEditor/DrawerEditor";
import { selectTeacherMode } from "../teacherMode/teacherModeSlice";
import { selectValidation } from "../textView/textViewSlice";
import { selectHasWrongArityError } from "./structureSlice";
import TextView from "../textView/TextViewEditor";
import ControlButtons from "../../shared/ui/ControlButtons/ControlButtons";
import {
  buildEditorControlButtons,
  getEditorDisplayName,
} from "../editors/editorRegistry";
import type { EditorType } from "../editors/editorTypes";
import type { TupleInfo } from "./tupleInfo";
import { tupleLatexName } from "../textView/textViewAffixes";
import type { TextViewType } from "../textView/textViews";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { useOpenedEditor } from "../editorToolbar/useOpenedEditor";

export interface TupleInterpretationEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  textViewType: TextViewType;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
}

function TupleInterpretationEditor({
  id,
  lock,
  tupleInfo,
  textViewType,
  selectLock,
}: TupleInterpretationEditorProps) {
  const dispatch = useAppDispatch();

  const {
    tupleInfo: stableTupleInfo,
    openedEditor,
    selectEditor,
  } = useOpenedEditor(tupleInfo);

  const { name, type } = stableTupleInfo;

  const validation = useAppSelector((state) =>
    selectValidation(state, textViewType, name),
  );
  const locked = useAppSelector((state) => selectLock(state, name));
  const wrongArityError = useAppSelector((state) =>
    selectHasWrongArityError(state, name, type),
  );
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

  const sharedControlProps = {
    id: `controls-${id}`,
    tupleInfo: stableTupleInfo,
    selected: openedEditor,
    onSelected: selectEditor,
  };

  if (openedEditor === "text") {
    return (
      <TextView
        id={id}
        name={name}
        textViewType={textViewType}
        lock={lock}
        selectLock={selectLock}
        controlButtons={
          <EditorControls {...sharedControlProps} disabled={wrongArityError} />
        }
      />
    );
  }

  const locker = () => dispatch(lock(name));

  return (
    <DrawerEditor
      tupleInfo={stableTupleInfo}
      type={openedEditor}
      tupleDisplayName={tupleLatexName(name)}
      editorDisplayName={getEditorDisplayName(openedEditor)}
      locker={locker}
      locked={locked}
      error={validation}
      buildControlButtons={(omit) => (
        <EditorControls
          {...sharedControlProps}
          omit={omit}
          teacherMode={teacherMode}
          locked={locked}
          locker={locker}
        />
      )}
    />
  );
}

interface EditorControlsProps {
  id: string;
  tupleInfo: TupleInfo;
  selected: EditorType;
  onSelected: (editor: EditorType) => void;
  omit?: EditorType[];
  disabled?: boolean;
  teacherMode?: boolean;
  locked?: boolean;
  locker?: () => void;
}

function EditorControls({ id, tupleInfo, omit, ...rest }: EditorControlsProps) {
  return (
    <ControlButtons
      id={id}
      buttons={buildEditorControlButtons(tupleInfo, omit)}
      {...rest}
    />
  );
}

export default TupleInterpretationEditor;
