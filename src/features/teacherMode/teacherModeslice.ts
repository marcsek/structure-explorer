import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { SerializedTeacherModeState } from "./validationSchema";

export interface TeacherModeState {
  teacherMode: boolean | undefined;
}

export const initialTeacherModeState: TeacherModeState = {
  teacherMode: false,
};

export const teacherModeSlice = createSlice({
  name: "teacherMode",
  initialState: initialTeacherModeState,
  reducers: {
    importTeacherMode: (
      _state,
      action: PayloadAction<SerializedTeacherModeState>,
    ) => {
      return action.payload;
    },

    updateTeacherMode: (state, action: PayloadAction<boolean | undefined>) => {
      state.teacherMode = action.payload;
    },
  },
});

export const { updateTeacherMode, importTeacherMode } =
  teacherModeSlice.actions;

export const selectTeacherMode = (state: RootState) =>
  state.present.teacherMode.teacherMode;

export default teacherModeSlice.reducer;
