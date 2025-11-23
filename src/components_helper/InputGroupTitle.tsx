import type { ChangeEvent, ReactNode } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { SyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";
import ErrorFeedback from "./ErrorFeedback";
import { useAppSelector } from "../app/hooks";
import { selectTeacherMode } from "../features/teacherMode/teacherModeslice";
import LockButton from "./LockButton";

interface Props {
  label: string;
  id: string;
  prefix: ReactNode;
  suffix: ReactNode;
  controlButtons?: ReactNode;
  placeholder: string;
  text: string;
  onChange(event: ChangeEvent<HTMLInputElement>): void;
  locker: () => void;
  lockChecker: boolean | undefined;
  error?: Error | SyntaxError;
}

export default function InputGroupTitle({
  label,
  id,
  prefix,
  suffix,
  controlButtons = null,
  placeholder,
  text,
  onChange,
  locker,
  lockChecker = false,
  error,
}: Props) {
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

  return (
    <Form.Group className="flex-grow-1">
      {label != "" && (
        <Form.Label htmlFor={`${id}-${label.toLowerCase()}`}>
          {label}
        </Form.Label>
      )}
      <InputGroup hasValidation={!!error}>
        <InputGroup.Text>{prefix}</InputGroup.Text>
        <Form.Control
          placeholder={placeholder}
          aria-label={placeholder}
          aria-describedby="basic-addon2"
          value={text}
          onChange={onChange}
          id={`${id}-${label.toLowerCase()}`}
          isInvalid={!!error}
          disabled={lockChecker === true}
        />

        {suffix && <InputGroup.Text>{suffix}</InputGroup.Text>}

        {controlButtons}

        {teacherMode && <LockButton locker={locker} locked={lockChecker} />}
        <ErrorFeedback error={error} text={text}></ErrorFeedback>
      </InputGroup>
    </Form.Group>
  );
}
