import type { ChangeEvent, ReactNode } from "react";
import { Form, InputGroup } from "react-bootstrap";
import ErrorFeedback from "./ErrorFeedback";
import { useAppSelector } from "../../app/hooks";
import { selectTeacherMode } from "../../features/teacherMode/teacherModeSlice";
import LockButton from "./LockButton";
import type { InterpretationError } from "../core/errors";
import { useDispatch } from "react-redux";
import { textViewCheckpoint } from "../../features/textView/textViewSlice";

interface Props {
  id: string;
  label: string;
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

// TODO: Refactor
export default function InputGroupTitle({
  id,
  label,
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
      <InputGroup hasValidation={!!error} size="sm">
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
          onBlur={() => createHistoryOnBlur && dispatch(textViewCheckpoint())}
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
