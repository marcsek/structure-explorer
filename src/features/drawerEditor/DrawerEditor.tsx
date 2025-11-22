import "./DrawerEditor.css";

import { Card, CloseButton, Modal, Stack } from "react-bootstrap";
import { GraphToolbar } from "./EditorToolbar/EditorToolbar";
import GraphView from "../graphView/components/GraphView/GraphView";
import { type EditorType } from "../structure/InterpretationEditor";
import { useState, type ReactNode } from "react";
import { InlineMath } from "react-katex";
import { ForwardSlashIcon } from "../../components_helper/CustomIcons";

export type DrawerEditorType = Exclude<EditorType, "text">;

interface DrawerEditorProps {
  predicateName: string;
  type: DrawerEditorType;
  predicateDisplayName: string;
  editorDisplayName: string;
  controlButtons: ReactNode;
  locked?: boolean;
  error?: Error;
}

export default function DrawerEditor(props: DrawerEditorProps) {
  const [expandedView, setExpandedView] = useState(false);

  return (
    <>
      <Modal
        show={expandedView}
        onHide={() => setExpandedView(false)}
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
  predicateName,
  type,
  controlButtons,
  predicateDisplayName,
  editorDisplayName,
  locked = false,
  error,
}: DrawerEditorContentProps) {
  return (
    <>
      <Stack
        className={`drawer-editor-container ${expandedView ? "expanded" : ""} ${error ? "error" : ""}`}
      >
        <div className="drawer-editor-header">
          <Stack direction="horizontal">
            <EditorTitle
              base={predicateDisplayName}
              editor={editorDisplayName}
            />
            <Stack
              direction="horizontal"
              className="drawer-editor-header-control-group"
            >
              {controlButtons}
              {expandedView && (
                <CloseButton onClick={() => setExpandedView(false)} />
              )}
            </Stack>
          </Stack>
        </div>
        <Stack className="drawer-editor-container-body">
          {type !== "matrix" && (
            <>
              <div className="drawer-editor-toolbar-container">
                <GraphToolbar id={predicateName} type={type} />
              </div>

              <Stack>
                <Card className="border-0" style={{ height: "100%" }}>
                  <Card.Body
                    className={`drawer-editor-view-container ${error ? "error" : ""}`}
                  >
                    <GraphView
                      predName={predicateName}
                      graphType={type}
                      locked={locked}
                      expandedView={expandedView}
                      onExpandedViewChange={(expanded) =>
                        setExpandedView(expanded)
                      }
                    />
                  </Card.Body>
                  {expandedView && error?.message && (
                    <p className="text-danger small m-1">{error?.message}</p>
                  )}
                </Card>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
      {!expandedView && (
        <p className="text-danger small m-0">{error?.message}</p>
      )}
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
