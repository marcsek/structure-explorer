import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form";
import { useRef } from "react";
import { exportAppState, importAppState } from "./importExportUtils.ts";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectTeacherMode,
  updateTeacherMode,
} from "../teacherMode/teacherModeSlice.ts";
import { useLogicContext } from "../../providers/logicContext";
import { parseSerializedAppStateWithDefaults } from "./validationSchema";
import { clearError, setError } from "../errorAlert/errorAlertSlice";
import { useInstanceId } from "../../providers/instanceIdContext.tsx";

export default function GearButton() {
  const dispatch = useAppDispatch();
  const teacherMode = useAppSelector(selectTeacherMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logicContext = useLogicContext();
  const instanceId = useInstanceId();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result?.toString() ?? "");
        const { data, errors } = parseSerializedAppStateWithDefaults(json);

        dispatch(importAppState(data, !!logicContext));

        if (errors.length !== 0) {
          throw errors;
        }

        dispatch(clearError());
      } catch (err) {
        console.error(err);
        dispatch(setError("localImportFailed"));
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <DropdownButton
        id={`dropdown-item-button-${instanceId}`}
        variant="secondary"
        title={<FontAwesomeIcon icon={faGear} />}
        autoClose={false}
      >
        <Dropdown.Item onClick={handleImportClick}>Import</Dropdown.Item>
        <Dropdown.Item onClick={() => dispatch(exportAppState())}>
          Export
        </Dropdown.Item>

        {teacherMode !== undefined && (
          <>
            <Form.Switch
              id={`gear-switch-teachermode-${instanceId}`}
              checked={teacherMode}
              type="switch"
              className="ms-3"
              label="Teacher mode"
              onChange={(e) => dispatch(updateTeacherMode(e.target.checked))}
            />
            <Dropdown.Item
              onClick={() => dispatch(updateTeacherMode(undefined))}
            >
              Lock to student mode
            </Dropdown.Item>
          </>
        )}
      </DropdownButton>

      <Form.Control
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="d-none"
      />
    </>
  );
}
