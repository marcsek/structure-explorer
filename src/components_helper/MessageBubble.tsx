import type { ReactNode } from "react";
import { Button } from "react-bootstrap";

interface Props {
  children: ReactNode;
  sent?: boolean;
  recieved?: boolean;
  change?: boolean;
  win?: boolean;
  lose?: boolean;
  fixableLoss?: boolean;
  onClick?: () => void;
}

export default function MessageBubble({
  children: message, //react children?
  sent,
  change,
  win,
  lose,
  onClick,
  fixableLoss,
}: Props) {
  const variant = fixableLoss
    ? "warning"
    : win === true
      ? "success"
      : lose === true
        ? "danger"
        : sent
          ? "primary"
          : "light";

  const float = sent ? "align-self-end" : "align-self-start";
  const rounded = sent ? "rounded-start-4" : "rounded-end-4";

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
          className={`flex-shrink-1 flex-grow-1 mt-1 p-2 text-wrap rounded-bottom-4 ${rounded} ${variant === "light" ? "text-bg-light" : `bg-${variant}-subtle text-${variant}-emphasis`}`}
          style={{ flexBasis: "0%" }}
        >
          {message}
        </div>
      </div>
    </>
  );
}
