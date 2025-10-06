import { Card, Col, Row } from "react-bootstrap";
import TooltipButton from "../../components_helper/TooltipButton";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { InlineMath } from "react-katex";
import {
  selectDomain,
  selectParsedDomain,
  updateInterpretationConstants,
  selectIcName,
  selectParsedConstant,
  updateFunctionSymbols,
  selectParsedPredicate,
  selectIpName,
  selectIfName,
  selectParsedFunction,
  lockDomain,
  lockInterpretationConstants,
  lockInterpretationPredicates,
  lockFunctionSymbols,
  updateInterpretationPredicates,
  updateDomain,
} from "./structureSlice";
import {
  selectParsedConstants,
  selectParsedFunctions,
  selectParsedPredicates,
} from "../language/languageSlice";
import InterpretationEditor from "./InterpretationEditor";

export default function StructureComponent() {
  const dispatch = useAppDispatch();
  const domain = useAppSelector(selectDomain);
  const domainError = useAppSelector(selectParsedDomain);
  const constants = useAppSelector(selectParsedConstants);
  const predicates = useAppSelector(selectParsedPredicates);
  const functions = useAppSelector(selectParsedFunctions);

  return (
    <>
      <Card className="mb-3">
        <Card.Header as="h2" className="h4">
          <Row>
            <Col>
              Structure{" "}
              <InlineMath>{String.raw`\mathcal{M} = (D, i)`}</InlineMath>
            </Col>
            <Col xs="auto">
              <TooltipButton text={help}></TooltipButton>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <InputGroupTitle
            label={"Domain"}
            id="0"
            prefix={<InlineMath>{String.raw`\mathcal{D} = \{`}</InlineMath>}
            suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
            placeholder="Domain"
            text={domain.text}
            onChange={(e) => {
              dispatch(updateDomain(e.target.value));
            }}
            locker={() => dispatch(lockDomain())}
            lockChecker={domain.locked}
            error={domainError.error}
          ></InputGroupTitle>
          {constants.parsed && constants.parsed.size > 0 && (
            <h3 className="h6">Constants interpretation</h3>
          )}
          {Array.from(constants.parsed ?? []).map((name, index) => (
            <InterpretationEditor
              name={name}
              id={`constant-${index}`}
              type="constant"
              key={`constant-${index}`}
              selector={selectIcName}
              parser={selectParsedConstant}
              onChange={(e) => {
                dispatch(
                  updateInterpretationConstants({
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
          {predicates.parsed && predicates.parsed.size > 0 && (
            <h3 className="h6">Predicates interpretation</h3>
          )}
          {Array.from(predicates.parsed ?? []).map(([name], index) => (
            <InterpretationEditor
              type="predicate"
              name={name}
              id={`predicate-${index}`}
              key={`predicate-${index}`}
              selector={selectIpName}
              parser={selectParsedPredicate}
              locker={() =>
                dispatch(lockInterpretationPredicates({ key: name }))
              }
              onChange={(e) => {
                dispatch(
                  updateInterpretationPredicates({
                    key: name,
                    value: e.target.value,
                  }),
                );
              }}
            />
          ))}
          {functions.parsed && functions.parsed.size > 0 && (
            <h3 className="h6">Functions interpretation</h3>
          )}
          {Array.from(functions.parsed ?? []).map(([from], index) => (
            <InterpretationEditor
              name={from}
              type="function"
              id={`function-${index}`}
              key={`function-${index}`}
              selector={selectIfName}
              onChange={(e) => {
                dispatch(
                  updateFunctionSymbols({
                    key: from,
                    value: e.target.value,
                  }),
                );
              }}
              parser={selectParsedFunction}
              locker={() => {
                dispatch(lockFunctionSymbols({ key: from }));
              }}
            />
          ))}
        </Card.Body>
      </Card>
    </>
  );
}

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
