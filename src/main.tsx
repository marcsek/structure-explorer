import React from "react";
import ReactDOM from "react-dom";
import { StrictMode } from "react";

import App from "./App";
import "katex/dist/katex.min.css";
import { createStore } from "./app/store";
import { Provider } from "react-redux";

ReactDOM.render(
  <StrictMode>
    <Provider store={createStore()}>
      <App />
    </Provider>
  </StrictMode>,
  document.getElementById("root")
);
