import "./TableView.css";

import { Table } from "react-bootstrap";
import {
  useAppDispatch,
  useAppSelector,
  useShallowAppSelector,
} from "../../app/hooks";
import { DomainPredicateIndicator } from "../drawerEditor/DomainPredicateIndicator";
import {
  matrixCellChanged,
  matrixCellToggled,
  selectMatrixAxisClass,
  selectMatrixCell,
  selectMatrixOrderedColumns,
  selectMatrixIsEmpty,
  selectMatrixOrderedRows,
} from "./matrixViewSelectors";
import { FunctionTableCell, PredicateTableCell } from "./MatrixViewCells";
import { UndoActions } from "../undoHistory/undoHistory";
import EmptyPlaceholder from "../../shared/ui/EmptyPlaceholder/EmptyPlaceholder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownLong,
  faArrowRightLong,
} from "@fortawesome/free-solid-svg-icons";
import useTableCrosshairHover from "./useTableCrosshairHover";
import type { TupleInfo } from "../structure/tupleInfo";
import type { DrawerEditorProps } from "../drawerEditor/drawerEditorAdapter";

export default function MatrixView({ tupleInfo, locked }: DrawerEditorProps) {
  const { tableRef, handleTableHover, clearHover } = useTableCrosshairHover();

  const columns = useShallowAppSelector((state) =>
    selectMatrixOrderedColumns(state, tupleInfo),
  );
  const rows = useShallowAppSelector((state) =>
    selectMatrixOrderedRows(state, tupleInfo),
  );
  const isEmpty = useAppSelector((state) =>
    selectMatrixIsEmpty(state, tupleInfo),
  );

  if (isEmpty) {
    return (
      <EmptyPlaceholder message="Nothing to display (selected domain is empty)" />
    );
  }

  return (
    <Table
      responsive
      className="table-bordered table-view"
      size="sm"
      ref={tableRef}
      onMouseOver={handleTableHover}
      onMouseLeave={clearHover}
    >
      <thead>
        <tr>
          <TableHeadsIndicator key="col-head" headCount={tupleInfo.arity} />
          {columns.map((head) => (
            <MatrixHead key={head} tupleInfo={tupleInfo} domainId={head} />
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIdx) => (
          <MatrixRow
            key={`r-${row}`}
            tupleInfo={tupleInfo}
            row={row}
            rowIdx={rowIdx}
            columns={columns}
            locked={locked}
          />
        ))}
      </tbody>
    </Table>
  );
}

interface MatrixRowProps {
  tupleInfo: TupleInfo;
  row: string;
  rowIdx: number;
  columns: string[];
  locked: boolean;
}

function MatrixRow({
  tupleInfo,
  row,
  rowIdx,
  columns,
  locked,
}: MatrixRowProps) {
  const isUnary = tupleInfo.arity === 1;

  const rowClass = useAppSelector((state) =>
    selectMatrixAxisClass(state, tupleInfo, row),
  );

  return (
    <tr className={rowClass}>
      <MatrixHead
        tupleInfo={tupleInfo}
        domainId={row}
        type="row"
        opaque={isUnary}
      />

      {columns.map((col, colIdx) => (
        <MatrixCell
          key={col}
          tupleInfo={tupleInfo}
          row={row}
          col={col}
          rowIdx={isUnary ? undefined : rowIdx}
          colIdx={colIdx}
          locked={locked}
        />
      ))}
    </tr>
  );
}

interface MatrixCellProps {
  tupleInfo: TupleInfo;
  row: string;
  col: string;
  rowIdx?: number;
  colIdx: number;
  locked: boolean;
}

function MatrixCell({
  tupleInfo,
  row,
  col,
  rowIdx,
  colIdx,
  locked,
}: MatrixCellProps) {
  const dispatch = useAppDispatch();

  const cellState = useShallowAppSelector((state) =>
    selectMatrixCell(state, tupleInfo, row, col),
  );

  if (tupleInfo.type === "predicate") {
    return (
      <PredicateTableCell
        cell={cellState}
        locked={locked}
        onValueChange={() =>
          dispatch(matrixCellToggled({ tupleInfo, row, col }))
        }
        data-row={cellState.unselected ? undefined : rowIdx}
        data-col={cellState.unselected ? undefined : colIdx}
      />
    );
  }

  return (
    <FunctionTableCell
      cell={cellState}
      locked={locked}
      onValueChange={(value) =>
        dispatch(matrixCellChanged({ tupleInfo, row, col, value }))
      }
      onBlur={() => dispatch(UndoActions.checkpoint())}
    />
  );
}

interface MatrixHeadProps {
  tupleInfo: TupleInfo;
  domainId: string;
  type?: "row" | "column";
  opaque?: boolean;
}

function MatrixHead({
  tupleInfo,
  domainId,
  type = "column",
  opaque = false,
}: MatrixHeadProps) {
  const headClass = useAppSelector((state) =>
    selectMatrixAxisClass(state, tupleInfo, domainId),
  );

  const HeadElement = type === "column" ? "th" : "td";

  return (
    <HeadElement className={headClass}>
      {!opaque && (
        <div className="table-view-head">
          {domainId}
          <DomainPredicateIndicator
            tupleInfo={tupleInfo}
            domainId={domainId}
            showEmpty
          />
        </div>
      )}
    </HeadElement>
  );
}

interface TableHeadsIndicatorProps {
  headCount: number;
}

function TableHeadsIndicator({ headCount }: TableHeadsIndicatorProps) {
  return (
    <th className="table-heads-indicator">
      <div className="table-heads-indicator-item down">
        {headCount > 1 && (
          <>
            <span>(</span>
            <FontAwesomeIcon icon={faArrowDownLong} />
          </>
        )}
        <span>
          <var>m</var>
          <sub>1</sub>
        </span>
      </div>
      {headCount > 1 && (
        <>
          <span>,</span>
          <div className="table-heads-indicator-item right">
            <FontAwesomeIcon icon={faArrowRightLong} />
            <span>
              <var>m</var>
              <sub>2</sub>
            </span>
          </div>
          <span>)</span>
        </>
      )}
    </th>
  );
}
