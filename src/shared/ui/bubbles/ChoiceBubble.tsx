import { Button } from "react-bootstrap";
import { InlineMath } from "react-katex";

export interface ChoiceBubble {
  value: string;
  onClick: () => void;
}

export interface ChoiceBubblesProps {
  id: number;
  type: string;
  bubbles: ChoiceBubble[];
}

export default function ChoiceBubbles({ bubbles }: ChoiceBubblesProps) {
  return (
    <div>
      {bubbles.map(({ value, onClick }) => {
        return (
          <Button
            key={value}
            size="sm"
            variant="outline-primary d-inline m-1"
            onClick={onClick}
          >
            <InlineMath>{value}</InlineMath>
          </Button>
        );
      })}
    </div>
  );
}
