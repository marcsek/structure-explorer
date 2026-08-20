import { Button, type ButtonProps } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export default function DeleteElementButton(props: ButtonProps) {
  return (
    <Button {...props} variant="danger">
      <FontAwesomeIcon icon={faTrash} />
    </Button>
  );
}
