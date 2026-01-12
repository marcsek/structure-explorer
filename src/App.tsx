import StructureComponent from "./features/structure/StructureComponent";
import VariablesComponent from "./features/variables/VariablesComponent";
import { Col, Container, Row } from "react-bootstrap";
import LanguageComponent from "./features/language/LanguageComponent";
import FormulaCard from "./features/formulas/FormulaCard";
import "./App.css";
import usePreset from "./usePreset";
import Header from "./components_helper/Header";

function App() {
  usePreset();

  return (
    <Container fluid className="structure-explorer mt-2 mb-2 px-3">
      <Row className="g-3">
        <Header />
      </Row>
      <Row className="gx-4">
        <Col xs={12} xl={6} className="border-end-xl border-1 col-divider">
          <LanguageComponent />
          <StructureComponent />
          <VariablesComponent />
        </Col>
        <Col xs={12} xl={6}>
          <FormulaCard />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
