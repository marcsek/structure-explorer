import { Form, InputGroup } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectTeacherMode } from "../teacherMode/teacherModeSlice";
import LockButton from "../../shared/ui/LockButton";
import ErrorFeedback from "../../shared/ui/ErrorFeedback";
import {
  selectValidatedTextView,
  textViewCheckpoint,
  updateTextView,
} from "./textViewSlice";
import { getAffixes } from "./textViewAffixes";
import type { TextViewType } from "./textViews";
import type { RootState } from "../../app/store";
import type { UnknownAction } from "@reduxjs/toolkit";

export interface TextViewEditorProps {
  id: string;
  label?: string;
  placeholder?: string;
  name: string;
  textViewType: TextViewType;
  lock: (name: string) => UnknownAction;
  selectLock: (state: RootState, name: string) => boolean;
  controlButtons?: React.ReactNode;
  disabledOverride?: boolean;
}

export default function TextView({
  id,
  name,
  label = "",
  placeholder = "",
  textViewType,
  lock,
  selectLock,
  controlButtons = null,
  disabledOverride = false,
}: TextViewEditorProps) {
  const dispatch = useAppDispatch();
  const teacherMode = useAppSelector(selectTeacherMode) ?? false;
  const locked = useAppSelector((state) => selectLock(state, name));
  const textView = useAppSelector((state) =>
    selectValidatedTextView(state, textViewType, name),
  );

  const { prefix, suffix } = getAffixes(textViewType, name);
  const { value: text, error } = textView;
  const errorId = `${id}-feedback`;

  const handleTextViewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      updateTextView({
        key: name,
        type: textViewType,
        value: e.target.value,
      }),
    );
  };

  return (
    <Form.Group className="flex-grow-1">
      {label !== "" && <Form.Label htmlFor={id}>{label}</Form.Label>}
      <InputGroup hasValidation={!!error} size="sm">
        {prefix && (
          <InputGroup.Text className="input-group-fix-height">
            {prefix}
          </InputGroup.Text>
        )}

        <Form.Control
          placeholder={placeholder}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          autoComplete="off"
          value={text}
          onChange={handleTextViewChange}
          id={id}
          isInvalid={!!error}
          disabled={disabledOverride || locked}
          onBlur={() => dispatch(textViewCheckpoint())}
        />

        {suffix && (
          <InputGroup.Text className="input-group-fix-height">
            {suffix}
          </InputGroup.Text>
        )}

        {controlButtons}

        {teacherMode && (
          <LockButton locker={() => dispatch(lock(name))} locked={locked} />
        )}
        <ErrorFeedback id={errorId} error={error} text={text} />
      </InputGroup>
    </Form.Group>
  );
}
