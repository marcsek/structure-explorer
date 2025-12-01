import React, { useState, type ChangeEvent } from "react";
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
import { selectTeacherMode } from "../teacherMode/teacherModeslice";
import LockButton from "../../components_helper/LockButton";
import {
  selectValidatedTextView,
  type TextViewTypes,
} from "../textView/textViewSlice";
import type { RootState } from "../../app/store";

export type EditorType = "text" | "matrix" | GraphType;
export type InterpretationType = "predicate" | "function" | "constant";

interface InterpretationEditorProps {
  id: string;
  name: string;
  type: InterpretationType;
  textViewType: TextViewTypes;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
  lockSelector: (state: RootState, name: string) => boolean;
}

const editorTypeFullNameLookup: Record<EditorType, string> = {
  oriented: "Oriented Graph",
  hasse: "Hasse Diagram",
  bipartite: "Bipartite Graph",
  matrix: "Matrix Editor",
  text: "Text Editor",
};

const omitControlButtons = (
  controlButtons: ControlButtonsProps<EditorType>["buttons"],
  omit: EditorType[],
) => {
  if (omit.length === 0) return controlButtons;

  return controlButtons.filter(({ value }) =>
    Array.isArray(value)
      ? value.every((v) => !omit.includes(v))
      : !omit.includes(value),
  );
};

export default function InterpretationEditorProps({
  name,
  id,
  type,
  textViewType,
  onChange,
  locker,
  lockSelector,
}: InterpretationEditorProps) {
  const [selectedEditor, setSelectedEditor] = useState<EditorType>("text");

  const textView = useAppSelector((state) =>
    selectValidatedTextView(state, textViewType, name),
  );

  const locked = useAppSelector((state) => lockSelector(state, name));

  const isTuple = useAppSelector(
    (state) =>
      selectParsedPredicates(state).parsed?.get(name) === 2 ||
      selectParsedFunctions(state).parsed?.get(name) === 1,
  );
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

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
      value: ["oriented", "bipartite"],
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
      value: ["oriented", "hasse", "bipartite"],
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
    <Stack gap={0}>
      {/* TODO: Redundant. Keeping it in case something gets added. */}
      <Stack
        direction="horizontal"
        gap={3}
        className={`align-items-start ${selectedEditor !== "text" ? "flex-wrap" : ""} `}
      >
        {selectedEditor === "text" && (
          <InputGroupTitle
            label=""
            id={id}
            prefix={<InlineMath>{prefixRaw}</InlineMath>}
            suffix={isConstant ? "" : <InlineMath>{suffixRaw}</InlineMath>}
            controlButtons={
              isTuple &&
              selectedEditor === "text" && (
                <ControlButtons
                  id={`controls-${id}`}
                  buttons={controlButtons}
                  selected={selectedEditor}
                  onSelected={setSelectedEditor}
                />
              )
            }
            placeholder=""
            text={textView.value}
            lockChecker={locked}
            locker={locker}
            onChange={onChange}
            error={textView.error}
          />
        )}
      </Stack>

      {selectedEditor !== "text" && (
        <DrawerEditor
          predicateName={name}
          type={selectedEditor}
          predicateDisplayName={prefixRawNoEnd}
          editorDisplayName={editorTypeFullNameLookup[selectedEditor]}
          locker={locker}
          locked={locked}
          error={textView.error}
          buildControlButtons={(omit) => (
            <ControlButtons
              id={`controls-${id}`}
              buttons={omitControlButtons(controlButtons, omit ?? [])}
              selected={selectedEditor}
              onSelected={setSelectedEditor}
              teacherMode={teacherMode}
              locked={locked}
              locker={locker}
            />
          )}
        />
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
        value: T[];
        dropDown: { text: React.ReactNode; value: T }[];
      }
  )[];
  selected: T;
  onSelected: (selected: T) => void;
  teacherMode?: boolean;
  locked?: boolean;
  locker?: () => void;
  disabled?: boolean;
}

function ControlButtons<T extends string | number>({
  id,
  buttons,
  selected,
  onSelected,
  teacherMode = false,
  locked = false,
  locker,
  disabled = false,
}: ControlButtonsProps<T>) {
  const buttonId = (value: string | number) => `${id}-${value}`;

  return (
    <ButtonGroup id={id} className="editor-controls-buttons-group">
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

      {locker && teacherMode && <LockButton locker={locker} locked={locked} />}
    </ButtonGroup>
  );
}
