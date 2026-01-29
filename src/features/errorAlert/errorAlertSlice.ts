import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ErrorKind = "workbookImportFailed" | "localImportFailed";

export interface ErrorState {
  errorKind: ErrorKind | null;
}

const initialState: ErrorState = {
  errorKind: null,
};

const errorAlertSlice = createSlice({
  name: "errorAlert",
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<ErrorKind>) => {
      state.errorKind = action.payload;
    },

    clearError: (state) => {
      state.errorKind = null;
    },
  },
});

export default errorAlertSlice.reducer;

export const { setError, clearError } = errorAlertSlice.actions;
