import "./EditorToolbar.css";

import DomainSelector from "./DomainSelector";
import InterpretationFilters from "./InterpretationFilters";
import type { TupleType } from "../../structure/structureSlice";

export type EditorFilters =
  | "intrFilters"
  | "domainSelector"
  | "unaryFilterToggle";

export interface GraphToolbarProps {
  tupleName: string;
  tupleType: TupleType;
  disabledFilters?: EditorFilters[];
}

export function EditorToolbar({
  tupleName,
  tupleType,
  disabledFilters = [],
}: GraphToolbarProps) {
  return (
    <div className="editor-toolbar">
      <InterpretationFilters
        tupleName={tupleName}
        tupleType={tupleType}
        disabledFilters={disabledFilters}
      />
      <DomainSelector
        tupleName={tupleName}
        tupleType={tupleType}
        disabled={disabledFilters.includes("domainSelector")}
      />
    </div>
  );
}
