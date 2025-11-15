import "./EditorToolbar.css";

import type { GraphType } from "../../graphView/graphs/plugins";
import DomainSelector from "./DomainSelector";
import InterpretationFilters from "./InterpretationFilters";

export interface GraphToolbarProps {
  id: string;
  type: GraphType;
}

export function GraphToolbar({ id, type }: GraphToolbarProps) {
  return (
    <div className="editor-toolbar">
      <InterpretationFilters id={id} type={type} />
      <DomainSelector id={id} type={type} />
    </div>
  );
}
