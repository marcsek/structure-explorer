import "bootstrap/dist/css/bootstrap.min.css";
import StructureComponent from "./features/structure/StructureComponent";
import VariablesComponent from "./features/variables/VariablesComponent";
import { Col, Container, Row } from "react-bootstrap";
import LanguageComponent from "./features/language/LanguageComponent";
import GearButton from "./features/import/GearButton";
import { useAppSelector } from "./app/hooks";
import { selectTeacherMode } from "./features/teacherMode/teacherModeslice";
import FormulaCard from "./features/formulas/FormulaCard";
import "./App.css";

function App() {
  const teacherMode = useAppSelector(selectTeacherMode);
  return (
    <>
      <Container fluid>
        <GearButton /> Teacher mode:
        {teacherMode === false
          ? " Off"
          : teacherMode === true
            ? " On"
            : " Undefined"}
        <Row>
          <Col className="min-w-0">
            <LanguageComponent />
            <StructureComponent />
            <VariablesComponent />
          </Col>
          <Col>
            <FormulaCard />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
