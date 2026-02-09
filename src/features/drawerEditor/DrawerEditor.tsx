import "./DrawerEditor.css";

import { Button, CloseButton, Modal, Stack } from "react-bootstrap";
import { EditorToolbar } from "../../features/editorToolbar/components/EditorToolbar";
import GraphView from "../graphView/components/GraphView/GraphView";
import { type EditorType } from "../structure/InterpretationEditor";
import { useState, type ReactNode } from "react";
import { InlineMath } from "react-katex";
import { ForwardSlashIcon } from "../../components_helper/CustomIcons";
import type { InterpretationError } from "../../common/errors";
import MatrixView from "../matrixView/MatrixView";
import DatabaseView from "../databaseView/DatabaseView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faWarning } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from "../../app/hooks";
import {
  removeInvalidEntries,
  type TupleType,
} from "../structure/structureSlice";
import { UndoActions } from "../undoHistory/undoHistory";
import usePreservedSize, { type Size } from "./usePreservedSize";

export type DrawerEditorType = Exclude<EditorType, "text">;

interface DrawerEditorProps {
  tupleName: string;
  type: DrawerEditorType;
  tupleDisplayName: string;
  tupleArity: number;
  tupleType: TupleType;
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

interface DrawerEditorContentProps extends DrawerEditorProps {
  expandedView?: boolean;
  show?: boolean;
  setExpandedView: (value: boolean) => void;
}

function DrawerEditorContent({
  expandedView = false,
  show = true,
  setExpandedView,
  tupleName,
  tupleArity,
  tupleType,
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

  const editorComponent = !show ? (
    <InactiveViewPlaceholder size={preservedSize} />
  ) : type === "matrix" ? (
    <MatrixView
      tupleName={tupleName}
      tupleArity={tupleArity}
      tupleType={tupleType}
      locked={locked}
    />
  ) : type === "database" ? (
    <DatabaseView
      tupleName={tupleName}
      tupleArity={tupleArity}
      tupleType={tupleType}
      locked={locked}
    />
  ) : (
    <GraphView
      tupleName={tupleName}
      tupleType={tupleType}
      graphType={type}
      locked={locked}
      expandedView={expandedView}
      onExpandedViewChange={(expanded) => setExpandedView(expanded)}
    />
  );

  return (
    <Stack
      className={`drawer-editor-container ${expandedView ? "expanded" : ""} ${error ? "error" : ""}`}
    >
      <div className="drawer-editor-header">
        <Stack direction="horizontal">
          <EditorTitle base={tupleDisplayName} editor={editorDisplayName} />
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
        {type !== "database" && (
          <div className="drawer-editor-toolbar-container">
            <EditorToolbar id={tupleName} />
          </div>
        )}

        {error && (
          <EditorError
            error={error}
            onRemoveInvalidClick={() => {
              dispatch(
                removeInvalidEntries({ key: tupleName, type: tupleType }),
              );
              dispatch(UndoActions.checkpoint());
            }}
          />
        )}

        <div
          ref={preservedSizeRef}
          className={`drawer-editor-view-container ${error ? "error" : ""}`}
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
}

function EditorError({ error, onRemoveInvalidClick }: EditorErrorProps) {
  return (
    <div className="drawer-editor-error-container">
      <div className="drawer-editor-error-message">
        <FontAwesomeIcon icon={faWarning} />
        <p>{error.message}</p>
      </div>
      {error.kind !== "semantic" && (
        <Button
          className=""
          size="sm"
          variant="outline-danger"
          onClick={onRemoveInvalidClick}
        >
          <FontAwesomeIcon icon={faTrash} size="sm" />
          Remove invalid
        </Button>
      )}
    </div>
  );
}

export interface EditorTitleProps {
  base: string;
  editor: string;
}

function EditorTitle({ base, editor }: EditorTitleProps) {
  return (
    <Stack className="drawer-editor-title">
      <span className="drawer-editor-title-primary fw-light">
        <InlineMath>{base}</InlineMath>
      </span>

      <ForwardSlashIcon
        className="drawer-editor-title-divider text-body-secondary"
        size="1rem"
      />
      <span className="drawer-editor-title-secondary text-body-secondary text-capitalize fw-medium ">
        {editor}
      </span>
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
