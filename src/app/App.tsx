import "./App.css";
import "../index.css";

import StructureComponent from "../features/structure/StructureComponent";
import VariablesComponent from "../features/variables/VariablesComponent";
import { Container, Row } from "react-bootstrap";
import LanguageComponent from "../features/language/LanguageComponent";
import FormulaCard from "../features/formulas/FormulaCard";
import Header from "../layout/Header";
import ErrorAlert from "../features/errorAlert/ErrorAlert";
import QueriesComponent from "../features/queries/QueriesComponent";
import SplitPane from "../layout/SplitPane/SplitPane";

interface AppProps {
  viewOnlyMode?: boolean;
}

function App({ viewOnlyMode }: AppProps) {
  return (
    <div className="structure-explorer position-relative app-component">
      <ErrorAlert />
      <Container
        fluid
        className={`mt-3 px-3 ${viewOnlyMode ? "view-mode" : ""}`}
      >
        <Row className="g-3">
          <Header />
        </Row>

        <SplitPane leftClassName="vh-pane-left" rightClassName="vh-pane-right">
          <>
            <LanguageComponent />
            <StructureComponent />
            <VariablesComponent />
          </>
          <>
            <FormulaCard />
            <QueriesComponent />
          </>
        </SplitPane>
      </Container>
    </div>
  );
}

export default App;
