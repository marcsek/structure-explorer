import { useAppSelector } from "../../app/hooks";
import DrawerEditor from "../drawerEditor/DrawerEditor";
import { selectValidation } from "../textView/textViewSlice";
import { selectHasWrongArityError } from "./structureSlice";
import ControlButtons from "../../shared/ui/ControlButtons/ControlButtons";
import { editorDescriptors } from "../editors/editorRegistry";
import { buildEditorControlButtons } from "../editors/editorControlButtons";
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
  const {
    tupleInfo: stableTupleInfo,
    openedEditor,
    selectEditor,
  } = useOpenedEditor(tupleInfo);

  const { name, type } = stableTupleInfo;

  const validation = useAppSelector((state) =>
    selectValidation(state, textViewType, name),
  );
  const wrongArityError = useAppSelector((state) =>
    selectHasWrongArityError(state, name, type),
  );

  const sharedControlProps = {
    id: `controls-${id}`,
    tupleInfo: stableTupleInfo,
    selected: openedEditor,
    onSelected: selectEditor,
  };

  const descriptor = editorDescriptors[openedEditor];

  if (descriptor.surface === "standalone") {
    const StandaloneEditor = descriptor.component;

    return (
      <StandaloneEditor
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

  return (
    <DrawerEditor
      id={id}
      tupleInfo={stableTupleInfo}
      descriptor={descriptor}
      tupleDisplayName={tupleLatexName(name)}
      lock={lock}
      selectLock={selectLock}
      error={validation}
      buildControlButtons={(omit) => (
        <EditorControls {...sharedControlProps} omit={omit} />
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
