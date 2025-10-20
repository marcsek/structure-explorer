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
  CardBody,
  Stack,
  ToggleButton,
  DropdownButton,
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
      value: "bipartite",
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
            lockChecker={interpretation?.locked}
            locker={locker}
            onChange={onChange}
            error={error}
          />
        ) : (
          <span className="input-group-text mb-3 w-auto">
            <InlineMath>{prefixRawNoEnd}</InlineMath>
          </span>
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
        <div className="d-flex flex-column gap-3">
          <GraphToolbar id={name} type={selectedEditor} />
          <div className="mb-3">
            <Card className={`${error ? "border-danger" : ""}`}>
              <CardBody>
                <GraphView
                  predName={name}
                  graphType={selectedEditor}
                  enableNodeFiltering={!isFunction}
                  locked={interpretation?.locked}
                />
              </CardBody>
            </Card>
            <p className="text-danger small mt-1">{error?.message}</p>
          </div>
        </div>
      )}
    </>
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
    <ButtonGroup id={id} className="w-auto flex-nowrap mb-3">
      {buttons.map((b) => {
        if ("dropDown" in b) {
          const childValues = b.dropDown!.map((ch) => ch.value);

          return (
            <DropdownButton
              as={ButtonGroup}
              key={buttonId("dropDown")}
              id={buttonId("dropDown")}
              title={b.text}
              variant={
                childValues.includes(selected)
                  ? "secondary"
                  : "outline-secondary"
              }
              disabled={disabled}
            >
              {b.dropDown!.map((item) => (
                <Dropdown.Item
                  key={String(item.value)}
                  active={item.value === selected}
                  onClick={() => onSelected(item.value)}
                >
                  {item.text}
                </Dropdown.Item>
              ))}
            </DropdownButton>
          );
        }

        return (
          <ToggleButton
            id={buttonId(b.value)}
            key={buttonId(b.value)}
            variant={b.value === selected ? "secondary" : "outline-secondary"}
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
