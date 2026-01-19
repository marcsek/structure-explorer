import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Stack } from "react-bootstrap";

export interface EmptyPlaceholderProps {
  message: string;
}

export default function EmptyPlaceholder({ message }: EmptyPlaceholderProps) {
  return (
    <Stack
      gap={2}
      className="p-2 flex-row align-items-center justify-content-center text-secondary"
    >
      <FontAwesomeIcon icon={faCircleInfo} />
      <h6 className="m-0">{message}</h6>
    </Stack>
  );
}
