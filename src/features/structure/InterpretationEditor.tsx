import { useState, type ChangeEvent } from "react";
import type { RootState } from "../../app/store";
import type { InterpretationState } from "./structureSlice";
import { useAppSelector } from "../../app/hooks";
import {
  selectParsedConstants,
  selectParsedPredicates,
} from "../language/languageSlice";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { InlineMath } from "react-katex";
import { Button } from "react-bootstrap";
import GraphView from "../graphView/components/GraphView/GraphView";

interface InterpretationEditorProps {
  name: string;
  id: string;
  selector: (state: RootState, name: string) => InterpretationState;
  parser: (state: RootState, name: string) => { error?: Error };
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
}

export default function InterpretationEditorProps({
  name,
  id,
  selector,
  parser,
  onChange,
  locker,
}: InterpretationEditorProps) {
  const [graphViewEnabled, setGraphViewEnabled] = useState(false);

  const interpretation = useAppSelector((state) => selector(state, name));
  const isBinary = useAppSelector(
    (state) => selectParsedPredicates(state).parsed?.get(name) === 2,
  );
  const { error } = useAppSelector((state) => parser(state, name));
  const escapedName = name.replace(/_/g, "\\_");
  const constants = useAppSelector(selectParsedConstants);

  const isConstant = constants.parsed?.has(name) ?? false;
  const prefixRaw = String.raw`i(\text{\textsf{${escapedName}}}) = ${isConstant ? "" : "\\{"}`;
  const suffixRaw = String.raw`\}`;

  const controlButtons = isBinary && (
    <>
      <Button
        variant="outline-secondary"
        onClick={() => setGraphViewEnabled(!graphViewEnabled)}
      >
        Graph
      </Button>
      <Button variant="outline-secondary">Matrix</Button>
    </>
  );

  return (
    <>
      <InputGroupTitle
        label=""
        id={id}
        prefix={<InlineMath>{prefixRaw}</InlineMath>}
        suffix={isConstant ? "" : <InlineMath>{suffixRaw}</InlineMath>}
        controlButtons={controlButtons}
        placeholder=""
        text={interpretation?.text ?? ""}
        lockChecker={interpretation?.locked ?? false}
        locker={locker}
        onChange={onChange}
        error={error}
      />

      {graphViewEnabled && <GraphView predName={name} />}
    </>
  );
}
