import { faLock, faUnlock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, type ButtonProps } from "react-bootstrap";

interface LockButtonProps extends Omit<ButtonProps, "onClick"> {
  locked: boolean;
  locker: () => void;
}

export default function LockButton({
  locker,
  locked,
  ...props
}: LockButtonProps) {
  return (
    <Button
      onClick={locker}
      className={`btn-bd-light-outline ${locked ? "text-danger" : ""} ${props.className}`}
      {...props}
    >
      <FontAwesomeIcon icon={locked ? faLock : faUnlock} />
    </Button>
  );
}
