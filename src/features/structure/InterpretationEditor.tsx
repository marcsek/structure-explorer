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
import { ButtonGroup, Stack, ToggleButton, Dropdown } from "react-bootstrap";

import {
  faDiagramProject,
  faPen,
  faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type GraphType } from "../graphView/graphs/plugins";
import DrawerEditor from "../drawerEditor/DrawerEditor";
import type { EditorTitleProps } from "../drawerEditor/EditorTitle";
import EditorTitle from "../drawerEditor/EditorTitle";

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
      <Stack
        direction="horizontal"
        gap={3}
        className={`align-items-start ${selectedEditor !== "text" ? "flex-wrap" : ""} `}
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

      {selectedEditor !== "text" && (
        <DrawerEditor
          predicateName={name}
          type={selectedEditor}
          predicateDisplayName={prefixRawNoEnd}
          editorDisplayName={editorTypeFullNameLookup[selectedEditor]}
          locked={interpretation?.locked}
          error={error}
        />
      )}
    </Stack>
  );
}

function EditorHeader(props: EditorTitleProps) {
  return (
    <Stack direction="horizontal" className="flex-grow-1" gap={3}>
      <EditorTitle {...props} />
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
                role="toolbar"
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
            type="radio"
            name={id}
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
