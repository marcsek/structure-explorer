import type { ReactNode } from "react";
import { Button } from "react-bootstrap";

interface Props {
  children: ReactNode;
  sent?: boolean;
  recieved?: boolean;
  change?: boolean;
  win?: boolean;
  lose?: boolean;
  onClick?: () => void;
}

export default function MessageBubble({
  children: message, //react children?
  sent,
  change,
  win,
  lose,
  onClick,
}: Props) {
  const variant =
    win === true
      ? "success"
      : lose === true
      ? "danger"
      : sent
      ? "primary"
      : "light";
  const float = sent ? "float-end" : "float-start";
  const rounded = sent ? "rounded-start-3" : "rounded-end-3";

  return (
    <>
      <div>
        <div
          className={`${float} mb-1 mt-1 p-2 text-wrap rounded-bottom-3 ${rounded} text-bg-${variant}`}
        >
          {message}
        </div>
        {change && (
          <Button variant="link" onClick={onClick} className="float-end">
            Change
          </Button>
        )}
      </div>
    </>
  );
}
