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
import {
  ButtonGroup,
  Card,
  CardBody,
  Stack,
  ToggleButton,
} from "react-bootstrap";
import GraphView from "../graphView/components/GraphView/GraphView";

interface InterpretationEditorProps {
  name: string;
  id: string;
  selector: (state: RootState, name: string) => InterpretationState;
  parser: (state: RootState, name: string) => { error?: Error };
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
}

type EditorTypes = "text" | "graph" | "matrix";

export default function InterpretationEditorProps({
  name,
  id,
  selector,
  parser,
  onChange,
  locker,
}: InterpretationEditorProps) {
  const [selectedEditor, setSelectedEditor] = useState<EditorTypes>("text");

  const interpretation = useAppSelector((state) => selector(state, name));
  const isBinary = useAppSelector(
    (state) => selectParsedPredicates(state).parsed?.get(name) === 2,
  );
  const { error } = useAppSelector((state) => parser(state, name));
  const escapedName = name.replace(/_/g, "\\_");
  const constants = useAppSelector(selectParsedConstants);

  const isConstant = constants.parsed?.has(name) ?? false;
  const prefixRawNoEnd = String.raw`i(\text{\textsf{${escapedName}}})`;
  const prefixRaw = String.raw`${prefixRawNoEnd} = ${isConstant ? "" : "\\{"}`;
  const suffixRaw = String.raw`\}`;

  const controlButtons: ControlButtonsProps<EditorTypes>["buttons"] = [
    { text: "Text", value: "text" },
    { text: "Graph", value: "graph" },
    { text: "Matrix", value: "matrix" },
  ];

  return (
    <>
      <Stack
        direction="horizontal"
        gap={3}
        className="align-items-start justify-content-between"
      >
        {selectedEditor === "text" ? (
          <InputGroupTitle
            label=""
            id={id}
            prefix={<InlineMath>{prefixRaw}</InlineMath>}
            suffix={isConstant ? "" : <InlineMath>{suffixRaw}</InlineMath>}
            placeholder=""
            text={interpretation?.text ?? ""}
            lockChecker={interpretation?.locked ?? false}
            locker={locker}
            onChange={onChange}
            error={error}
          />
        ) : (
          <span className="input-group-text mb-3 w-auto">
            <InlineMath>{prefixRawNoEnd}</InlineMath>
          </span>
        )}

        {isBinary && (
          <ControlButtons
            id={`controls-${id}`}
            buttons={controlButtons}
            selected={selectedEditor}
            onSelected={setSelectedEditor}
            disabled={!!error}
          />
        )}
      </Stack>

      {selectedEditor !== "text" && (
        <Card className="mb-3">
          <CardBody>
            <GraphView predName={name} />
          </CardBody>
        </Card>
      )}
    </>
  );
}

interface ControlButtonsProps<T> {
  id: string;
  buttons: { text: string; value: T }[];
  selected: T;
  onSelected: (selected: T) => void;
  disabled?: boolean;
}

function ControlButtons<T extends string | number>({
  id,
  buttons,
  selected,
  onSelected,
  disabled = false,
}: ControlButtonsProps<T>) {
  const buttonId = (value: string | number) => `${id}-${value}`;

  return (
    <ButtonGroup id={id} className="w-auto flex-nowrap mb-3">
      {buttons.map((b) => (
        <ToggleButton
          id={buttonId(b.value)}
          key={buttonId(b.value)}
          variant="outline-secondary"
          value={b.value}
          name={id}
          type="radio"
          disabled={disabled}
          checked={b.value === selected}
          onChange={() => onSelected(b.value)}
        >
          {b.text}
        </ToggleButton>
      ))}
    </ButtonGroup>
  );
}
