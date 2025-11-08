import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import type { ReactNode } from "react";

interface TooltipButtonProps {
  text: ReactNode;
}

export default function TooltipButton({ text }: TooltipButtonProps) {
  const [show, setShow] = useState(false);

  const popover = (
    <Popover
      className="mw-100 overflow-auto shadow-sm"
      style={{ width: "30rem", maxHeight: "90vh" }}
    >
      <Popover.Body>{text}</Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="auto"
      overlay={popover}
      show={show}
      onToggle={() => setShow(!show)}
    >
      <Button
        className="ms-auto rounded-circle p-1"
        variant="outline-dark"
        style={{ display: "flex" }}
        title="Help"
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <FontAwesomeIcon
          icon={faQuestion}
          size="sm"
          style={{ width: "0.875rem", height: "0.875rem" }}
        />
      </Button>
    </OverlayTrigger>
  );
}
