import type { ReactNode } from "react";
import { Button, Dropdown, DropdownButton } from "react-bootstrap";

interface Props {
  id: number;
  title: ReactNode;
  choices: string[];
  type: string;
  onclicks: (() => void)[];
}

export default function SelectBubble({ title, choices, onclicks }: Props) {
  return (
    <>
      <div>
        <DropdownButton title={title} size="sm">
          {choices.map((choice, index) => (
            <Dropdown.Item
              as={Button}
              size="sm"
              key={choice}
              onClick={() => onclicks[index]()}
            >
              {choice}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>
    </>
  );
}
