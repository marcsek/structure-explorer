import { Form } from "react-bootstrap";

type PredicateInputProps = {
  value: boolean;
  locked: boolean;
  invalid: boolean;
  hovered: boolean;
  columnError: boolean;
  onValueChange: () => void;
  onHovered: (hovered: boolean) => void;
};

export function PredicateTableCell({
  value,
  locked,
  invalid,
  hovered,
  columnError,
  onValueChange,
  onHovered,
}: PredicateInputProps) {
  const cellClass = columnError || invalid ? "error" : hovered ? "hovered" : "";
  const isDisabled = locked || (invalid && !value);

  return (
    <td
      className={cellClass}
      onMouseEnter={() => onHovered(true)}
      onMouseLeave={() => onHovered(false)}
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
}: FunctionInputProps) {
  return (
    <td className={columnError ? "error" : ""}>
      <Form.Control
        type="text"
        value={value}
        isInvalid={invalid}
        disabled={locked || (invalid && !value)}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
      />
    </td>
  );
}
