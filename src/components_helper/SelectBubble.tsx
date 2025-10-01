import type { ReactNode } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";

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
        <DropdownButton title={title}>
          {choices.map((choice, index) => (
            <Dropdown.Item key={choice} onClick={() => onclicks[index]()}>
              {choice}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>
    </>
  );
}
