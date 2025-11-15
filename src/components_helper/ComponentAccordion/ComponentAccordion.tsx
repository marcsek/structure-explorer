import "./ComponentAccordion.css";

import { Accordion, Card, type AccordionProps } from "react-bootstrap";

export default function ComponentAccordion({
  as = Card,
  className = "",
  alwaysOpen = true,
  defaultActiveKey,
  children,
  ...props
}: AccordionProps) {
  return (
    <Accordion
      as={as}
      className={`component-accordion shadow-sm ${className}`}
      defaultActiveKey={defaultActiveKey}
      alwaysOpen={alwaysOpen}
      {...props}
    >
      {children}
    </Accordion>
  );
}
