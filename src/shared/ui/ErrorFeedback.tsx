import { SyntaxError, type Location } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { Form } from "react-bootstrap";
import type { InterpretationError } from "../core/errors";

// TODO: better error type
interface ErrorFeedbackProps {
  id?: string;
  error: Error | InterpretationError | undefined;
  text: string;
}

interface LocationDisplayProps {
  text: string;
  location: Location;
}

function LocationDisplay({ text, location }: LocationDisplayProps) {
  if (!text) return null;

  return (
    <div>
      {text.substring(0, location.start.offset)}
      {
        <mark>
          {text.substring(location.start.offset, location.end.offset)}
        </mark>
      }
      {text.substring(location.end.offset)}
    </div>
  );
}

export default function ErrorFeedback({ id, error, text }: ErrorFeedbackProps) {
  if (!error) return null;

  const hasLocation =
    error instanceof SyntaxError ||
    (!(error instanceof Error) && error.kind === "syntax");

  return (
    <Form.Control.Feedback id={id} type="invalid">
      {error.message}
      {hasLocation && error.location && (
        <LocationDisplay location={error.location!} text={text} />
      )}
    </Form.Control.Feedback>
  );
}
