import { SyntaxError, type Location } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { Form } from "react-bootstrap";
import type { InterpretationError } from "../features/textView/textViewSlice";

// TODO
interface Props {
  error: SyntaxError | Error | InterpretationError | undefined;
  text: string;
}

interface LocationDisplayProps {
  location: Location;
  text: string;
}

function LocationDisplay({ location, text }: LocationDisplayProps) {
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

export default function ErrorFeedback({ error, text }: Props) {
  if (!error) {
    return null;
  }
  return (
    <>
      <Form.Control.Feedback type="invalid">
        {error.message}
        {error instanceof SyntaxError ||
          (!(error instanceof Error) && error.kind === "syntax" && (
            <LocationDisplay location={error.location} text={text} />
          ))}
      </Form.Control.Feedback>
    </>
  );
}
