import Alert from "react-bootstrap/Alert";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { clearError } from "./errorAlertSlice";
import { Toast, ToastContainer } from "react-bootstrap";

export default function ErrorAlert() {
  const dispatch = useAppDispatch();
  const errorKind = useAppSelector(
    (state) => state.present.errorAlert.errorKind,
  );

  switch (errorKind) {
    case "localImportFailed":
      return (
        <ToastErrorVisual
          heading="Import failed"
          message="The provided JSON file was invalid. See console output for details."
          onClose={() => dispatch(clearError())}
        />
      );
    case "workbookImportFailed":
      return (
        <AlertErrorVisual
          heading="Error restoring cell data"
          message="An unexpected error occurred while importing the saved data for this cell. Some data may be incomplete."
          onClose={() => dispatch(clearError())}
        />
      );
    default:
      return null;
  }
}

interface ErrorVisual {
  heading: string;
  message: string;
  onClose: () => void;
}

function ToastErrorVisual({ heading, message, onClose }: ErrorVisual) {
  return (
    <ToastContainer
      as="div"
      className="position-absolute left-50"
      style={{ top: "1.5rem", left: "1.5rem" }}
    >
      <Toast bg="danger" className="overflow-hidden" onClose={onClose}>
        <Toast.Header className="bg-danger-subtle">
          <strong className="me-auto">{heading}</strong>
        </Toast.Header>
        <Toast.Body className="bg-white overflow-hidden">{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

function AlertErrorVisual({ heading, message, onClose }: ErrorVisual) {
  return (
    <Alert variant="danger" onClose={onClose} dismissible>
      <Alert.Heading>{heading}</Alert.Heading>
      <p>{message}</p>
    </Alert>
  );
}
