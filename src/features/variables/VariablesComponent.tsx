import { Card, Col, Row } from "react-bootstrap";
import TooltipButton from "../../components_helper/TooltipButton";
import InputGroupTitle from "../../components_helper/InputGroupTitle";
import { InlineMath } from "react-katex";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  lockVariables,
  selectParsedVariables,
  selectVariablesLock,
  selectVariablesText,
  updateVariables,
} from "./variablesSlice";

export default function VariablesComponent() {
  const dispatch = useAppDispatch();
  const text = useAppSelector(selectVariablesText);
  const lock = useAppSelector(selectVariablesLock);
  const { error } = useAppSelector(selectParsedVariables);
  return (
    <>
      <Card>
        <Card.Header as="h4">
          <Row>
            <Col>Variable assignment</Col>
            <Col xs="auto">
              <TooltipButton text={help}></TooltipButton>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <InputGroupTitle
            label={"Variable assignment of individual variables"}
            id="0"
            text={text}
            prefix={<InlineMath>{String.raw`e = \{`}</InlineMath>}
            suffix={<InlineMath>{String.raw`\}`}</InlineMath>}
            placeholder="assignments"
            onChange={(e) => dispatch(updateVariables(e.target.value))}
            error={error}
            lockChecker={lock}
            locker={() => dispatch(lockVariables())}
          ></InputGroupTitle>
        </Card.Body>
      </Card>
    </>
  );
}

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
