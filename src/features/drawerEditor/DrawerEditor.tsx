import "./DrawerEditor.css";

import { Button, CloseButton, Modal, Stack } from "react-bootstrap";
import { EditorToolbar } from "../../features/editorToolbar/components/EditorToolbar";
import GraphView from "../graphView/components/GraphView/GraphView";
import {
  type EditorType,
  type TupleInfo,
} from "../structure/InterpretationEditor";
import { useState, type ReactNode } from "react";
import { InlineMath } from "react-katex";
import { ForwardSlashIcon } from "../../shared/ui/CustomIcons";
import type { InterpretationError } from "../../shared/core/errors";
import MatrixView from "../matrixView/MatrixView";
import DatabaseView from "../databaseView/DatabaseView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faTrash, faWarning } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from "../../app/hooks";
import { removeInvalidEntries } from "../structure/structureSlice";
import { UndoActions } from "../undoHistory/undoHistory";
import usePreservedSize, { type Size } from "./usePreservedSize";
import IntervalView from "../caseTreeView/IntervalView";

export type DrawerEditorType = Exclude<EditorType, "text">;

interface DrawerEditorProps {
  tupleInfo: TupleInfo;
  type: DrawerEditorType;
  tupleDisplayName: string;
  editorDisplayName: string;
  buildControlButtons: (omit?: EditorType[]) => ReactNode;
  locker: () => void;
  locked?: boolean;
  error?: InterpretationError;
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

export interface ErrorOverride {
  editor: DrawerEditorType;
  error: InterpretationError;
  fixButton: ReactNode;
  onFixButtonClick: () => void;
}

function DrawerEditorContent({
  expandedView = false,
  show = true,
  setExpandedView,
  tupleInfo,
  type,
  buildControlButtons,
  tupleDisplayName,
  editorDisplayName,
  locked = false,
  error,
}: DrawerEditorContentProps) {
  const dispatch = useAppDispatch();
  const { ref: preservedSizeRef, size: preservedSize } =
    usePreservedSize<HTMLDivElement>();
  const [errorOverride, setErrorOverride] = useState<ErrorOverride | null>(
    null,
  );

  const { type: tupleType, name: tupleName } = tupleInfo;

  const editorComponent = !show ? (
    <InactiveViewPlaceholder size={preservedSize} />
  ) : type === "matrix" ? (
    <MatrixView tupleInfo={tupleInfo} locked={locked} />
  ) : type === "database" ? (
    <DatabaseView tupleInfo={tupleInfo} locked={locked} />
  ) : type === "caseTree" ? (
    <IntervalView tupleInfo={tupleInfo} setErrorOverride={setErrorOverride} />
  ) : (
    <GraphView
      tupleInfo={tupleInfo}
      graphType={type}
      locked={locked}
      expandedView={expandedView}
      onExpandedViewChange={(expanded) => setExpandedView(expanded)}
    />
  );

  const errorShouldOverride = errorOverride?.editor === type;
  const finalError = errorShouldOverride ? errorOverride.error : error;

  return (
    <Stack
      className={`drawer-editor-container ${expandedView ? "expanded" : ""} ${finalError ? "error" : ""}`}
    >
      <div className="drawer-editor-header">
        <Stack direction="horizontal">
          <EditorTitle
            base={tupleDisplayName}
            editor={editorDisplayName}
            locked={locked}
          />
          <Stack
            direction="horizontal"
            className="drawer-editor-header-control-group"
          >
            {buildControlButtons(
              expandedView ? ["text", "matrix", "database"] : undefined,
            )}
            {expandedView && (
              <CloseButton onClick={() => setExpandedView(false)} />
            )}
          </Stack>
        </Stack>
      </div>

      <Stack className="drawer-editor-container-body">
        {type !== "caseTree" && (
          <div className="drawer-editor-toolbar-container">
            <EditorToolbar
              tupleName={tupleName}
              tupleType={tupleType}
              disabledFilters={
                type === "database"
                  ? ["domainSelector", "unaryFilterToggle"]
                  : []
              }
            />
          </div>
        )}

        {finalError && (
          <EditorError
            error={finalError}
            onRemoveInvalidClick={() => {
              if (errorShouldOverride) {
                errorOverride.onFixButtonClick();
              } else {
                dispatch(
                  removeInvalidEntries({ key: tupleName, type: tupleType }),
                );
                dispatch(UndoActions.checkpoint());
              }
            }}
            fixButton={errorShouldOverride && errorOverride.fixButton}
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

interface EditorErrorProps {
  error: InterpretationError;
  onRemoveInvalidClick: () => void;
  fixButton?: ReactNode;
}

function EditorError({
  error,
  onRemoveInvalidClick,
  fixButton,
}: EditorErrorProps) {
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
          onClick={onRemoveInvalidClick}
        >
          {fixButton ? (
            fixButton
          ) : (
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
