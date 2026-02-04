/* eslint-disable @typescript-eslint/no-explicit-any */

import App from "./App";
import { createStore, type AppStore, type RootState } from "./app/store";
import { Provider } from "react-redux";
import {
  getAppStateToExport,
  importAppState,
} from "./features/import/importThunk";
import { type CellContext, LogicContext } from "./logicContext";
import { useEffect, useRef } from "react";
import { parseSerializedAppStateWithDefaults } from "./features/import/validationSchema";
import { generateInstanceId, InstanceIdContext } from "./instanceIdContext";
import { setError } from "./features/errorAlert/errorAlertSlice";
import { isAction, isAnyOf, type Middleware } from "@reduxjs/toolkit";
import { editorToolbarSlice } from "./features/editorToolbar/editorToolbarSlice";
import { graphManagerSlice } from "./features/graphView/graphs/graphSlice";
import { UndoActions } from "./features/undoHistory/undoHistory";
import { listenerShouldIgnore } from "./common/redux";

interface PrepareResult {
  instance: any;
  getState: (instance: any) => any;
}

const actionsToFilter = [
  editorToolbarSlice.actions.predicateHovered,
  editorToolbarSlice.actions.unaryFilterDomainHovered,
  graphManagerSlice.actions.graphDidInitialLayout,
  graphManagerSlice.actions.warningChanged,
  graphManagerSlice.actions.editorLocked,
  UndoActions.checkpoint,
];

function filterAction(action: unknown) {
  if (typeof action === "function") return false;
  if (isAnyOf(...actionsToFilter)(action)) return false;
  if (isAction(action) && listenerShouldIgnore(action)) return false;

  return true;
}

export function prepare(initialState?: any): PrepareResult {
  const storeListener: Middleware<object, RootState> =
    () => (next) => (action) => {
      if (instance?.handleStoreChange && filterAction(action))
        instance.handleStoreChange();

      return next(action);
    };

  const store = createStore(storeListener);
  const instance: {
    store: AppStore;
    handleStoreChange: (() => void) | undefined;
  } = { store, handleStoreChange: undefined };

  const getState = (instance: any) => {
    const storeState = instance.store.getState();
    return getAppStateToExport(storeState);
  };

  if (initialState !== null) {
    const result = parseSerializedAppStateWithDefaults(initialState);

    if (result.errors.length !== 0) {
      console.error(result.errors);
      store.dispatch(setError("workbookImportFailed"));
    }

    store.dispatch(importAppState(result.data));
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

  // Since some components need to have a unique id across the whole document
  // we need a way do disntiguish between identical instances.
  // (e.g copied instances inside workbook)
  const instanceIdRef = useRef<string>(generateInstanceId());

  useEffect(() => {
    instance.handleStoreChange = onStateChange;
    return () => (instance.handleStoreChange = undefined);
  }, [instance, onStateChange]);

  return (
    <Provider store={appstore}>
      <InstanceIdContext.Provider value={instanceIdRef.current}>
        <LogicContext.Provider value={context}>
          <App viewMode={!isEdited} />
        </LogicContext.Provider>
      </InstanceIdContext.Provider>
    </Provider>
  );
}

export default { prepare, AppComponent };
