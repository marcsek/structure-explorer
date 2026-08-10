import "./DrawerEditor.css";

import {
  Button,
  ButtonGroup,
  CloseButton,
  Modal,
  Stack,
} from "react-bootstrap";
import { EditorToolbar } from "../../features/editorToolbar/components/EditorToolbar";
import type { EditorType } from "../editors/editorTypes";
import {
  tupleTypeToTextViewType,
  type TupleInfo,
} from "../structure/tupleInfo";
import { useState, type ReactNode } from "react";
import { InlineMath } from "react-katex";
import { ForwardSlashIcon } from "../../shared/ui/CustomIcons";
import type { InterpretationError } from "../../shared/core/errors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faTrash, faWarning } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { removeInvalidEntries } from "../structure/structureSlice";
import { UndoActions } from "../undoHistory/undoHistory";
import usePreservedSize, { type Size } from "./usePreservedSize";
import type { DrawerEditorDescriptor } from "../editors/editorRegistry";
import { fullscreenOmittedEditors } from "../editors/editorControlButtons";
import type { ErrorOverride } from "../editors/editorSurface";
import LockButton from "../../shared/ui/LockButton";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { selectTeacherMode } from "../teacherMode/teacherModeSlice";
import { selectValidation } from "../textView/textViewSlice";

interface DrawerEditorProps {
  id: string;
  tupleInfo: TupleInfo;
  descriptor: DrawerEditorDescriptor;
  tupleDisplayName: string;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
  buildControlButtons: (omit?: EditorType[]) => ReactNode;
}

export default function DrawerEditor(props: DrawerEditorProps) {
  const [expandedView, setExpandedView] = useState(false);

  return (
    <>
      <Modal
        show={expandedView}
        onHide={() => setExpandedView(false)}
        className="structure-explorer"
        dialogClassName="drawer-editor-modal-dialog"
        contentClassName="drawer-editor-modal-content"
        centered
      >
        <DrawerEditorContent
          expandedView
          setExpandedView={setExpandedView}
          {...props}
        />
      </Modal>

      <DrawerEditorContent
        setExpandedView={setExpandedView}
        show={!expandedView}
        {...props}
      />
    </>
  );
}

export interface DrawerEditorContentProps extends DrawerEditorProps {
  expandedView?: boolean;
  show?: boolean;
  setExpandedView: (value: boolean) => void;
}

function DrawerEditorContent({
  id,
  expandedView = false,
  show = true,
  setExpandedView,
  tupleInfo,
  descriptor,
  lock,
  selectLock,
  buildControlButtons,
  tupleDisplayName,
}: DrawerEditorContentProps) {
  const dispatch = useAppDispatch();
  const locked = useAppSelector((state) => selectLock(state, tupleInfo.name));
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

  const tupleTextViewType = tupleTypeToTextViewType(tupleInfo.type);
  const error = useAppSelector((state) =>
    selectValidation(state, tupleTextViewType, tupleInfo.name),
  );

  const { ref: preservedSizeRef, size: preservedSize } =
    usePreservedSize<HTMLDivElement>();
  const [errorOverride, setErrorOverride] = useState<ErrorOverride | null>(
    null,
  );

  const EditorComponent = descriptor.component;
  const editorComponent = show ? (
    <EditorComponent
      tupleInfo={tupleInfo}
      locked={locked}
      expandedView={expandedView}
      setExpandedView={setExpandedView}
      setErrorOverride={setErrorOverride}
    />
  ) : (
    <InactiveViewPlaceholder size={preservedSize} />
  );

  const shouldOverrideError = errorOverride?.editor === descriptor.type;
  const finalError = shouldOverrideError ? errorOverride.error : error;

  const onFixButtonClick = () => {
    if (shouldOverrideError) {
      errorOverride.onFixButtonClick();
    } else {
      dispatch(removeInvalidEntries({ tupleInfo }));
      dispatch(UndoActions.checkpoint());
    }
  };

  return (
    <Stack
      className={`drawer-editor-container ${expandedView ? "expanded" : ""} ${finalError ? "error" : ""}`}
    >
      <div className="drawer-editor-header">
        <Stack direction="horizontal">
          <EditorTitle
            base={tupleDisplayName}
            editor={descriptor.displayName}
            locked={locked}
          />

          <EditorControlsGroup
            id={id}
            expandedView={expandedView}
            closeExpandedView={() => setExpandedView(false)}
            controlButtons={buildControlButtons(
              expandedView ? fullscreenOmittedEditors : undefined,
            )}
            locker={() => dispatch(lock(tupleInfo.name))}
            locked={locked}
            teacherMode={teacherMode}
          />
        </Stack>
      </div>

      <Stack className="drawer-editor-container-body">
        {descriptor.toolbar && (
          <div className="drawer-editor-toolbar-container">
            <EditorToolbar
              tupleInfo={tupleInfo}
              disabledFilters={descriptor.toolbar.disabledFilters}
            />
          </div>
        )}

        {finalError && (
          <EditorError
            error={finalError}
            onFixButtonClick={onFixButtonClick}
            fixButton={shouldOverrideError && errorOverride.fixButton}
          />
        )}

        <div
          ref={preservedSizeRef}
          className={`drawer-editor-view-container ${finalError ? "error" : ""}`}
        >
          {editorComponent}
        </div>
      </Stack>
    </Stack>
  );
}

interface EditorControlsGroupProps {
  id: string;
  expandedView: boolean;
  closeExpandedView: () => void;
  teacherMode: boolean;
  locker: () => void;
  locked: boolean;
  controlButtons: React.ReactNode;
}

function EditorControlsGroup({
  id,
  expandedView,
  closeExpandedView,
  teacherMode,
  locker,
  locked,
  controlButtons,
}: EditorControlsGroupProps) {
  return (
    <Stack
      direction="horizontal"
      className="drawer-editor-header-control-group"
    >
      <ButtonGroup
        id={`controls-${id}`}
        className="editor-controls-buttons-group btn-fix-height"
        size="sm"
      >
        {controlButtons}

        {teacherMode && <LockButton locker={locker} locked={locked} />}
      </ButtonGroup>

      {expandedView && <CloseButton onClick={() => closeExpandedView()} />}
    </Stack>
  );
}

interface EditorErrorProps {
  error: InterpretationError;
  onFixButtonClick: () => void;
  fixButton?: ReactNode;
}

function EditorError({ error, onFixButtonClick, fixButton }: EditorErrorProps) {
  return (
    <div className="drawer-editor-error-container">
      <div className="drawer-editor-error-message">
        <FontAwesomeIcon icon={faWarning} size="sm" />
        <p>{error.message}</p>
      </div>

      {error.kind !== "semantic" && (
        <Button
          className=""
          size="sm"
          variant="outline-danger"
          onClick={onFixButtonClick}
        >
          {fixButton ?? (
            <>
              <FontAwesomeIcon icon={faTrash} size="sm" />
              Remove invalid
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export interface EditorTitleProps {
  base: string;
  editor: string;
  locked: boolean;
}

function EditorTitle({ base, editor, locked }: EditorTitleProps) {
  return (
    <Stack className="drawer-editor-title">
      <Stack className="drawer-editor-breadcrumbs">
        <span className="drawer-editor-title-primary fw-light">
          <InlineMath>{base}</InlineMath>
        </span>

        <ForwardSlashIcon className="drawer-editor-title-divider text-body-secondary" />

        <span className="drawer-editor-title-secondary text-body-secondary text-capitalize fw-medium ">
          {editor}
        </span>
      </Stack>

      {locked && (
        <span className="drawer-editor-lock-badge">
          <FontAwesomeIcon icon={faLock} size="sm" />
          Locked
        </span>
      )}
    </Stack>
  );
}

interface InactiveViewPlaceholderProps {
  size: Size | null;
}

function InactiveViewPlaceholder({ size }: InactiveViewPlaceholderProps) {
  return (
    <Stack
      className="align-items-center justify-content-center user-select-none"
      style={{ height: size?.height ?? 0 }}
    >
      Fullscreen view is enabled
    </Stack>
  );
}
