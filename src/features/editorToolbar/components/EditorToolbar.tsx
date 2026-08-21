import "./EditorToolbar.css";

import DomainSelector from "./DomainSelector";
import InterpretationFilters from "./InterpretationFilters";
import type { TupleInfo } from "../../structure/tupleInfo";

export type EditorFilters =
  "intrFilters" | "domainSelector" | "unaryFilterToggle";

export interface EditorToolbarProps {
  id: string;
  tupleInfo: TupleInfo;
  disabledFilters?: EditorFilters[];
}

export default function EditorToolbar({
  id,
  tupleInfo,
  disabledFilters = [],
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      <InterpretationFilters
        tupleInfo={tupleInfo}
        disabledFilters={disabledFilters}
      />
      <DomainSelector
        id={id}
        tupleInfo={tupleInfo}
        disabled={disabledFilters.includes("domainSelector")}
      />
    </div>
  );
}
