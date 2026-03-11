import "./ComponentCard.css";

import { Card, Stack } from "react-bootstrap";
import TooltipButton from "../TooltipButton";
import type React from "react";

interface ComponentCardProps {
  heading: React.ReactNode;
  help?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function ComponentCard({
  heading,
  help,
  right,
  children,
  className,
}: ComponentCardProps) {
  return (
    <Card className={`component-card ${className ?? ""}`}>
      <Card.Header
        className="component-card-header"
        as={Stack}
        direction="horizontal"
      >
        <Stack className="flex-grow-0" direction="horizontal" gap={3}>
          <h5 className="m-0">{heading}</h5>
          {help && <TooltipButton text={help}></TooltipButton>}
        </Stack>
        {right}
      </Card.Header>
      <Card.Body className="component-card-body">{children}</Card.Body>
    </Card>
  );
}
