import React, { memo, useState, type ChangeEvent } from "react";
import { useAppSelector } from "../../app/hooks";
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
import type { RootState } from "../../app/store";
import type { TextViewType } from "../textView/textViews";
import { selectValidatedTextView } from "../textView/textViewSlice";
import {
  selectHasWrongArityError,
  type InterpretationType,
} from "./structureSlice";
import { useInstanceId } from "../../instanceIdContext";

export type EditorType = "text" | "matrix" | "database" | GraphType;

interface InterpretationEditorProps {
  id: string;
  name: string;
  type: InterpretationType;
  arity?: number;
  textViewType: TextViewType;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
  lockSelector: (state: RootState, name: string) => boolean;
}

const editorTypeFullNameLookup: Record<EditorType, string> = {
  oriented: "Oriented Graph",
  hasse: "Hasse Diagram",
  bipartite: "Bipartite Graph",
  matrix: "Matrix Editor",
  database: "Database Table Editor",
  text: "Text Editor",
};

const omitControlButtons = (
  controlButtons: ControlButtonsProps<EditorType>["buttons"],
  omit: EditorType[],
) => {
  if (omit.length === 0) return controlButtons;

  const filteredButtons = controlButtons
    .map((button) => {
      if (!("dropDown" in button))
        return omit.includes(button.value) ? null : button;

      const filteredValues = button.value.filter((v) => !omit.includes(v));
      const filteredDropdown = button.dropDown.filter(
        ({ value }) => !omit.includes(value),
      );

      if (filteredValues.length === 0) return null;

      return {
        ...button,
        value: filteredValues,
        dropDown: filteredDropdown,
      };
    })
    .filter((button) => button !== null);

  if (filteredButtons.length === 1 && filteredButtons[0].value === "text")
    return [];

  return filteredButtons;
};

function InterpretationEditor({
  name,
  id,
  type,
  textViewType,
  onChange,
  locker,
  lockSelector,
  arity = 0,
}: InterpretationEditorProps) {
  const [selectedEditor, setSelectedEditor] = useState<EditorType>("text");
  const textView = useAppSelector((state) =>
    selectValidatedTextView(state, textViewType, name),
  );
  const locked = useAppSelector((state) => lockSelector(state, name));
  const wrongArityError = useAppSelector((state) =>
    type !== "constant" ? selectHasWrongArityError(state, name, type) : false,
  );
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

  const isFunction = type === "function";
  const isConstant = type === "constant";

  const escapedName = name.replace(/_/g, "\\_");
  const prefixRawNoEnd = String.raw`i(\text{\textsf{${escapedName}}})`;
  const prefixRaw = String.raw`${prefixRawNoEnd} = ${isConstant ? "" : "\\{"}`;
  const suffixRaw = String.raw`\}`;

  const correctedArity = isFunction ? arity + 1 : arity;
  const isTuple = correctedArity === 2;

  const controlButtons: ControlButtonsProps<EditorType>["buttons"] = [
    { text: <FontAwesomeIcon icon={faPen} />, value: "text" },
  ];

  controlButtons.push({
    text: <FontAwesomeIcon icon={faTableCellsLarge} />,
    value: ["matrix", "database"],
    dropDown: [
      {
        text: "Matrix",
        value: "matrix",
      },
      {
        text: "Database",
        value: "database",
      },
    ],
  });

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

  const controlButtonsToOmit: EditorType[] = [];
  if (!isTuple) controlButtonsToOmit.push("hasse", "bipartite", "oriented");
  if (arity > 2) controlButtonsToOmit.push("matrix");
  if (arity > 2 && isFunction) controlButtonsToOmit.push("database");

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
              type !== "constant" &&
              selectedEditor === "text" && (
                <ControlButtons
                  id={`controls-${id}`}
                  buttons={omitControlButtons(
                    controlButtons,
                    controlButtonsToOmit,
                  )}
                  selected={selectedEditor}
                  onSelected={setSelectedEditor}
                  disabled={wrongArityError}
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

      {selectedEditor !== "text" && type !== "constant" && (
        <DrawerEditor
          tupleName={name}
          tupleArity={arity}
          type={selectedEditor}
          tupleType={type}
          tupleDisplayName={prefixRawNoEnd}
          editorDisplayName={editorTypeFullNameLookup[selectedEditor]}
          locker={locker}
          locked={locked}
          error={textView.error}
          buildControlButtons={(omit) => (
            <ControlButtons
              id={`controls-${id}`}
              buttons={omitControlButtons(controlButtons, [
                ...controlButtonsToOmit,
                ...(omit ?? []),
              ])}
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

export default memo(
  InterpretationEditor,
  (prev, next) =>
    prev.name === next.name &&
    prev.id === next.id &&
    prev.type === next.type &&
    prev.textViewType === next.textViewType &&
    prev.arity === next.arity,
);

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
  const instanceId = useInstanceId();

  if (buttons.length === 0) return null;

  return (
    <ButtonGroup id={id} className="editor-controls-buttons-group">
      {buttons.map((button) => {
        if ("dropDown" in button) {
          const childValues = button.dropDown.map((ch) => ch.value);
          const isActive = childValues.includes(selected);

          return (
            <Dropdown as={ButtonGroup} key={buttonId(button.value.join(","))}>
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
                {button.dropDown.map((item) => (
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
            id={buttonId(button.value) + instanceId}
            key={buttonId(button.value)}
            className="btn-bd-light-outline"
            value={button.value}
            type="checkbox"
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
