import App from "./App";
import { createStore } from "./app/store";
import { Provider } from "react-redux";
import { importAppState } from "./features/import/importThunk";
import { type CellContext, LogicContext } from "./logicContext";
import { useEffect } from "react";
interface PrepareResult {
  instance: any;
  getState: (instance: any) => any;
}

export function prepare(initialState?: any): PrepareResult {
  const store = createStore();

  const instance = { store: store };
  const getState = (instance: any) => {
    const storeState = instance.store.getState();
    return JSON.stringify(
      {
        formulas: storeState.formulas,
        language: storeState.language,
        structure: storeState.structure,
        variables: storeState.variables,
      },
      null,
      2
    );
  };

  if (initialState !== null) {
    const obj = JSON.parse(initialState);
    instance.store.dispatch(importAppState(obj));
  }

  return {
    instance: instance,
    getState: getState,
  };
}

interface AppComponentProps {
  instance: any;
  onStateChange: () => void;
  isEdited: boolean;
  context?: CellContext;
}

export function AppComponent({
  instance,
  onStateChange,
  isEdited,
  context,
}: AppComponentProps): JSX.Element {
  const appstore = instance.store;
  console.log(onStateChange);
  console.log(isEdited);
  console.log("store v appcomponente:");

  console.log(appstore.getState());

  useEffect(() => {
    const unsubscribe = appstore.subscribe(() => {
      onStateChange();
    });

    return () => {
      unsubscribe();
    };
  }, [appstore, onStateChange]);

  return (
    <>
      <Provider store={appstore}>
        <LogicContext.Provider value={context}>
          <App />
        </LogicContext.Provider>
      </Provider>
    </>
  );
}

export default { prepare, AppComponent };
