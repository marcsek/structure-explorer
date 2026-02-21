import "./InterpretationFilters.css";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectUnaryPreds } from "../../graphView/graphs/graphSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faCheck,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { InlineMath } from "react-katex";
import { Button } from "react-bootstrap";
import useScrollControls from "./useScrollControls";
import { useRef } from "react";
import useDraggingScroll from "./useDragginScroll";
import {
  predicateHovered,
  selectSelectedUnary,
  selectUnaryFilterDomain,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
  unaryPredicateToggled,
} from "../../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateColor } from "../../drawerEditor/unaryPredicateColors";
import type { TupleType } from "../../structure/structureSlice";
import type { EditorFilters } from "./EditorToolbar";

export interface InterpretationFiltersProps {
  tupleName: string;
  tupleType: TupleType;
  disabledFilters: EditorFilters[];
}

export default function InterpretationFilters({
  tupleName,
  tupleType,
  disabledFilters,
}: InterpretationFiltersProps) {
  const dispatch = useAppDispatch();
  const unaryFilterDomain = useAppSelector((state) =>
    selectUnaryFilterDomain(state, tupleName, tupleType),
  );
  const selectedPredicates = useAppSelector((state) =>
    selectSelectedUnary(state, tupleName, tupleType),
  );

  const unaryPredicatesCount = useAppSelector(selectUnaryPreds)?.length ?? 0;

  const handleDomainHover = (hovered: boolean) => {
    dispatch(unaryFilterDomainHovered({ tupleName, tupleType, hovered }));
  };

  return (
    <div className="intr-filters-container">
      <Button
        className={`domain-button editor-toolbar-button legend-button ${!unaryFilterDomain ? "active" : ""}`}
        title="Select Domain"
        onClick={() =>
          dispatch(unaryFilterDomainToggled({ tupleName, tupleType }))
        }
        onMouseEnter={() => handleDomainHover(true)}
        onMouseLeave={() => handleDomainHover(false)}
        disabled={
          selectedPredicates.length === 0 ||
          disabledFilters.includes("unaryFilterToggle")
        }
      >
        <InlineMath>{"D"}</InlineMath>
      </Button>

      <div className="intr-filters-divider" />

      {unaryPredicatesCount !== 0 ? (
        <UnaryPredicatesFilter
          tupleName={tupleName}
          tupleType={tupleType}
          disabled={disabledFilters.includes("intrFilters")}
        />
      ) : (
        <span className="intr-filter-no-elements-info">
          No unary predicates to filter
        </span>
      )}
    </div>
  );
}

interface UnaryPredicatesFilterProps {
  tupleName: string;
  tupleType: TupleType;
  disabled: boolean;
}

function UnaryPredicatesFilter({
  tupleName,
  tupleType,
  disabled,
}: UnaryPredicatesFilterProps) {
  const dispatch = useAppDispatch();
  const predicates = useAppSelector(selectUnaryPreds).map(([name]) => name);
  const selectedPredicates = useAppSelector((state) =>
    selectSelectedUnary(state, tupleName, tupleType),
  );
  const predicatesExcludingSelf = predicates.filter(
    (name) => name !== tupleName,
  );

  const filtersGroupRef = useRef<HTMLFieldSetElement>(null);

  useDraggingScroll(filtersGroupRef);
  const scrollControls = useScrollControls(filtersGroupRef, { edgeMargin: 40 });

  if (disabled) return null;

  const handleSelectAll = () => {
    const allSelected =
      selectedPredicates.length === predicatesExcludingSelf.length;
    const newSelectedPredicates = allSelected
      ? []
      : predicatesExcludingSelf.map((pred) => pred);

    handlePredicateToggle(newSelectedPredicates);
  };

  const handlePredicateHover = (hoveredPredicates: string[]) => {
    dispatch(
      predicateHovered({
        tupleName,
        tupleType,
        predicates: hoveredPredicates,
      }),
    );
  };

  const handlePredicateToggle = (predicate: string | string[]) => {
    dispatch(unaryPredicateToggled({ tupleName, tupleType, predicate }));
  };

  return (
    <div className="unary-preds-filters-wrapper">
      {scrollControls.showLeftControl && (
        <div className="scroll-button-background left">
          <button
            className="scroll-button left"
            onClick={() => scrollControls.scrollIntoView("left")}
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>
        </div>
      )}

      <fieldset className="unary-preds-filters-group" ref={filtersGroupRef}>
        <Button
          className="legend-select-all editor-toolbar-button legend-button"
          title="Select all"
          onClick={handleSelectAll}
          onMouseEnter={() => handlePredicateHover(predicatesExcludingSelf)}
          onMouseLeave={() => handlePredicateHover([])}
        >
          <FontAwesomeIcon icon={faCheckDouble} />
        </Button>

        {predicatesExcludingSelf.map((predicate) => (
          <label
            key={predicate}
            className="unary-preds-filters-checkbox"
            style={{
              color: getUnaryPredicateColor(predicates.indexOf(predicate)),
            }}
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
              style={{
                color: getUnaryPredicateColor(predicates.indexOf(predicate)),
              }}
            >
              {selectedPredicates.includes(predicate) && (
                <FontAwesomeIcon icon={faCheck} />
              )}
            </span>
            <p
              style={{
                color: selectedPredicates.includes(predicate)
                  ? getUnaryPredicateColor(predicates.indexOf(predicate))
                  : "",
              }}
            >
              {predicate}
            </p>
          </label>
        ))}
      </fieldset>

      {scrollControls.showRightControl && (
        <div className="scroll-button-background right">
          <button
            className="scroll-button right"
            onClick={() => scrollControls.scrollIntoView("right")}
          >
            <FontAwesomeIcon icon={faAngleRight} />
          </button>
        </div>
      )}
    </div>
  );
}
