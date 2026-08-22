import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, ButtonGroup, Dropdown } from "react-bootstrap";

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
  disabled?: boolean;
}

export default function ControlButtons<T extends string | number>({
  id,
  buttons,
  selected,
  onSelected,
  disabled = false,
}: ControlButtonsProps<T>) {
  const buttonId = (value: string | number) => `${id}-${value}`;

  if (buttons.length === 0) return null;

  return (
    <Dropdown as={ButtonGroup} size="sm" id={`dropdown-${id}`}>
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

                {button.dropDown.map(({ value, text }) => (
                  <Dropdown.Item
                    key={String(value)}
                    as={Button}
                    size="sm"
                    active={value === selected}
                    onClick={() => onSelected(value)}
                  >
                    {text}
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
  );
}
