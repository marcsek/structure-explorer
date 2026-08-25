import { lockVariables, selectVariablesLock } from "./variablesSlice.ts";
import ComponentCard from "../../layout/ComponentCard/ComponentCard.tsx";
import TextView from "../textView/TextViewEditor.tsx";
import { useInstanceId } from "../../providers/instanceIdContext.tsx";
import { getAffixes } from "../textView/textViewAffixes.tsx";

export default function VariablesComponent() {
  const instanceId = useInstanceId();

  return (
    <ComponentCard heading="Variable assignment" help={help}>
      <TextView
        id={`variables-${instanceId}`}
        name="variables"
        textViewType="variables"
        label="Variable assignment of individual variables"
        placeholder="assignments"
        lock={() => lockVariables()}
        selectLock={selectVariablesLock}
        {...getAffixes({ type: "variables" })}
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
