import "./EditorToolbar.css";

import DomainSelector from "./DomainSelector";
import InterpretationFilters from "./InterpretationFilters";
import type { TupleType } from "../../structure/structureSlice";

export interface GraphToolbarProps {
  tupleName: string;
  tupleType: TupleType;
}

export function EditorToolbar({ tupleName, tupleType }: GraphToolbarProps) {
  return (
    <div className="editor-toolbar">
      <InterpretationFilters tupleName={tupleName} tupleType={tupleType} />
      <DomainSelector tupleName={tupleName} tupleType={tupleType} />
    </div>
  );
}
