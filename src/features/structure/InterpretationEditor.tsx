import React, { useState, type ChangeEvent } from "react";
import type { RootState } from "../../app/store";
import type { InterpretationState } from "./structureSlice";
import { useAppSelector } from "../../app/hooks";
import {
  selectParsedFunctions,
  selectParsedPredicates,
} from "../language/languageSlice";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { InlineMath } from "react-katex";
import {
  ButtonGroup,
  Card,
  Stack,
  ToggleButton,
  Dropdown,
} from "react-bootstrap";
import GraphView from "../graphView/components/GraphView/GraphView";

import {
  faDiagramProject,
  faPen,
  faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type GraphType } from "../graphView/graphs/plugins";
import { GraphToolbar } from "./EditorToolbar/EditorToolbar";

export type EditorType = "text" | "matrix" | GraphType;
export type InterpretationType = "predicate" | "function" | "constant";

interface InterpretationEditorProps {
  id: string;
  name: string;
  type: InterpretationType;
  selector: (state: RootState, name: string) => InterpretationState;
  parser: (state: RootState, name: string) => { error?: Error };
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
}

const editorTypeFullNameLookup: Record<EditorType, string> = {
  oriented: "Oriented Graph",
  hasse: "Hasse Diagram",
  bipartite: "Bipartite Graph",
  matrix: "Matrix Editor",
  text: "Text Editor",
};

export default function InterpretationEditorProps({
  name,
  id,
  type,
  selector,
  parser,
  onChange,
  locker,
}: InterpretationEditorProps) {
  const [selectedEditor, setSelectedEditor] = useState<EditorType>("text");

  const interpretation = useAppSelector((state) => selector(state, name));
  const isTuple = useAppSelector(
    (state) =>
      selectParsedPredicates(state).parsed?.get(name) === 2 ||
      selectParsedFunctions(state).parsed?.get(name) === 1,
  );
  const { error } = useAppSelector((state) => parser(state, name));
  const escapedName = name.replace(/_/g, "\\_");

  const isFunction = type === "function";
  const isConstant = type === "constant";
  const prefixRawNoEnd = String.raw`i(\text{\textsf{${escapedName}}})`;
  const prefixRaw = String.raw`${prefixRawNoEnd} = ${isConstant ? "" : "\\{"}`;
  const suffixRaw = String.raw`\}`;

  const controlButtons: ControlButtonsProps<EditorType>["buttons"] = [
    { text: <FontAwesomeIcon icon={faPen} />, value: "text" },
  ];

  if (isFunction) {
    controlButtons.push({
      text: <FontAwesomeIcon icon={faDiagramProject} />,
      dropDown: [
        {
          text: "Oriented",
          value: "oriented",
        },
        {
          text: "Bipartite",
          value: "bipartite",
        },
      ],
    });
  } else {
    controlButtons.push({
      text: <FontAwesomeIcon icon={faTableCellsLarge} />,
      value: "matrix",
    });
    controlButtons.push({
      text: <FontAwesomeIcon icon={faDiagramProject} />,
      dropDown: [
        {
          text: "Oriented",
          value: "oriented",
        },
        {
          text: "Hasse",
          value: "hasse",
        },
        {
          text: "Bipartite",
          value: "bipartite",
        },
      ],
    });
  }

  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={3} className="align-items-start">
        {selectedEditor === "text" ? (
          <InputGroupTitle
            label=""
            id={id}
            prefix={<InlineMath>{prefixRaw}</InlineMath>}
            suffix={isConstant ? "" : <InlineMath>{suffixRaw}</InlineMath>}
            placeholder=""
            text={interpretation?.text ?? ""}
            lockChecker={interpretation?.locked}
            locker={locker}
            onChange={onChange}
            error={error}
          />
        ) : (
          <Stack direction="horizontal" className="flex-grow-1" gap={3}>
            <Stack
              direction="horizontal"
              className="input-group-text w-auto flex-wrap flex-shrink-0"
              gap={3}
            >
              <span className="text-body-secondary fw-light">
                <InlineMath>{prefixRawNoEnd}</InlineMath>
              </span>

              <span className="text-body-secondary">/</span>
              <span className="text-body text-capitalize fw-medium">
                {editorTypeFullNameLookup[selectedEditor]}
              </span>
            </Stack>
            <svg
              width="100%"
              style={{
                height: "1px",
                width: "100%",
              }}
            >
              <line
                x1="0"
                y1="1"
                x2="100%"
                y2="1"
                stroke="var(--bs-light-border-subtle)"
                strokeWidth="2"
                strokeDasharray="16 16"
                strokeDashoffset="2"
              />
            </svg>
          </Stack>
        )}

        {isTuple && (
          <ControlButtons
            id={`controls-${id}`}
            buttons={controlButtons}
            selected={selectedEditor}
            onSelected={setSelectedEditor}
          />
        )}
      </Stack>

      {selectedEditor !== "text" && selectedEditor !== "matrix" && (
        <Stack gap={2} className="border border-light-subtle border-0 rounded">
          <GraphToolbar id={name} type={selectedEditor} />
          <div>
            <Card className={`${error ? "border-danger" : "border-0"}`}>
              <Card.Body className="p-2 border border-light-subtle rounded">
                <GraphView
                  predName={name}
                  graphType={selectedEditor}
                  enableNodeFiltering={!isFunction}
                  locked={interpretation?.locked}
                />
              </Card.Body>
            </Card>
            <p className="text-danger small mt-1">{error?.message}</p>
          </div>
        </Stack>
      )}
    </Stack>
  );
}

interface ControlButtonsProps<T> {
  id: string;
  buttons: (
    | {
        text: React.ReactNode;
        value: T;
      }
    | {
        text: React.ReactNode;
        dropDown: { text: React.ReactNode; value: T }[];
      }
  )[];
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
    <ButtonGroup id={id} className="ms-auto">
      {buttons.map((b) => {
        if ("dropDown" in b) {
          const childValues = b.dropDown!.map((ch) => ch.value);
          const isActive = childValues.includes(selected);

          return (
            <Dropdown as={ButtonGroup} key={buttonId("dropDown")}>
              <Dropdown.Toggle
                id={buttonId("dropDown")}
                disabled={disabled}
                variant={isActive ? "secondary" : "outline-secondary"}
              >
                {b.text}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {b.dropDown!.map((item) => (
                  <Dropdown.Item
                    key={String(item.value)}
                    active={item.value === selected}
                    onClick={() => onSelected(item.value)}
                  >
                    {item.text}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          );
        }

        return (
          <ToggleButton
            id={buttonId(b.value)}
            key={buttonId(b.value)}
            variant="outline-secondary"
            value={b.value}
            name={id}
            type="radio"
            title={`${b.value} editor`}
            disabled={disabled}
            checked={b.value === selected}
            onChange={() => onSelected(b.value)}
          >
            {b.text}
          </ToggleButton>
        );
      })}
    </ButtonGroup>
  );
}
