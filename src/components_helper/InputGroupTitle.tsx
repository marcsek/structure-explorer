import type { ChangeEvent, ReactNode } from "react";
import { Form, InputGroup } from "react-bootstrap";
import ErrorFeedback from "./ErrorFeedback";
import { useAppSelector } from "../app/hooks";
import { selectTeacherMode } from "../features/teacherMode/teacherModeslice";
import LockButton from "./LockButton";
import type { InterpretationError } from "../common/errors";
import { useDispatch } from "react-redux";
import { UndoActions } from "../features/undoHistory/undoHistory";

interface Props {
  label: string;
  id: string;
  prefix: ReactNode;
  suffix: ReactNode;
  controlButtons?: ReactNode;
  placeholder: string;
  disabledOverride?: boolean;
  text: string;
  onChange(event: ChangeEvent<HTMLInputElement>): void;
  locker: () => void;
  lockChecker: boolean | undefined;
  error?: InterpretationError;
  createHistoryOnBlur?: boolean;
}

export default function InputGroupTitle({
  label,
  id,
  prefix,
  suffix,
  controlButtons = null,
  placeholder,
  disabledOverride = false,
  text,
  onChange,
  locker,
  lockChecker = false,
  error,
  createHistoryOnBlur = true,
}: Props) {
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;
  const dispatch = useDispatch();

  return (
    <Form.Group className="flex-grow-1">
      {label != "" && (
        <Form.Label htmlFor={`${id}-${label.toLowerCase()}`}>
          {label}
        </Form.Label>
      )}
      <InputGroup hasValidation={!!error}>
        <InputGroup.Text className="input-group-fix-height">
          {prefix}
        </InputGroup.Text>
        <Form.Control
          placeholder={placeholder}
          aria-label={placeholder}
          aria-describedby="basic-addon2"
          autoComplete="off"
          value={text}
          onChange={onChange}
          id={`${id}-${label.toLowerCase()}`}
          isInvalid={!!error}
          disabled={disabledOverride || lockChecker}
          onBlur={() =>
            createHistoryOnBlur && dispatch(UndoActions.checkpoint())
          }
        />

        {suffix && (
          <InputGroup.Text className="input-group-fix-height">
            {suffix}
          </InputGroup.Text>
        )}

        {controlButtons}

        {teacherMode && <LockButton locker={locker} locked={lockChecker} />}
        <ErrorFeedback error={error} text={text} />
      </InputGroup>
    </Form.Group>
  );
}
