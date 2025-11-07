import { Card, Stack } from "react-bootstrap";
import TooltipButton from "./TooltipButton";

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
    <Card>
      <Card.Header as="h4">
        <Stack direction="horizontal">
          {heading}
          {help && <TooltipButton text={help}></TooltipButton>}
        </Stack>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
}
