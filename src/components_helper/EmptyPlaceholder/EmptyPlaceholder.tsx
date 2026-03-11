import "./EmptyPlaceholder.css";

import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Stack } from "react-bootstrap";

export interface EmptyPlaceholderProps {
  message: string;
}

export default function EmptyPlaceholder({ message }: EmptyPlaceholderProps) {
  return (
    <Stack gap={2} className="empty-placeholder-container">
      <FontAwesomeIcon icon={faCircleInfo} />
      <span className="empty-placeholder-container-text">{message}</span>
    </Stack>
  );
}
