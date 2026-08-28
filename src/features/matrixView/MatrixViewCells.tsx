import { Form } from "react-bootstrap";

type PredicateInputProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  value: boolean;
  locked: boolean;
  invalid: boolean;
  columnError: boolean;
  unselected: boolean;
  hatched: boolean;
  onValueChange: () => void;
};

export function PredicateTableCell({
  value,
  locked,
  invalid,
  columnError,
  onValueChange,
  unselected,
  hatched,
  ...cellProps
}: PredicateInputProps) {
  const shouldError = !hatched && !unselected && (columnError || invalid);
  let cellClass = shouldError ? "error" : "";
  const isDisabled = locked || (invalid && !value) || unselected || hatched;

  if (unselected) cellClass += " unselected";
  if (hatched) cellClass += " hatched";

  return (
    <td
      {...cellProps}
      className={cellClass}
      onClick={() => !isDisabled && onValueChange()}
    >
      <Form.Check
        type="checkbox"
        checked={value}
        disabled={isDisabled}
        isInvalid={invalid}
        onClick={(e) => e.stopPropagation()}
        onChange={onValueChange}
      />
    </td>
  );
}

type FunctionInputProps = {
  value: string;
  locked: boolean;
  invalid: boolean;
  columnError: boolean;
  unselected: boolean;
  hatched: boolean;
  onValueChange: (value: string) => void;
  onBlur: () => void;
};

export function FunctionTableCell({
  value,
  locked,
  invalid,
  columnError,
  onValueChange,
  onBlur,
  unselected,
  hatched,
}: FunctionInputProps) {
  const shouldError = !hatched && !unselected && (columnError || invalid);
  let cellClass = shouldError ? "error" : "";

  if (unselected) cellClass += " unselected";
  if (hatched) cellClass += " hatched";

  return (
    <td className={cellClass}>
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
