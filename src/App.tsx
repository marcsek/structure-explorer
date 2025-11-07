import "bootstrap/dist/css/bootstrap.min.css";
import StructureComponent from "./features/structure/StructureComponent";
import VariablesComponent from "./features/variables/VariablesComponent";
import { Col, Container, Row, Stack } from "react-bootstrap";
import LanguageComponent from "./features/language/LanguageComponent";
import FormulaCard from "./features/formulas/FormulaCard";
import "./App.css";
import usePreset from "./usePreset";
import Header from "./components_helper/Header";

function App() {
  usePreset();

  return (
    <Container fluid className="mt-2 mb-2">
      <Header />
      <Row>
        <Col xs={12} lg={6}>
          <Stack gap={3}>
            <LanguageComponent />
            <StructureComponent />
            <VariablesComponent />
          </Stack>
        </Col>
        <Col xs={12} lg={6}>
          <FormulaCard />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
