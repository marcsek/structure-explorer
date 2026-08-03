import type { ReactNode } from "react";
import { Button, Dropdown, DropdownButton } from "react-bootstrap";
import type { ChoiceBubble } from "./ChoiceBubble";

interface Props {
  id: number;
  title: ReactNode;
  type: string;
  bubbles: ChoiceBubble[];
}

export default function SelectBubble({ title, bubbles }: Props) {
  return (
    <div>
      <DropdownButton title={title} size="sm">
        {bubbles.map(({ value, onClick }) => (
          <Dropdown.Item key={value} as={Button} size="sm" onClick={onClick}>
            {value}
          </Dropdown.Item>
        ))}
      </DropdownButton>
    </div>
  );
}
