import { Accordion, Card, Stack, useAccordionButton } from "react-bootstrap";
import TooltipButton from "../TooltipButton";

interface ComponentCardProps {
  heading: React.ReactNode;
  eventKey: string;
  help?: React.ReactNode;
  children?: React.ReactNode;
}

export default function ComponentCard({
  heading,
  eventKey,
  help,
  children,
}: ComponentCardProps) {
  const onAccordionClick = useAccordionButton(eventKey);

  return (
    <div className="component-card">
      <Card.Header
        className="component-card-header"
        onClick={onAccordionClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onAccordionClick(e);
          }
        }}
      >
        <Stack direction="horizontal">
          <h5 className="m-0">{heading}</h5>
          {help && <TooltipButton text={help}></TooltipButton>}
        </Stack>
      </Card.Header>
      <Accordion.Collapse eventKey={eventKey}>
        <Card.Body>{children}</Card.Body>
      </Accordion.Collapse>
    </div>
  );
}
