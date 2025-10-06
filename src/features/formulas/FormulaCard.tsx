import { Col, Row, Table } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import FormulaComponent from "./FormulaComponent";
import TooltipButton from "../../components_helper/TooltipButton";
import Button from "react-bootstrap/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectFormulas, type FormulaState, addFormula } from "./formulasSlice";
import { InlineMath } from "react-katex";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import PrettifyButton from "./PrettifyButton";

export default function FormulaCard() {
  const dispatch = useAppDispatch();
  const allFormulas = useAppSelector(selectFormulas);

  return (
    <>
      <Card className="mb-3 mt-3">
        <Card.Header as="h4">
          <Row>
            <Col>
              Truth of formulas in{" "}
              <InlineMath>{String.raw`\mathcal{M}`}</InlineMath>
            </Col>
            <Col xs="auto">
              <TooltipButton text={help}></TooltipButton>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {allFormulas.length > 0 && <PrettifyButton />}

          {allFormulas.map((formula: FormulaState, index: number) => (
            <FormulaComponent
              id={index}
              key={index}
              text={formula.text}
              guess={formula.guess}
            />
          ))}

          <Button variant="success" onClick={() => dispatch(addFormula())}>
            <FontAwesomeIcon icon={faPlus} /> Add
          </Button>
        </Card.Body>
      </Card>
    </>
  );
}

const help = (
  <>
    <p>
      The truth of closed first-order formulas in the structure 𝓜 and the
      satisfaction of open first-order formulas by the valuation of variables 𝑒
      in 𝓜 can be examined in this section.
    </p>
    <p>
      The desired/expected truth or satisfaction can be selected from the ⊨/⊭
      menu below a formula. Structure Explorer checks the correctness of your
      selection.
    </p>
    <p className="mb-0">Syntactic requirements:</p>
    <ul className="mb-0">
      <li>
        All non-logical symbols used in formulas must come from the language 𝓛
        and must be used according to their type and arity. All other
        alphanumerical symbols are treated as variables.
      </li>
      <li>Formulas must be properly parenthesized.</li>
      <li>
        The following notation of logical symbols is accepted:
        <Table size="sm" striped className="my-2 border-bottom">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Notation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Equality</td>
              <td> =, ≐</td>
            </tr>
            <tr>
              <td>Non-equality</td>
              <td> !=, {"<>"}, /=, ≠</td>
            </tr>
            <tr>
              <td>Negation</td>
              <td> \neg, \lnot, -, !, ~, ¬</td>
            </tr>
            <tr>
              <td>Conjunction</td>
              <td> \wedge, \land, &&, &, /\, ∧</td>
            </tr>
            <tr>
              <td>Disjunction</td>
              <td> \vee, \lor, ||, |, \/, ∨</td>
            </tr>
            <tr>
              <td>Implication</td>
              <td> \to, \limpl, {"->"}, →</td>
            </tr>
            <tr>
              <td>Equivalence</td>
              <td> \lequiv, \leftrightarrow, {"<->"}, ↔︎</td>
            </tr>
            <tr>
              <td>Existential quantifier</td>
              <td> \exists, \e, \E, ∃</td>
            </tr>
            <tr>
              <td>General quantifier</td>
              <td> \forall, \a, \A, ∀</td>
            </tr>
          </tbody>
        </Table>
      </li>
      <li>
        The priority of logical symbols:
        <ol className="my-0">
          <li>≐, ≠ (highest priority)</li>
          <li>¬, ∀, ∃</li>
          <li>∧ (left-associative, i.e., A ∧ B ∧ C ≡ ((A ∧ B) ∧ C))</li>
          <li>∨ (left-associative)</li>
          <li>→ (right-associative, i.e., A → B → C ≡ (A → (B → C)))</li>
          <li>↔︎ (non-associative, lowest priority)</li>
        </ol>
      </li>
    </ul>
  </>
);
