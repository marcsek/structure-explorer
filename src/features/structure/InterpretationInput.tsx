import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { InlineMath } from "react-katex";
import { useAppSelector } from "../../app/hooks";
import type { InterpretationState } from "./structureSlice";
import type { RootState } from "../../app/store";
import type { ChangeEvent } from "react";
import { selectParsedConstants } from "../language/languageSlice";
import { selectParsedPredicates } from "../language/languageSlice";

interface Props {
  name: string;
  id: string;
  selector: (state: RootState, name: string) => InterpretationState;
  parser: (state: RootState, name: string) => { error?: Error };
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  locker: () => void;
  toggleGraphView?: (name: string) => void;
}

export default function InterpretationInput({
  name,
  id,
  selector,
  parser,
  onChange,
  locker,
  toggleGraphView,
}: Props) {
  const interpretation = useAppSelector((state) => selector(state, name));
  const isBinary = useAppSelector(
    (state) => selectParsedPredicates(state).parsed?.get(name) === 2,
  );
  const { error } = useAppSelector((state) => parser(state, name));
  const escapedName = name.replace(/_/g, "\\_");
  const constants = useAppSelector(selectParsedConstants);

  return (
    <>
      <InputGroupTitle
        label=""
        id={id}
        prefix={
          constants.parsed?.has(name) === false ? (
            <InlineMath>{String.raw`i(\text{\textsf{${escapedName}}}) = \{`}</InlineMath>
          ) : (
            <InlineMath>{String.raw`i(\text{\textsf{${escapedName}}}) =`}</InlineMath>
          )
        }
        //        suffix={
        //          constants.parsed?.has(name) === false ? (
        //            <InlineMath>{String.raw`\}`}</InlineMath>
        //          ) : (
        //            ""
        //          )
        //        }
        suffix={
          isBinary ? (
            <div>
              <button onClick={() => toggleGraphView!(name)}>Graph View</button>
            </div>
          ) : (
            ""
          )
        }
        placeholder=""
        text={interpretation?.text ?? ""}
        lockChecker={interpretation?.locked ?? false}
        locker={locker}
        onChange={onChange}
        error={error}
      ></InputGroupTitle>
      {}
    </>
  );
}
