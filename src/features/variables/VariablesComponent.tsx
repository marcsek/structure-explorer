import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { lockVariables, selectVariablesLock } from "./variablesSlice";
import ComponentCard from "../../components_helper/ComponentCard/ComponentCard.tsx";
import {
  selectValidatedTextView,
  updateTextView,
} from "../textView/textViewSlice.ts";

export default function VariablesComponent() {
  const dispatch = useAppDispatch();

  const textView = useAppSelector((state) =>
    selectValidatedTextView(state, "variables"),
  );
  const lock = useAppSelector(selectVariablesLock);

  return (
    <ComponentCard heading={<span>Variable assignment</span>} help={help}>
      <InputGroupTitle
        label={"Variable assignment of individual variables"}
        id="variables"
        text={textView.value}
        prefix={<InlineMath>{String.raw`e = \{`}</InlineMath>}
        suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
        placeholder="assignments"
        onChange={(e) =>
          dispatch(updateTextView({ type: "variables", value: e.target.value }))
        }
        error={textView.error}
        lockChecker={lock}
        locker={() => dispatch(lockVariables())}
      />
    </ComponentCard>
  );
}

/* eslint-disable */
const help = (
  <>
    <p>
      An assignment of individual variables (i.e., a partial map from individual
      variables to the domain 𝐷) is defined in this section.
    </p>
    <p>
      Any alphanumeric symbol that is not an individual constant, predicate, or
      function symbol is considered a variable.
    </p>
    <p className="mb-0">
      Elements of the assignment are comma-separated ordered pairs. Each pair
      can be written as <code>(variable, element)</code>
      or <code>variable ↦ element</code>. The maps-to symbol <code>↦</code> can
      also be written as <code>-{">"}</code>, <code>|-{">"}</code>,{" "}
      <code>\mapsto</code>, or <code>⟼</code>.
    </p>
  </>
);
