import { Dropdown, DropdownButton, Stack, Table } from "react-bootstrap";
import FormulaComponent from "./FormulaComponent";
import Button from "react-bootstrap/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectFormulas,
  type FormulaState,
  addFormulas,
} from "./formulasSlice";
import { InlineMath } from "react-katex";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faPlus } from "@fortawesome/free-solid-svg-icons";
import PrettifyButton from "./PrettifyButton";
import ComponentCard from "../../components_helper/ComponentCard/ComponentCard.tsx";
import { UndoActions } from "../undoHistory/undoHistory.ts";
import {
  useSyncFormulasContext,
  type FormulaType,
} from "../../logicContext.ts";
import { useState } from "react";
import React from "react";

export default function FormulaCard() {
  const dispatch = useAppDispatch();
  const allFormulas = useAppSelector(selectFormulas);
  const presentContextFormulas = new Set(
    allFormulas.flatMap(({ name }) => (name ? [name] : [])),
  );

  return (
    <ComponentCard
      heading={
        <span>
          Truth of formulas in{" "}
          <InlineMath>{String.raw`\mathcal{M}`}</InlineMath>
        </span>
      }
      help={help}
    >
      <Stack gap={2} direction="horizontal" className="mb-2 flex-wrap">
        <Button
          variant="success"
          onClick={() => {
            dispatch(addFormulas());
            dispatch(UndoActions.checkpoint());
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> Add
        </Button>

        <ContextFormulasDropdown
          presentContextFormulas={presentContextFormulas}
        />

        <div className="ms-sm-auto">
          {allFormulas.length > 0 && <PrettifyButton />}
        </div>
      </Stack>

      {allFormulas.map((formula: FormulaState, index: number) => (
        <FormulaComponent
          id={index}
          name={formula.name}
          key={index}
          text={formula.text}
          guess={formula.guess}
        />
      ))}
    </ComponentCard>
  );
}

const formulaTypeDisplayNames: Record<FormulaType, string> = {
  formula: "Named Formulas",
  axiom: "Axioms",
  theorem: "Theorems",
};

interface FormulaDropdownProps {
  presentContextFormulas: Set<string>;
}

function ContextFormulasDropdown({
  presentContextFormulas,
}: FormulaDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useAppDispatch();

  const { formulas, formulasByType } = useSyncFormulasContext();
  const notYetAdded = formulas
    .filter(({ name }) => !presentContextFormulas.has(name))
    .map(({ name, formula }) => ({ name, text: formula }));

  function handleAddAllFormulas() {
    dispatch(addFormulas(notYetAdded));
    dispatch(UndoActions.checkpoint());
    setShowDropdown(false);
  }

  return (
    <DropdownButton
      title={
        <>
          <FontAwesomeIcon icon={faPlus} /> Add from context
        </>
      }
      onToggle={(isOpen) => setShowDropdown(isOpen)}
      disabled={formulas.length === 0}
      variant="success"
      autoClose="outside"
      show={showDropdown}
    >
      <Dropdown.Item
        as="button"
        onClick={handleAddAllFormulas}
        disabled={notYetAdded.length === 0}
      >
        <FontAwesomeIcon icon={faCheckDouble} size="sm" /> Add all
      </Dropdown.Item>
      {formulasByType.map(([formulaType, formulaWithType]) => (
        <React.Fragment key={formulaType}>
          <Dropdown.Divider />
          <Dropdown.ItemText
            className="text-secondary b-0"
            style={{
              minWidth: "fitContent",
              fontSize: "14px",
              paddingBlock: "0px",
            }}
          >
            {formulaTypeDisplayNames[formulaType]}
          </Dropdown.ItemText>

          {formulaWithType.map(({ name, formula }) => (
            <Dropdown.Item
              key={name}
              as="button"
              disabled={presentContextFormulas.has(name)}
              onClick={() => {
                dispatch(addFormulas([{ name, text: formula }]));
                dispatch(UndoActions.checkpoint());
              }}
            >
              {name}
            </Dropdown.Item>
          ))}
        </React.Fragment>
      ))}
    </DropdownButton>
  );
}

/* eslint-disable */
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
