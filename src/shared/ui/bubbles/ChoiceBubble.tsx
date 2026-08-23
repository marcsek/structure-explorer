import { Button } from "react-bootstrap";
import { InlineMath } from "react-katex";

export interface ChoiceBubble {
  value: string;
  latex?: boolean;
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
      {bubbles.map(({ value, latex = true, onClick }, idx) => {
        return (
          <Button
            // If number of buttons changes, don't preserve
            key={idx + 2 * bubbles.length}
            size="sm"
            variant="outline-primary d-inline m-1"
            onClick={onClick}
          >
            {latex ? <InlineMath>{value}</InlineMath> : value}
          </Button>
        );
      })}
    </div>
  );
}
