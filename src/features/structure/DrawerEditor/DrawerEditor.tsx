import "./DrawerEditor.css";

import { Card, Stack } from "react-bootstrap";
import { GraphToolbar } from "../EditorToolbar/EditorToolbar";
import GraphView from "../../graphView/components/GraphView/GraphView";
import { EditorTitle, type EditorType } from "../InterpretationEditor";
import { useState } from "react";

export type DrawerEditorType = Exclude<EditorType, "text">;

interface DrawerEditorProps {
  predicateName: string;
  type: DrawerEditorType;
  predicateDisplayName: string;
  editorDisplayName: string;
  locked?: boolean;
  error?: Error;
}

export default function DrawerEditor({
  predicateName,
  type,
  predicateDisplayName,
  editorDisplayName,
  locked = false,
  error,
}: DrawerEditorProps) {
  const [expandedView, setExpandedView] = useState(false);

  // TODO
  if (type === "matrix") return null;

  return (
    <div
      className={`drawer-editor-container ${expandedView ? "expanded" : ""} ${error ? "error" : ""}`}
    >
      {expandedView && (
        <div
          className="drawer-editor-expanded-backdrop"
          onClick={() => setExpandedView(false)}
        />
      )}

      <Stack gap={3} className="drawer-container-body">
        {expandedView && (
          <>
            <EditorTitle
              base={predicateDisplayName}
              editor={editorDisplayName}
              style="flat"
            />
            <div className="divider-drawer-container-body" />
          </>
        )}

        <GraphToolbar id={predicateName} type={type} />

        {expandedView && <div className="divider-drawer-container-body" />}

        <Stack gap={1} className="drawer-editor-container">
          <Card className="border-0" style={{ height: "100%" }}>
            <Card.Body
              className={`drawer-editor-container ${!expandedView ? "bordered" : ""} ${error ? "error" : ""}`}
            >
              <GraphView
                predName={predicateName}
                graphType={type}
                locked={locked}
                expandedView={expandedView}
                onExpandedViewChange={(expanded) => setExpandedView(expanded)}
              />
            </Card.Body>
          </Card>
          <p className="text-danger small m-0">{error?.message}</p>
        </Stack>
      </Stack>
    </div>
  );
}
