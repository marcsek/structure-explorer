import "./EditorToolbar.css";

import DomainSelector from "./DomainSelector";
import InterpretationFilters from "./InterpretationFilters";

export interface GraphToolbarProps {
  id: string;
}

export function EditorToolbar({ id }: GraphToolbarProps) {
  return (
    <div className="editor-toolbar">
      <InterpretationFilters id={id} />
      <DomainSelector id={id} />
    </div>
  );
}
