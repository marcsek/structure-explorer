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
import { ForwardSlashIcon } from "../../components_helper/CustomIcons";

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
          <EditorHeader
            base={prefixRawNoEnd}
            editor={editorTypeFullNameLookup[selectedEditor]}
          />
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
        <Stack gap={2}>
          <GraphToolbar id={name} type={selectedEditor} />
          <div>
            <Card className="border-0">
              <Card.Body
                className={`p-2 border rounded ${error ? "border-danger" : "border-light-subtle"}`}
              >
                <GraphView
                  predName={name}
                  graphType={selectedEditor}
                  enableNodeFiltering={!isFunction}
                  locked={interpretation?.locked}
                />
              </Card.Body>
            </Card>
            <p className="text-danger small mt-1 mb-0">{error?.message}</p>
          </div>
        </Stack>
      )}
    </Stack>
  );
}

interface EditorHeaderProps {
  base: string;
  editor: string;
}

function EditorHeader({ base, editor }: EditorHeaderProps) {
  return (
    <Stack direction="horizontal" className="flex-grow-1" gap={3}>
      <Stack
        direction="horizontal"
        className="input-group-text flex-shrink-0 justify-content-center align-items-center"
        gap={2}
      >
        <span className="text-body-secondary fw-light">
          <InlineMath>{base}</InlineMath>
        </span>

        <ForwardSlashIcon className="text-body-secondary" size="1rem" />
        <span className="text-body text-capitalize fw-medium">{editor}</span>
      </Stack>
      <div className="dashed-hr" />
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
      {buttons.map((button) => {
        if ("dropDown" in button) {
          const childValues = button.dropDown.map((ch) => ch.value);
          const isActive = childValues.includes(selected);

          return (
            <Dropdown as={ButtonGroup} key={buttonId("dropDown")}>
              <Dropdown.Toggle
                id={buttonId("dropDown")}
                className="btn-bd-light-outline"
                disabled={disabled}
                active={isActive}
              >
                {button.text}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {button.dropDown!.map((item) => (
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
            id={buttonId(button.value)}
            key={buttonId(button.value)}
            className="btn-bd-light-outline"
            value={button.value}
            name={id}
            type="radio"
            title={`${button.value} editor`}
            disabled={disabled}
            checked={button.value === selected}
            onChange={() => onSelected(button.value)}
          >
            {button.text}
          </ToggleButton>
        );
      })}
    </ButtonGroup>
  );
}
