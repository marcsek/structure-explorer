import "./DomainSelector.css";

import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectValidatedDomain,
  type TupleType,
} from "../../structure/structureSlice";
import {
  selectRelevantUnaryPreds,
  selectUnaryPreds,
} from "../../graphView/graphs/graphSlice";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faFilter } from "@fortawesome/free-solid-svg-icons";
import {
  nodeToggled,
  selectSelectedDomain,
} from "../../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateToColorMap } from "../../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../../components_helper/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import useClickAwayListener from "./useClickAwayListener";

export interface DomainSelectorProps {
  tupleName: string;
  tupleType: TupleType;
  disabled: boolean;
}

export default function DomainSelector({
  tupleName,
  tupleType,
  disabled,
}: DomainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dispatch = useAppDispatch();
  const domain = useAppSelector(selectValidatedDomain)?.parsed ?? [];
  const selectedNodes = useAppSelector((state) =>
    selectSelectedDomain(state, tupleName, tupleType),
  );
  const onClickOutside = useCallback(() => setIsOpen(false), []);

  const clickAwayRef = useClickAwayListener<HTMLDivElement>({
    onClickOutside,
    shouldListen: isOpen,
  });

  const activeFilters = domain.length !== selectedNodes.length;

  const toggleItem = (element: string = "") =>
    dispatch(nodeToggled({ tupleName, tupleType, domain, node: element }));

  return (
    <div
      className={`domain-selector ${activeFilters ? "active" : ""}`}
      ref={clickAwayRef}
    >
      <Button
        className={`domain-selector-toggle editor-toolbar-button ${activeFilters ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="Domain Filters"
        disabled={disabled}
      >
        <div className="domain-selector-toggle-icon-container">
          <div className="domain-selector-toggle-icon-indicator" />
          <FontAwesomeIcon icon={faFilter} />
        </div>
      </Button>

      {isOpen && (
        <div className="domain-selector-body">
          <div className="domain-selector-header">
            <p>Selected Elements</p>
            <button className="select-all" onClick={() => toggleItem()}>
              <FontAwesomeIcon icon={faCheckDouble} />
              Select All
            </button>
          </div>

          <div className="domain-selector-body-divider" />

          <div className="domain-selector-list-container">
            <div className="domain-selector-list-header">
              <span>Element</span>
              <span>Unary Predicates</span>
            </div>

            {domain.length === 0 && (
              <span className="domain-selector-list-empty-text">
                No domain elements to display
              </span>
            )}

            <ul className="domain-selector-list">
              {domain.map((item) => (
                <DomainSelectorItem
                  key={item}
                  element={item}
                  isSelected={selectedNodes.includes(item)}
                  onToggle={() => toggleItem(item)}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainSelectorItem({
  element,
  isSelected,
  onToggle,
}: {
  element: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds) ?? [];
  const relevantPreds =
    useAppSelector((state) => selectRelevantUnaryPreds(state, element)) ?? [];

  const colorMap = getUnaryPredicateToColorMap(relevantPreds, allUnaryPreds);

  return (
    <li key={element}>
      <button
        className={`domain-selector-item ${isSelected ? "active" : ""}`}
        onClick={onToggle}
        tabIndex={0}
        aria-pressed={isSelected}
      >
        <span>{element}</span>

        <RelevantPredicatesIndicator predicateToColorMap={colorMap} />
      </button>
    </li>
  );
}
