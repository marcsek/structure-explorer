import StructureComponent from "./features/structure/StructureComponent";
import VariablesComponent from "./features/variables/VariablesComponent";
import { Col, Container, Row } from "react-bootstrap";
import LanguageComponent from "./features/language/LanguageComponent";
import FormulaCard from "./features/formulas/FormulaCard";
import "./App.css";
import usePreset from "./usePreset";
import Header from "./components_helper/Header";
import ErrorAlert from "./features/errorAlert/ErrorAlert";
import QueriesComponent from "./features/queries/QueriesComponent";

interface AppProps {
  viewOnlyMode?: boolean;
}

function App({ viewOnlyMode }: AppProps) {
  usePreset();

  return (
    <div className="structure-explorer position-relative">
      <ErrorAlert />
      <Container
        fluid
        className={`mt-3 px-3 ${viewOnlyMode ? "view-mode" : ""}`}
      >
        <Row className="g-3">
          <Header />
        </Row>
        <Row className="gx-4 split-pane">
          <Col xs={12} lg={6} className="vh-pane-left col-divider">
            <LanguageComponent />
            <StructureComponent />
            <VariablesComponent />
          </Col>
          <Col className="vh-pane-right" xs={12} lg={6}>
            <FormulaCard />
            <QueriesComponent />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
