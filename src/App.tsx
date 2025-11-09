import "bootstrap/dist/css/bootstrap.min.css";
import StructureComponent from "./features/structure/StructureComponent";
import VariablesComponent from "./features/variables/VariablesComponent";
import { Col, Container, Row } from "react-bootstrap";
import LanguageComponent from "./features/language/LanguageComponent";
import FormulaCard from "./features/formulas/FormulaCard";
import "./App.css";
import usePreset from "./usePreset";
import Header from "./components_helper/Header";
import ComponentAccordion from "./components_helper/ComponentAccordion/ComponentAccordion";

function App() {
  usePreset();

  return (
    <Container fluid className="mt-2 mb-2">
      <Header />
      <Row className="g-3">
        <Col xs={12} xl={6}>
          <ComponentAccordion
            defaultActiveKey={["language", "structure", "variables"]}
          >
            <LanguageComponent />
            <StructureComponent />
            <VariablesComponent />
          </ComponentAccordion>
        </Col>
        <Col xs={12} xl={6}>
          <ComponentAccordion defaultActiveKey={["formulas"]}>
            <FormulaCard />
          </ComponentAccordion>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
