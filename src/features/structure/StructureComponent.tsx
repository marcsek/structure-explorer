import { Stack } from "react-bootstrap";
import { InlineMath } from "react-katex";
import ComponentCard from "../../layout/ComponentCard/ComponentCard.tsx";
import InterpretationSection from "./InterpretationSection.tsx";
import {
  selectConstantSymbols,
  selectFunctionSymbols,
  selectPredicateSymbols,
} from "./symbolKinds";
import TextView from "../textView/TextViewEditor.tsx";
import {
  lockDomain,
  lockFunctionSymbols,
  lockInterpretationConstants,
  lockInterpretationPredicates,
  selectDomainLock,
  selectIcLock,
  selectIfLock,
  selectIpLock,
} from "./structureSlice.ts";
import TupleInterpretationEditor from "./TupleInterpretationEditor.tsx";

export default function StructureComponent() {
  return (
    <ComponentCard
      heading={
        <>
          Structure <InlineMath>{"\\mathcal{M} = (D, i)"}</InlineMath>
        </>
      }
      className="structure-component-card"
      help={help}
    >
      <Stack gap={3}>
        <TextView
          id="domain"
          lock={() => lockDomain()}
          selectLock={selectDomainLock}
          name="domain"
          textViewType="domain"
          placeholder="Domain"
          label="Domain"
        />

        <InterpretationSection
          sectionTitle="Constants interpretation"
          selectSymbols={selectConstantSymbols}
          renderSymbol={(name) => (
            <TextView
              id={`constant-${name}`}
              key={name}
              name={name}
              textViewType="constant_interpretation"
              lock={(name) => lockInterpretationConstants({ key: name })}
              selectLock={selectIcLock}
            />
          )}
        />

        <InterpretationSection
          sectionTitle="Predicates interpretation"
          selectSymbols={selectPredicateSymbols}
          renderSymbol={({ name, arity }) => (
            <TupleInterpretationEditor
              id={`predicate-${name}-${arity}`}
              key={`predicate-${name}`}
              tupleInfo={{ name, arity, type: "predicate" }}
              textViewType="predicate_interpretation"
              lock={(name) => lockInterpretationPredicates({ key: name })}
              selectLock={selectIpLock}
            />
          )}
        />

        <InterpretationSection
          sectionTitle="Functions interpretation"
          selectSymbols={selectFunctionSymbols}
          renderSymbol={({ name, arity }) => (
            <TupleInterpretationEditor
              id={`function-${name}-${arity}`}
              key={`function-${name}`}
              tupleInfo={{ name, arity, type: "function" }}
              textViewType="function_interpretation"
              lock={(name) => lockFunctionSymbols({ key: name })}
              selectLock={selectIfLock}
            />
          )}
        />
      </Stack>
    </ComponentCard>
  );
}

/* eslint-disable */
const help = (
  <>
    <p>
      A first-order structure for language 𝓛 is defined in this section. When
      the language is modified, inputs for interpretations of symbols are
      updated accordingly.
    </p>
    <p className="mb-0">Syntactic requirements:</p>
    <ul className="mb-0">
      <li>
        Elements in all sets (the domain, interpretations of predicates and
        functions) are comma-separated.
      </li>
      <li>
        Strings of any Unicode characters except spaces, comma, and parentheses
        can be used as domain elements.
      </li>
      <li>An individual constant is interpreted as a domain element.</li>
      <li>
        A unary predicate symbol is interpreted as a set of domain elements.
      </li>
      <li>
        An <var>n</var>-ary predicate symbol for <var>n</var> &gt; 1 is
        interpreted as a set of <var>n</var>-tuples of domain elements. Each{" "}
        <var>n</var>-tuple is written as{" "}
        <code>
          (elem<sub>1</sub>, …, elem
          <sub>
            <var>n</var>
          </sub>
          )
        </code>
        .
      </li>
      <li>
        An <var>n</var>-ary function symbol is interpreted as a set of (
        <var>n</var>+1)-tuples of domain elements, each written as{" "}
        <code>
          (arg<sub>1</sub>, …, arg
          <sub>
            <var>n</var>
          </sub>
          , value)
        </code>
        .
      </li>
    </ul>
  </>
);
