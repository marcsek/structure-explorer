import "bootstrap/dist/css/bootstrap.min.css";
import "katex/dist/katex.min.css";

import ReactDOM from "react-dom";
import { StrictMode } from "react";
import { createStore } from "./app/store";
import { Provider } from "react-redux";
import StandaloneApp from "./app/StandaloneApp";

ReactDOM.render(
  <StrictMode>
    <Provider store={createStore()}>
      <StandaloneApp />
    </Provider>
  </StrictMode>,
  document.getElementById("root"),
);
