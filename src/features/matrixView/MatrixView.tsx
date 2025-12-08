import "./MatrixView.css";

import { Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectIpName,
  updateInterpretationPredicates,
} from "../structure/structureSlice";
import { useMemo, useState } from "react";
import { selectUnaryPreds } from "../graphView/graphs/graphSlice";
import {
  selectFilteredDomain,
  selectPredicatesToDisplay,
} from "../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateToColorMap } from "../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../components_helper/RelevantPredicatesIndicator/RelevantPredicatesIndicator";

interface MatrixViewProps {
  predicateName: string;
  locked: boolean;
  expandedView?: boolean;
}

export default function MatrixView({ predicateName, locked }: MatrixViewProps) {
  const [hovered, setHovered] = useState({ row: "", col: "" });

  const dispatch = useAppDispatch();

  const interpretation = useAppSelector((state) =>
    selectIpName(state, predicateName),
  )?.value;

  const domain = useAppSelector((state) =>
    selectFilteredDomain(state, predicateName, true),
  ).sort();

  const interpretationLookup = useMemo(
    () => new Set((interpretation ?? []).map(([a, b]) => `${a},${b}`)),
    [interpretation],
  );

  const isChecked = (rowElement: string, colElement: string) =>
    interpretationLookup.has(`${rowElement},${colElement}`);

  const handleCheck = (rowElement: string, colElement: string) => {
    if (locked) return;

    let newInterpretation = [...(interpretation ?? [])];

    if (isChecked(rowElement, colElement))
      newInterpretation = newInterpretation.filter(
        ([a, b]) => a !== rowElement || b !== colElement,
      );
    else newInterpretation.push([rowElement, colElement]);

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
        <tr>
          <th key="col-head">Domain</th>
          {domain.map((headElement) => (
            <th
              className={hovered.col === headElement ? "hovered-col" : ""}
              key={headElement}
            >
              <PredicateIndicatorTableHead
                predicateName={predicateName}
                domainId={headElement}
              />
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
            <td key="row-head">
              <PredicateIndicatorTableHead
                predicateName={predicateName}
                domainId={rowElement}
              />
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

interface PredicateIndicatorTableHeadProps {
  predicateName: string;
  domainId: string;
}

function PredicateIndicatorTableHead({
  predicateName,
  domainId,
}: PredicateIndicatorTableHeadProps) {
  const allUnaryPreds = useAppSelector(selectUnaryPreds)?.sort();

  const [predsToDisplay] = useAppSelector((state) =>
    selectPredicatesToDisplay(state, predicateName, domainId),
  );

  const colorMap = getUnaryPredicateToColorMap(
    predsToDisplay ?? [],
    allUnaryPreds ?? [],
  );

  return (
    <div className="matrix-view-table-head">
      {domainId}
      <RelevantPredicatesIndicator
        predicateToColorMap={colorMap}
        size="sm"
        style={{
          overflow: "hidden",
          paddingLeft: "4px",
        }}
      />
    </div>
  );
}
