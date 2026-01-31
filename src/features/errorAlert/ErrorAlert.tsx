import Alert from "react-bootstrap/Alert";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { clearError } from "./errorAlertSlice";
import { Toast, ToastContainer } from "react-bootstrap";

export default function ErrorAlert() {
  const dispatch = useAppDispatch();
  const errorKind = useAppSelector(
    (state) => state.present.errorAlert.errorKind,
  );

  return (
    <>
      <ToastErrorVisual
        show={errorKind === "localImportFailed"}
        heading="Import failed"
        message="The provided JSON file was invalid. See console output for details."
        onClose={() => dispatch(clearError())}
      />

      <AlertErrorVisual
        show={errorKind === "workbookImportFailed"}
        heading="Error while restoring cell data"
        message="An unexpected error occurred while importing the saved data for this cell. Some data may be incomplete."
        onClose={() => dispatch(clearError())}
      />
    </>
  );
}

interface ErrorVisual {
  heading: string;
  message: string;
  onClose: () => void;
  show: boolean;
}

function ToastErrorVisual({ heading, message, onClose, show }: ErrorVisual) {
  return (
    <ToastContainer
      as="div"
      className="position-absolute m-2"
      position="top-start"
    >
      <Toast
        animation
        bg="danger"
        className="overflow-hidden m-2"
        onClose={onClose}
        show={show}
      >
        <Toast.Header className="bg-danger-subtle">
          <strong className="me-auto">{heading}</strong>
        </Toast.Header>
        <Toast.Body className="bg-white overflow-hidden">{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

function AlertErrorVisual({ heading, message, onClose, show }: ErrorVisual) {
  if (!show) return null;

  return (
    <Alert className="rounded-0" variant="danger" onClose={onClose} dismissible>
      <Alert.Heading>{heading}</Alert.Heading>
      <p>{message}</p>
    </Alert>
  );
}
