import { Stack } from "react-bootstrap";
import { useAppSelector } from "../app/hooks";
import GearButton from "../features/import/GearButton";
import { selectTeacherMode } from "../features/teacherMode/teacherModeslice";

export default function Header() {
  const teacherMode = useAppSelector(selectTeacherMode);

  const teacherModeStatus =
    teacherMode === false
      ? " Off"
      : teacherMode === true
        ? " On"
        : " Undefined";

  return (
    <Stack className="mb-2" direction="horizontal" gap={3}>
      <GearButton />
      <span>Teacher mode: {teacherModeStatus}</span>
    </Stack>
  );
}
