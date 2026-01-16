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
  selectMatrixValuesWithInvalid,
  updateMatrixValue,
} from "./matrixViewSlice";
import type { TupleType } from "../structure/structureSlice";

interface MatrixViewProps {
  tupleName: string;
  tupleArity: number;
  tupleType: TupleType;
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

  const { values, leftovers } = useAppSelector((state) =>
    selectMatrixValuesWithInvalid(state, tupleName, tupleType),
  );

  const domain = useAppSelector((state) =>
    selectFilteredDomain(state, tupleName, true),
  ).sort();

  const isUnary = tupleArity === 1;

  const getValue = (row: string, col: string) =>
    values[getKeyFromDomainTuple(isUnary ? [row] : [row, col])]?.value;

  const isDuplicate = (row: string, col: string) =>
    values[getKeyFromDomainTuple(isUnary ? [row] : [row, col])]?.duplicate;

  const handleValueChange = (
    rowElement: string,
    colElement: string,
    value: string = "",
  ) => {
    if (locked) return;

    dispatch(
      updateMatrixValue({
        domainTuple: isUnary ? [rowElement] : [rowElement, colElement],
        tupleName,
        type: tupleType,
        value,
      }),
    );
  };

  const domainWithLeftovers = [...domain, ...leftovers].sort();

  const getTableClass = (element: string, hovered: string) =>
    leftovers.includes(element)
      ? "error"
      : hovered === element
        ? "hovered"
        : "";

  return (
    <Table className="table-bordered matrix-view-table">
      <thead>
        <tr>
          <th key="col-head">Domain</th>
          {!isUnary &&
            domainWithLeftovers.map((head) => (
              <th className={getTableClass(head, hovered.col)} key={head}>
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
          <tr key={`r-${row}`} className={getTableClass(row, hovered.row)}>
            <td key="row-head">
              <PredicateIndicatorTableHead
                predicateName={tupleName}
                domainId={row}
              />
            </td>

            {(isUnary ? [row] : domainWithLeftovers).map((col) =>
              tupleType === "predicate" ? (
                <TableDataInput
                  key={col}
                  tupleType={tupleType}
                  value={!!getValue(row, col)}
                  onValueChange={() => handleValueChange(row, col)}
                  locked={locked}
                  hovered={hovered.col === col}
                  columnError={leftovers.includes(col)}
                  invalid={
                    leftovers.includes(col) ||
                    leftovers.includes(row) ||
                    !!isDuplicate(row, col)
                  }
                  onHovered={(hovered) =>
                    setHovered(hovered ? { row, col } : { row: "", col: "" })
                  }
                />
              ) : (
                <TableDataInput
                  key={col}
                  tupleType={tupleType}
                  value={getValue(row, col) ?? ""}
                  columnError={leftovers.includes(col)}
                  invalid={
                    (!domain.includes(getValue(row, col)) &&
                      (getValue(row, col) ?? "") !== "") ||
                    leftovers.includes(col) ||
                    leftovers.includes(row) ||
                    !!isDuplicate(row, col)
                  }
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
      invalid: boolean;
      hovered: boolean;
      columnError: boolean;
    }
  | {
      tupleType: "function";
      value: string;
      locked: boolean;
      invalid: boolean;
      onValueChange: (value: string) => void;
      columnError: boolean;
    };

function TableDataInput(props: TableDataInputProps) {
  const { tupleType, locked, invalid, columnError } = props;

  if (tupleType === "predicate") {
    return (
      <td
        className={
          columnError || invalid ? "error" : props.hovered ? "hovered" : ""
        }
        onMouseEnter={() => props.onHovered(true)}
        onMouseLeave={() => props.onHovered(false)}
        onClick={() => (!invalid || props.value) && props.onValueChange()}
      >
        <Form.Check
          type="checkbox"
          checked={props.value}
          disabled={locked || (invalid && !props.value)}
          isInvalid={invalid}
          onClick={(e) => e.stopPropagation()}
          onChange={props.onValueChange}
        />
      </td>
    );
  }

  return (
    <td className={columnError ? "error" : ""}>
      <Form.Control
        type="text"
        value={props.value}
        isInvalid={invalid}
        onChange={(e) => props.onValueChange(e.target.value)}
        disabled={locked || (invalid && !props.value)}
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
