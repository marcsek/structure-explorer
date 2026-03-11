import { Button } from "react-bootstrap";
import { InlineMath } from "react-katex";

interface Props {
  id: number;
  choices: string[];
  type: string;
  onclicks: (() => void)[];
}

export default function ChoiceBubble({ choices, onclicks }: Props) {
  return (
    <>
      <div>
        {choices.map((choice, index) => {
          return (
            <Button
              key={index}
              size="sm"
              variant="outline-primary d-inline m-1"
              onClick={() => {
                onclicks[index]();
              }}
            >
              <InlineMath>{choice}</InlineMath>
            </Button>
          );
        })}
      </div>
    </>
  );
}
