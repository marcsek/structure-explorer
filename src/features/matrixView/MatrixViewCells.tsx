import { Form } from "react-bootstrap";

type PredicateInputProps = {
  value: boolean;
  locked: boolean;
  invalid: boolean;
  columnError: boolean;
  unselected: boolean;
  onValueChange: () => void;
  onHovered?: (hovered: boolean) => void;
};

export function PredicateTableCell({
  value,
  locked,
  invalid,
  columnError,
  onValueChange,
  onHovered,
  unselected,
}: PredicateInputProps) {
  const shouldError = !unselected && (columnError || invalid);
  let cellClass = shouldError ? "error" : "";
  const isDisabled = locked || (invalid && !value) || unselected;

  if (unselected) cellClass += " unselected";

  return (
    <td
      className={cellClass}
      onMouseEnter={() => onHovered?.(true)}
      onMouseLeave={() => onHovered?.(false)}
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
}: FunctionInputProps) {
  return (
    <td className={(columnError || invalid) && !unselected ? "error" : ""}>
      <Form.Control
        type="text"
        value={value}
        isInvalid={invalid}
        disabled={locked || (invalid && !value) || unselected}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
      />
    </td>
  );
}
