import { Form } from "react-bootstrap";
import type { MatrixCellState } from "./matrixViewSelectors";

type PredicateInputProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  cell: MatrixCellState;
  locked: boolean;
  onValueChange: () => void;
};

export function PredicateTableCell({
  cell,
  locked,
  onValueChange,
  ...cellProps
}: PredicateInputProps) {
  const { invalid, value, unselected, hatched } = cell;
  const isDisabled = locked || (invalid && !value) || unselected || hatched;

  return (
    <td
      {...cellProps}
      className={getCellClass(cell)}
      onClick={() => !isDisabled && onValueChange()}
    >
      <Form.Check
        type="checkbox"
        checked={!!value}
        disabled={isDisabled}
        isInvalid={invalid}
        onClick={(e) => e.stopPropagation()}
        onChange={onValueChange}
      />
    </td>
  );
}

type FunctionInputProps = {
  cell: MatrixCellState;
  locked: boolean;
  onValueChange: (value: string) => void;
  onBlur: () => void;
};

export function FunctionTableCell({
  cell,
  locked,
  onValueChange,
  onBlur,
}: FunctionInputProps) {
  const { value, invalid, unselected } = cell;

  return (
    <td className={getCellClass(cell)}>
      <Form.Control
        type="text"
        size="sm"
        value={value}
        isInvalid={invalid}
        disabled={locked || (invalid && !value) || unselected}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
      />
    </td>
  );
}

function getCellClass(cell: MatrixCellState) {
  const { hatched, unselected, columnError, invalid } = cell;

  const shouldError = !hatched && !unselected && (columnError || invalid);

  let cellClass = shouldError ? "error" : "";
  if (unselected) cellClass += " unselected";
  if (hatched) cellClass += " hatched";

  return cellClass;
}
