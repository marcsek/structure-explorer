import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form";
import { useRef } from "react";

import { exportAppState, importAppState } from "./importThunk";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectTeacherMode,
  updateTeacherMode,
} from "../teacherMode/teacherModeslice";

export default function GearButton() {
  const dispatch = useAppDispatch();
  const teacherMode = useAppSelector(selectTeacherMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result?.toString()!);
        dispatch(importAppState(json));
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <DropdownButton
        id="dropdown-item-button"
        variant="secondary"
        title={<FontAwesomeIcon icon={faGear} />}
        autoClose={false}
        className="mt-2"
      >
        <Dropdown.Item onClick={handleImportClick}>Import</Dropdown.Item>
        <Dropdown.Item onClick={() => dispatch(exportAppState())}>
          Export
        </Dropdown.Item>

        {teacherMode !== undefined && (
          <Form.Switch
            checked={teacherMode}
            type="switch"
            className="ms-3"
            id="custom-switch"
            label="Teacher mode"
            onChange={(e) => dispatch(updateTeacherMode(e.target.checked))}
          />
        )}
        {teacherMode !== undefined && (
          <Dropdown.Item onClick={() => dispatch(updateTeacherMode(undefined))}>
            Lock to student mode
          </Dropdown.Item>
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
