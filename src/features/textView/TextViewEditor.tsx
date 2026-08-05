import { useAppDispatch, useAppSelector } from "../../app/hooks";
import InputGroupTitle from "../../shared/ui/InputGroupTitle";
import { selectValidatedTextView, updateTextView } from "./textViewSlice";
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
  controlButtons,
  disabledOverride = false,
}: TextViewEditorProps) {
  const dispatch = useAppDispatch();
  const locked = useAppSelector((state) => selectLock(state, name));
  const textView = useAppSelector((state) =>
    selectValidatedTextView(state, textViewType, name),
  );

  const { prefix, suffix } = getAffixes(textViewType, name);

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
    <InputGroupTitle
      id={id}
      label={label}
      prefix={prefix}
      suffix={suffix}
      controlButtons={controlButtons}
      placeholder={placeholder}
      disabledOverride={disabledOverride}
      text={textView.value}
      lockChecker={locked}
      locker={() => dispatch(lock(name))}
      onChange={handleTextViewChange}
      error={textView.error}
    />
  );
}
