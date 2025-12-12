import "./MatrixView.css";

import { Form, Table } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useState } from "react";
import { selectUnaryPreds } from "../graphView/graphs/graphSlice";
import {
  selectFilteredDomain,
  selectPredicatesToDisplay,
} from "../editorToolbar/editorToolbarSlice";
import { getUnaryPredicateToColorMap } from "../drawerEditor/unaryPredicateColors";
import { RelevantPredicatesIndicator } from "../../components_helper/RelevantPredicatesIndicator/RelevantPredicatesIndicator";
import {
  getKeyFromDomainTuple,
  selectMatrixLeftovers,
  selectMatrixValues,
  updateMatrixValue,
} from "./matrixViewSlice";

interface MatrixViewProps {
  tupleName: string;
  tupleArity: number;
  tupleType: "predicate" | "function";
  locked: boolean;
  expandedView?: boolean;
}

export default function MatrixView({
  tupleName,
  tupleArity,
  tupleType,
  locked,
}: MatrixViewProps) {
  const [hovered, setHovered] = useState({ row: "", col: "" });

  const dispatch = useAppDispatch();

  const domain = useAppSelector((state) =>
    selectFilteredDomain(state, tupleName, true),
  ).sort();

  const leftoverDomain = useAppSelector((state) =>
    selectMatrixLeftovers(state, tupleName, tupleType),
  );

  const values = useAppSelector((state) =>
    selectMatrixValues(state, tupleName, tupleType),
  );

  const getValue = (row: string, col: string) =>
    values[getKeyFromDomainTuple(tupleArity > 1 ? [row, col] : [row])]?.value;

  const handleValueChange = (
    rowElement: string,
    colElement: string,
    value?: string,
  ) => {
    if (locked) return;

    dispatch(
      updateMatrixValue({
        domainTuple: tupleArity > 1 ? [rowElement, colElement] : [rowElement],
        tupleName,
        type: tupleType,
        value,
      }),
    );
  };

  const domainWithLeftovers = [...domain, ...leftoverDomain];

  return (
    <Table className="table-bordered matrix-view-table">
      <thead>
        <tr>
          <th key="col-head">Domain</th>
          {tupleArity > 1 &&
            domainWithLeftovers.map((head) => (
              <th
                className={`${hovered.col === head ? "hovered-col" : ""} ${leftoverDomain.includes(head) ? " leftover" : ""}`}
                key={head}
              >
                <PredicateIndicatorTableHead
                  predicateName={tupleName}
                  domainId={head}
                />
              </th>
            ))}
        </tr>
      </thead>

      <tbody>
        {domainWithLeftovers.map((row) => (
          <tr
            key={`r-${row}`}
            className={hovered.row === row ? "hovered-row" : ""}
          >
            <td
              key="row-head"
              className={`${leftoverDomain.includes(row) ? "leftover" : ""}`}
            >
              <PredicateIndicatorTableHead
                predicateName={tupleName}
                domainId={row}
              />
            </td>

            {(tupleArity > 1 ? domainWithLeftovers : [row]).map((col) =>
              tupleType === "predicate" ? (
                <TableDataInput
                  key={col}
                  tupleType={tupleType}
                  value={!!getValue(row, col)}
                  onValueChange={() => handleValueChange(row, col)}
                  locked={locked}
                  hovered={hovered.col === col}
                  onHovered={(hovered) =>
                    setHovered(hovered ? { row, col } : { row: "", col: "" })
                  }
                />
              ) : (
                <TableDataInput
                  key={col}
                  tupleType={tupleType}
                  value={getValue(row, col) ?? ""}
                  onValueChange={(value) => handleValueChange(row, col, value)}
                  locked={locked}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

type TableDataInputProps =
  | {
      tupleType: "predicate";
      value: boolean;
      locked: boolean;
      onValueChange: () => void;
      onHovered: (hovered: boolean) => void;
      hovered: boolean;
    }
  | {
      tupleType: "function";
      value: string;
      locked: boolean;
      onValueChange: (value: string) => void;
    };

function TableDataInput(props: TableDataInputProps) {
  const { tupleType, locked } = props;

  if (tupleType === "predicate") {
    return (
      <td
        className={props.hovered ? "hovered-col" : ""}
        onMouseEnter={() => props.onHovered(true)}
        onMouseLeave={() => props.onHovered(false)}
        onClick={props.onValueChange}
      >
        <Form.Check
          type="checkbox"
          checked={props.value}
          disabled={locked}
          onClick={(e) => e.stopPropagation()}
          onChange={props.onValueChange}
        />
      </td>
    );
  }

  return (
    <td>
      <input
        value={props.value}
        onChange={(e) => props.onValueChange(e.target.value)}
        disabled={locked}
      />
    </td>
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
      <RelevantPredicatesIndicator predicateToColorMap={colorMap} size="sm" />
    </div>
  );
}
