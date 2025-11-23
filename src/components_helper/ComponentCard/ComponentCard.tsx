import "./ComponentCard.css";

import { Card, Stack } from "react-bootstrap";
import TooltipButton from "../TooltipButton";

interface ComponentCardProps {
  heading: React.ReactNode;
  help?: React.ReactNode;
  children?: React.ReactNode;
}

export default function ComponentCard({
  heading,
  help,
  children,
}: ComponentCardProps) {
  return (
    <Card className="component-card">
      <Card.Header
        className="component-card-header"
        as={Stack}
        direction="horizontal"
      >
        <h5 className="m-0">{heading}</h5>
        {help && <TooltipButton text={help}></TooltipButton>}
      </Card.Header>
      <Card.Body className="component-card-body">{children}</Card.Body>
    </Card>
  );
}
