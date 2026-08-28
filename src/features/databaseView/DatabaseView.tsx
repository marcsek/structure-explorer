import "../matrixView/TableView.css";

import { Button, Form, Table } from "react-bootstrap";
import {
  useAppDispatch,
  useAppSelector,
  useShallowAppSelector,
} from "../../app/hooks";
import {
  databaseCellBlurred,
  databaseCellChanged,
  databaseTupleDeleted,
  selectDatabaseCell,
  selectDatabaseIsEmpty,
  selectDatabaseRow,
  selectDatabaseRowCount,
} from "./databaseViewSlice";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import EmptyPlaceholder from "../../shared/ui/EmptyPlaceholder/EmptyPlaceholder";
import { DomainPredicateIndicator } from "../drawerEditor/DomainPredicateIndicator";
import { getTupleLength, type TupleInfo } from "../structure/tupleInfo";
import type { DrawerEditorProps } from "../drawerEditor/drawerEditorAdapter";

export default function DatabaseView({ tupleInfo, locked }: DrawerEditorProps) {
  const columnCount = getTupleLength(tupleInfo.type, tupleInfo.arity);

  const rowCount = useAppSelector((state) =>
    selectDatabaseRowCount(state, tupleInfo),
  );
  const isEmpty = useAppSelector((state) =>
    selectDatabaseIsEmpty(state, tupleInfo),
  );

  if (isEmpty) {
    return <EmptyPlaceholder message="Nothing to display (domain is empty)" />;
  }

  return (
    <Table responsive className="table-bordered table-view" size="sm">
      <thead>
        <tr>
          {Array.from({ length: columnCount }, (_, idx) => (
            <th key={`head-${idx}`}>
              <var>m</var>
              <sub>{idx + 1}</sub>
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: rowCount }, (_, rowIdx) => (
          <DatabaseRow
            key={`row-${rowIdx}`}
            tupleInfo={tupleInfo}
            rowIdx={rowIdx}
            columnCount={columnCount}
            locked={locked}
          />
        ))}
      </tbody>
    </Table>
  );
}

interface DatabaseRowProps {
  tupleInfo: TupleInfo;
  rowIdx: number;
  columnCount: number;
  locked: boolean;
}

function DatabaseRow({
  tupleInfo,
  rowIdx,
  columnCount,
  locked,
}: DatabaseRowProps) {
  const dispatch = useAppDispatch();

  const { duplicate, isLast } = useShallowAppSelector((state) =>
    selectDatabaseRow(state, tupleInfo, rowIdx),
  );

  const canDelete = !locked && !isLast && tupleInfo.type === "predicate";

  return (
    <tr className={duplicate ? "error" : ""}>
      {Array.from({ length: columnCount }, (_, colIdx) => (
        <DatabaseCell
          key={`col-${colIdx}`}
          tupleInfo={tupleInfo}
          rowIdx={rowIdx}
          colIdx={colIdx}
          locked={locked}
        />
      ))}

      {canDelete && (
        <DeleteTupleTableEntryButton
          isDuplicate={duplicate}
          onDelete={() => dispatch(databaseTupleDeleted({ tupleInfo, rowIdx }))}
        />
      )}
    </tr>
  );
}

interface DatabaseCellProps {
  tupleInfo: TupleInfo;
  rowIdx: number;
  colIdx: number;
  locked: boolean;
}

function DatabaseCell({
  tupleInfo,
  rowIdx,
  colIdx,
  locked,
}: DatabaseCellProps) {
  const dispatch = useAppDispatch();
  const checkpointOnBlur = useRef<boolean | null>(null);

  const { value, leftover, invalid, readOnly, showIndicator } =
    useShallowAppSelector((state) =>
      selectDatabaseCell(state, tupleInfo, rowIdx, colIdx),
    );

  const handleChange = (newValue: string) => {
    checkpointOnBlur.current = dispatch(
      databaseCellChanged({ tupleInfo, rowIdx, colIdx, value: newValue }),
    );
  };

  const handleBlur = () => {
    dispatch(
      databaseCellBlurred({
        tupleInfo,
        rowIdx,
        checkpointOnBlur: checkpointOnBlur.current,
      }),
    );

    checkpointOnBlur.current = null;
  };

  return (
    <td className={leftover ? "error" : ""}>
      <div className="table-view-data-indicator">
        {readOnly ? (
          <span>{value}</span>
        ) : (
          <Form.Control
            type="text"
            size="sm"
            value={value}
            disabled={locked}
            isInvalid={invalid}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
          />
        )}

        {showIndicator && (
          <DomainPredicateIndicator tupleInfo={tupleInfo} domainId={value} />
        )}
      </div>
    </td>
  );
}

interface DeleteTupleTableEntryProps {
  isDuplicate: boolean;
  onDelete: () => void;
}

function DeleteTupleTableEntryButton({
  isDuplicate,
  onDelete,
}: DeleteTupleTableEntryProps) {
  return (
    <td className="align-middle">
      <Button
        size="sm"
        className={!isDuplicate ? "btn-bd-light" : "btn-danger"}
        onClick={onDelete}
      >
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </td>
  );
}
