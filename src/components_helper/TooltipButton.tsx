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
        variant="outline-info"
        style={{ padding: "0.2rem 0.4rem" }}
        title="Help"
        onClick={() => setShow(!show)}
      >
        <FontAwesomeIcon icon={faQuestion} />
      </Button>
    </OverlayTrigger>
  );
}
