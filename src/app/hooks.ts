import {
  shallowEqual,
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from "react-redux";
import type { AppDispatch, AppStore, RootState } from "./store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = () => useStore() as AppStore;

export const useShallowAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected,
): TSelected => useSelector(selector, shallowEqual);
