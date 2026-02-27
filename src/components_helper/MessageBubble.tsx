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
  const float = sent ? "align-self-end" : "align-self-start";
  const rounded = sent ? "rounded-start-3" : "rounded-end-3";

  return (
    <>
      <div className={`d-flex ${float} flex-wrap-reverse`}>
        {change && (
          <Button
            variant="link"
            size="sm"
            onClick={onClick}
            className="flex-shrink-0"
          >
            Change
          </Button>
        )}
        <div
          className={` mt-1 p-2 text-wrap rounded-bottom-3 ${rounded} ${variant === "light" ? "text-bg-light" : `bg-${variant}-subtle text-${variant}-emphasis`}`}
        >
          {message}
        </div>
      </div>
    </>
  );
}
