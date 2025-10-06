import type { ChangeEvent, ReactNode } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { SyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";
import ErrorFeedback from "./ErrorFeedback";
import { useAppSelector } from "../app/hooks";
import { selectTeacherMode } from "../features/teacherMode/teacherModeslice";

interface Props {
  label: string;
  id: string;
  prefix: ReactNode;
  suffix: ReactNode;
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
  placeholder,
  text,
  onChange,
  locker,
  lockChecker,
  error,
}: Props) {
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;

  return (
    <>
      {label != "" && (
        <Form.Label htmlFor={`${id}-${label.toLowerCase()}`}>
          {label}
        </Form.Label>
      )}
      <InputGroup className="mb-3" hasValidation={!!error}>
        <InputGroup.Text>{prefix}</InputGroup.Text>
        <Form.Control
          className="flex-grow-1"
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

        {teacherMode && (
          <Button variant="secondary" onClick={() => locker()}>
            {`${lockChecker === true ? "Unlock" : "Lock"}`}
          </Button>
        )}

        <ErrorFeedback error={error} text={text}></ErrorFeedback>
      </InputGroup>
    </>
  );
}
