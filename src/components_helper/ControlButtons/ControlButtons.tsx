import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, ButtonGroup, Dropdown } from "react-bootstrap";
import LockButton from "../LockButton";

export type ControlButton<T> =
  | {
      text: React.ReactNode;
      value: T;
    }
  | {
      text: React.ReactNode;
      value: T[];
      dropDown: { text: React.ReactNode; value: T }[];
    };

export interface ControlButtonsProps<T> {
  id: string;
  buttons: ControlButton<T>[];
  selected: T;
  onSelected: (selected: T) => void;
  teacherMode?: boolean;
  locked?: boolean;
  locker?: () => void;
  disabled?: boolean;
}

export default function ControlButtons<T extends string | number>({
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

  if (buttons.length === 0) return null;

  return (
    <ButtonGroup
      id={id}
      className="editor-controls-buttons-group btn-fix-height"
      size="sm"
    >
      <Dropdown as={ButtonGroup} size="sm">
        <Dropdown.Toggle
          id={buttonId("dropDown")}
          className="btn-bd-light-outline"
          disabled={disabled}
          title="Interpretation editors"
        >
          <FontAwesomeIcon icon={faPen} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {buttons.map((button, idx) => {
            if ("dropDown" in button) {
              return (
                <React.Fragment key={String(button.value)}>
                  {idx !== 0 && <Dropdown.Divider />}
                  <Dropdown.ItemText className="drop-down-title-text">
                    {button.text}
                  </Dropdown.ItemText>
                  {button.dropDown.map((item) => (
                    <Dropdown.Item
                      key={String(item.value)}
                      as={Button}
                      size="sm"
                      active={item.value === selected}
                      onClick={() => onSelected(item.value)}
                    >
                      {item.text}
                    </Dropdown.Item>
                  ))}
                </React.Fragment>
              );
            }

            return (
              <Dropdown.Item
                key={String(button.value)}
                as={Button}
                size="sm"
                active={button.value === selected}
                onClick={() => onSelected(button.value)}
              >
                {button.text}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>

      {locker && teacherMode && <LockButton locker={locker} locked={locked} />}
    </ButtonGroup>
  );
}
