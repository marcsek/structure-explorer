import { Stack } from "react-bootstrap";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { InlineMath } from "react-katex";
import {
  lockDomain,
  lockInterpretationConstants,
  lockInterpretationPredicates,
  lockFunctionSymbols,
  selectIcLock,
  selectIpLock,
  selectIfLock,
} from "./structureSlice";
import {
  selectValidatedConstants,
  selectValidatedFunctions,
  selectValidatedPredicates,
} from "../language/languageSlice";
import InterpretationEditor from "./InterpretationEditor";
import ComponentCard from "../../components_helper/ComponentCard/ComponentCard.tsx";
import {
  selectValidatedTextView,
  updateTextView,
} from "../textView/textViewSlice.ts";

export default function StructureComponent() {
  const dispatch = useAppDispatch();

  const domainTextView = useAppSelector((state) =>
    selectValidatedTextView(state, "domain"),
  );
  const domainLocked = useAppSelector(
    (state) => state.present.structure.domain.locked,
  );

  const constants = useAppSelector(selectValidatedConstants);
  const predicates = useAppSelector(selectValidatedPredicates);
  const functions = useAppSelector(selectValidatedFunctions);

  return (
    <ComponentCard
      heading={
        <>
          Structure <InlineMath>{String.raw`\mathcal{M} = (D, i)`}</InlineMath>
        </>
      }
      className="structure-component-card"
      help={help}
    >
      <Stack gap={3}>
        <InputGroupTitle
          label={"Domain"}
          id="domain"
          prefix={<InlineMath>{String.raw`\mathcal{D} = \{`}</InlineMath>}
          suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
          placeholder="Domain"
          text={domainTextView.value}
          onChange={(e) => {
            dispatch(updateTextView({ type: "domain", value: e.target.value }));
          }}
          locker={() => dispatch(lockDomain())}
          lockChecker={domainLocked}
          error={domainTextView.error}
        />

        {!constants.error && constants.parsed.size > 0 && (
          <div className="structure-component-section">
            <h6 className="fw-normal">Constants interpretation</h6>

            <Stack gap={3}>
              {Array.from(constants.parsed ?? []).map((name) => (
                <InterpretationEditor
                  name={name}
                  id={`constant-${name}`}
                  type="constant"
                  key={`constant-${name}`}
                  textViewType="constant_interpretation"
                  lockSelector={selectIcLock}
                  onChange={(e) => {
                    dispatch(
                      updateTextView({
                        type: "constant_interpretation",
                        key: name,
                        value: e.target.value,
                      }),
                    );
                  }}
                  locker={() => {
                    dispatch(lockInterpretationConstants({ key: name }));
                  }}
                />
              ))}
            </Stack>
          </div>
        )}

        {!predicates.error && predicates.parsed.size > 0 && (
          <div className="structure-component-section">
            <h6 className="fw-normal">Predicates interpretation</h6>

            <Stack gap={3}>
              {Array.from(predicates.parsed ?? []).map(([name, arity]) => (
                <InterpretationEditor
                  type="predicate"
                  name={name}
                  id={`predicate-${name}-${arity}`}
                  key={`predicate-${name}-${arity}`}
                  textViewType="predicate_interpretation"
                  lockSelector={selectIpLock}
                  locker={() =>
                    dispatch(lockInterpretationPredicates({ key: name }))
                  }
                  onChange={(e) => {
                    dispatch(
                      updateTextView({
                        type: "predicate_interpretation",
                        key: name,
                        value: e.target.value,
                      }),
                    );
                  }}
                />
              ))}
            </Stack>
          </div>
        )}

        {!functions.error && functions.parsed.size > 0 && (
          <div className="structure-component-section">
            <h3 className="h6 fw-normal">Functions interpretation</h3>

            <Stack gap={3}>
              {Array.from(functions.parsed ?? []).map(([name, arity]) => (
                <InterpretationEditor
                  name={name}
                  type="function"
                  id={`function-${name}-${arity}`}
                  key={`function-${name}-${arity}`}
                  textViewType="function_interpretation"
                  lockSelector={selectIfLock}
                  onChange={(e) => {
                    dispatch(
                      updateTextView({
                        type: "function_interpretation",
                        key: name,
                        value: e.target.value,
                      }),
                    );
                  }}
                  locker={() => {
                    dispatch(lockFunctionSymbols({ key: name }));
                  }}
                />
              ))}
            </Stack>
          </div>
        )}
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
