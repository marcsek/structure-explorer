import "./DrawerEditor.css";

import { Button, Card, CloseButton, Modal, Stack } from "react-bootstrap";
import { GraphToolbar } from "../../features/editorToolbar/components/EditorToolbar";
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

      <DrawerEditorContent setExpandedView={setExpandedView} {...props} />
    </>
  );
}

interface DrawerEditorContentProps extends DrawerEditorProps {
  expandedView?: boolean;
  setExpandedView: (value: boolean) => void;
}

function DrawerEditorContent({
  expandedView = false,
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

  return (
    <>
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
              {buildControlButtons(expandedView ? ["text"] : undefined)}
              {expandedView && (
                <CloseButton onClick={() => setExpandedView(false)} />
              )}
            </Stack>
          </Stack>
        </div>

        <Stack className="drawer-editor-container-body">
          {type !== "database" && (
            <div className="drawer-editor-toolbar-container">
              <GraphToolbar id={tupleName} />
            </div>
          )}

          {error?.message && (
            <div className="drawer-editor-error-container">
              <div className="drawer-editor-error-message">
                <FontAwesomeIcon icon={faWarning} />
                <p className="small m-0">{error?.message}</p>
              </div>
              {error.kind !== "semantic" && (
                <Button
                  className=""
                  variant="outline-danger"
                  size="sm"
                  onClick={() =>
                    dispatch(
                      removeInvalidEntries({ key: tupleName, type: tupleType }),
                    )
                  }
                >
                  <FontAwesomeIcon icon={faTrash} size="sm" />
                  Remove invalid
                </Button>
              )}
            </div>
          )}

          <Stack>
            <Card className="border-0" style={{ height: "100%" }}>
              <Card.Body
                className={`drawer-editor-view-container ${error ? "error" : ""}`}
              >
                {type === "matrix" ? (
                  <MatrixView
                    tupleName={tupleName}
                    tupleArity={tupleArity}
                    tupleType={tupleType}
                    locked={locked}
                    expandedView={expandedView}
                  />
                ) : type === "database" ? (
                  <DatabaseView
                    tupleName={tupleName}
                    tupleArity={tupleArity}
                    tupleType={tupleType}
                    locked={locked}
                    expandedView={expandedView}
                    error={error?.message}
                  />
                ) : (
                  <GraphView
                    predName={tupleName}
                    graphType={type}
                    locked={locked}
                    expandedView={expandedView}
                    onExpandedViewChange={(expanded) =>
                      setExpandedView(expanded)
                    }
                  />
                )}
              </Card.Body>
            </Card>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}

export interface EditorTitleProps {
  base: string;
  editor: string;
}

function EditorTitle({ base, editor }: EditorTitleProps) {
  return (
    <Stack className="drawer-editor-title">
      <span className="fw-light">
        <InlineMath>{base}</InlineMath>
      </span>

      <ForwardSlashIcon className="text-body-secondary" size="1rem" />
      <span className="text-body-secondary text-capitalize fw-medium">
        {editor}
      </span>
    </Stack>
  );
}
