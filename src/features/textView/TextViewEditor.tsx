import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import type { TextViewType } from "./textViews";
import { selectValidatedTextView, updateTextView } from "./textViewSlice";
import type { RootState } from "../../app/store";

export interface TextViewEditorProps {
  id: string;
  name: string;
  textViewType: TextViewType;
  locker: () => void;
  lockSelector: (state: RootState, name: string) => boolean;
  controlButtons?: React.ReactNode;
}

export default function TextView({
  id,
  name,
  textViewType,
  locker,
  lockSelector,
  controlButtons,
}: TextViewEditorProps) {
  const dispatch = useAppDispatch();

  const locked = useAppSelector((state) => lockSelector(state, name));
  const textView = useAppSelector((state) =>
    selectValidatedTextView(state, textViewType, name),
  );

  const isConstant = textViewType === "constant_interpretation";

  const escapedName = name.replace(/_/g, "\\_");
  const prefixRawNoEnd = String.raw`i(\text{\textsf{${escapedName}}})`;
  const prefixRaw = String.raw`${prefixRawNoEnd} = ${isConstant ? "" : "\\{"}`;
  const suffixRaw = String.raw`\}`;

  const handleTextViewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      updateTextView({ key: name, type: textViewType, value: e.target.value }),
    );
  };

  return (
    <InputGroupTitle
      label=""
      id={id}
      prefix={<InlineMath>{prefixRaw}</InlineMath>}
      suffix={isConstant ? "" : <InlineMath>{suffixRaw}</InlineMath>}
      controlButtons={controlButtons}
      placeholder=""
      text={textView.value}
      lockChecker={locked}
      locker={locker}
      onChange={handleTextViewChange}
      error={textView.error}
    />
  );
}
