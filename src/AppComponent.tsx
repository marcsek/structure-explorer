/* eslint-disable @typescript-eslint/no-explicit-any */

import App from "./App";
import { createStore } from "./app/store";
import { Provider } from "react-redux";
import {
  getAppStateToExport,
  importAppState,
} from "./features/import/importThunk";
import { type CellContext, LogicContext } from "./logicContext";
import { useEffect } from "react";
import { serializedAppStateSchema } from "./features/import/validationSchema";

interface PrepareResult {
  instance: any;
  getState: (instance: any) => any;
}

export function prepare(initialState?: any): PrepareResult {
  const store = createStore();
  const instance = { store };

  const getState = (instance: any) => {
    const storeState = instance.store.getState();
    return getAppStateToExport(storeState);
  };

  if (initialState !== null) {
    console.log("Importing app state");

    const result = serializedAppStateSchema.safeParse(initialState);

    if (!result.success) console.log(result.error.message);
    else instance.store.dispatch(importAppState(result.data));
  }

  return { instance, getState };
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

  console.log("isEdited:", isEdited);
  console.log("store v appcomponente: ", appstore.getState());

  useEffect(() => {
    const unsubscribe = appstore.subscribe(() => {
      onStateChange();
    });

    return () => unsubscribe();
  }, [appstore, onStateChange]);

  return (
    <Provider store={appstore}>
      <LogicContext.Provider value={context}>
        <App viewMode={!isEdited} />
      </LogicContext.Provider>
    </Provider>
  );
}

export default { prepare, AppComponent };
