import "./MatrixView.css";

import { Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectDomain,
  selectIpName,
  updateInterpretationPredicates,
} from "../structure/structureSlice";
import { useState } from "react";
import {
  selectRelevantUnaryPreds,
  selectUnaryPreds,
} from "../graphView/graphs/graphSlice";
import {
  selectHoveredUnary,
  selectRelevantDomainElements,
  selectSelectedNodes,
  selectSelectedUnary,
} from "../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateColor } from "../drawerEditor/unaryPredicateColors";

interface MatrixViewProps {
  predicateName: string;
  locked: boolean;
  expandedView?: boolean;
}

export default function MatrixView({
  predicateName,
  locked,
  expandedView = false,
}: MatrixViewProps) {
  const [hovered, setHovered] = useState({ row: "", col: "" });

  const dispatch = useAppDispatch();

  const interpretation =
    useAppSelector((state) => selectIpName(state, predicateName))?.value ?? [];
  let domain =
    useAppSelector((state) =>
      selectRelevantDomainElements(state, predicateName, true),
    ) ?? [];

  const selectedDomain = useAppSelector((state) =>
    selectSelectedNodes(state, predicateName),
  );
  const wholeDomain = useAppSelector(selectDomain)?.value ?? [];

  domain = domain.length === 0 ? [...wholeDomain] : [...domain];

  domain = domain.filter((element) => selectedDomain.includes(element));

  domain.sort();

  const isChecked = (rowElement: string, colElement: string) => {
    return interpretation.some(
      ([a, b]) => a === rowElement && b === colElement,
    );
  };

  const handleCheck = (rowElement: string, colElement: string) => {
    if (locked) return;

    let newInterpretation = [...interpretation];

    if (isChecked(rowElement, colElement)) {
      newInterpretation = newInterpretation.filter(
        ([a, b]) => a !== rowElement || b !== colElement,
      );
    } else newInterpretation.push([rowElement, colElement]);

    dispatch(
      updateInterpretationPredicates({
        value: newInterpretation,
        key: predicateName,
      }),
    );
  };

  return (
    <Table className="table-bordered matrix-view-table">
      <thead>
        <tr key={"head"}>
          <th key={"col-head"}>Domain</th>
          {domain.map((headElement) => (
            <th
              className={hovered.col === headElement ? "hovered-col" : ""}
              key={headElement}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {headElement}
                <UnaryPredicatesIndicator
                  predicateName={predicateName}
                  domainId={headElement}
                />
              </div>
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {domain.map((rowElement) => (
          <tr
            key={`r-${rowElement}`}
            className={hovered.row === rowElement ? "hovered-row" : ""}
          >
            <td key={"row-head"}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {rowElement}
                <UnaryPredicatesIndicator
                  predicateName={predicateName}
                  domainId={rowElement}
                />
              </div>
            </td>
            {domain.map((colElement) => (
              <td
                key={colElement}
                className={`${hovered.col === colElement ? "hovered-col" : ""}`}
                onMouseEnter={() =>
                  setHovered({ row: rowElement, col: colElement })
                }
                onMouseLeave={() => setHovered({ row: "", col: "" })}
                onClick={() => handleCheck(rowElement, colElement)}
              >
                <Form.Check
                  type="checkbox"
                  checked={isChecked(rowElement, colElement)}
                  disabled={locked}
                  onChange={() => handleCheck(rowElement, colElement)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

interface UnaryPredicatesIndicatorProps {
  predicateName: string;
  domainId: string;
}

function UnaryPredicatesIndicator({
  predicateName,
  domainId,
}: UnaryPredicatesIndicatorProps) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds)?.sort();

  const unaryPreds = useAppSelector((state) =>
    selectRelevantUnaryPreds(state, domainId),
  );

  const hoveredPreds = useAppSelector((state) =>
    selectHoveredUnary(state, predicateName),
  );

  const selectedPreds = useAppSelector((state) =>
    selectSelectedUnary(state, predicateName),
  );

  const vissiblePreds = [...hoveredPreds, ...selectedPreds];

  const predsToDisplay = unaryPreds
    .filter((relevant) => vissiblePreds.includes(relevant))
    ?.sort();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        borderRadius: "100px",
        overflow: "hidden",
        paddingLeft: "4px",
      }}
    >
      {predsToDisplay.map((pred) => (
        <div
          key={pred}
          style={{
            backgroundColor: getUnaryPredicateColor(
              allUnaryPreds.findIndex((p) => p[0] === pred),
            ),
            width: "16px",
            height: "16px",
            borderRadius: "100px",
            outline: "2px solid white",
            marginLeft: "-4px",
          }}
        />
      ))}
    </div>
  );
}
