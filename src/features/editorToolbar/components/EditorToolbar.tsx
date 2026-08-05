import "./EditorToolbar.css";

import DomainSelector from "./DomainSelector";
import InterpretationFilters from "./InterpretationFilters";
import type { TupleInfo } from "../../structure/tupleInfo";

export type EditorFilters =
  | "intrFilters"
  | "domainSelector"
  | "unaryFilterToggle";

export interface GraphToolbarProps {
  tupleInfo: TupleInfo;
  disabledFilters?: EditorFilters[];
}

export function EditorToolbar({
  tupleInfo,
  disabledFilters = [],
}: GraphToolbarProps) {
  return (
    <div className="editor-toolbar">
      <InterpretationFilters
        tupleInfo={tupleInfo}
        disabledFilters={disabledFilters}
      />
      <DomainSelector
        tupleInfo={tupleInfo}
        disabled={disabledFilters.includes("domainSelector")}
      />
    </div>
  );
}
