import "./InterpretationFilters.css";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  predicateHovered,
  unaryPredicateToggled,
  selectUnaryPreds,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
} from "../../graphView/graphs/graphSlice";
import type { GraphType } from "../../graphView/graphs/plugins";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { Button } from "react-bootstrap";
import { getUnaryPredicateColor } from "../unaryPredicateColors";

export interface InterpretationFiltersProps {
  id: string;
  type: GraphType;
}

export default function InterpretationFilters({
  id,
  type,
}: InterpretationFiltersProps) {
  const dispatch = useAppDispatch();
  const unaryFilterDomain = useAppSelector(
    (state) => state.graphView[id]?.unaryFilterDomain,
  );

  const handleDomainHover = (hovered: boolean) => {
    dispatch(unaryFilterDomainHovered({ id, type, hovered }));
  };

  return (
    <div className="intr-filters-container">
      <Button
        className={`domain-button editor-toolbar-button legend-button  ${!unaryFilterDomain ? "active" : ""}`}
        title="Select Domain"
        onClick={() => dispatch(unaryFilterDomainToggled({ id, type }))}
        onMouseEnter={() => handleDomainHover(true)}
        onMouseLeave={() => handleDomainHover(false)}
      >
        <InlineMath>{String.raw`\mathcal{D}`}</InlineMath>
      </Button>

      <div className="intr-filters-divider" />

      <UnaryPredicatesFilter id={id} type={type} />
    </div>
  );
}

interface UnaryPredicatesFilterProps {
  id: string;
  type: GraphType;
}

function UnaryPredicatesFilter({ id, type }: UnaryPredicatesFilterProps) {
  const dispatch = useAppDispatch();
  const predicates = useAppSelector(selectUnaryPreds)?.sort();
  const selectedPredicates = useAppSelector(
    (state) => state.graphView[id]?.selectedUnary ?? [],
  );

  const handleSelectAll = () => {
    const allSelected = selectedPredicates.length === predicates.length;
    const newSelectedPredicates = allSelected
      ? []
      : predicates.map(([pred]) => pred);

    handlePredicateToggle(newSelectedPredicates);
  };

  const handlePredicateHover = (hoveredPredicates: string[]) => {
    dispatch(predicateHovered({ id, type, predicates: hoveredPredicates }));
  };

  const handlePredicateToggle = (predicate: string | string[]) => {
    dispatch(unaryPredicateToggled({ id, type, predicate }));
  };

  return (
    <fieldset className="unary-preds-filters-group">
      <Button
        className="legend-select-all editor-toolbar-button legend-button"
        title="Select all"
        onClick={handleSelectAll}
        onMouseEnter={() => handlePredicateHover(predicates.map((p) => p[0]))}
        onMouseLeave={() => handlePredicateHover([])}
      >
        <FontAwesomeIcon icon={faCheckDouble} />
      </Button>

      {predicates.map(([predicate], idx) => (
        <label
          key={predicate}
          className="unary-preds-filters-checkbox"
          style={{ color: getUnaryPredicateColor(idx) }}
          onMouseEnter={() => handlePredicateHover([predicate])}
          onMouseLeave={() => handlePredicateHover([])}
        >
          <input
            type="checkbox"
            name="unary preds"
            checked={selectedPredicates.includes(predicate)}
            onChange={() => handlePredicateToggle(predicate)}
          />
          <span
            className="unary-preds-filters-checkbox-indicator"
            style={{ color: getUnaryPredicateColor(idx) }}
          >
            {selectedPredicates.includes(predicate) && (
              <FontAwesomeIcon icon={faCheck} />
            )}
          </span>
          <p
            style={{
              color: selectedPredicates.includes(predicate)
                ? getUnaryPredicateColor(idx)
                : "",
            }}
          >
            {predicate}
          </p>
        </label>
      ))}
    </fieldset>
  );
}
