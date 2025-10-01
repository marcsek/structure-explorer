import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

export interface TeacherModeState {
  teacherMode: boolean | undefined;
}

const initialState: TeacherModeState = {
  teacherMode: false,
};

export const teacherModeSlice = createSlice({
  name: "teacherMode",
  initialState,
  reducers: {
    importTeacherMode: (_state, action: PayloadAction<string>) => {
      return JSON.parse(action.payload);
    },

    updateTeacherMode: (state, action: PayloadAction<boolean | undefined>) => {
      state.teacherMode = action.payload;
    },
  },
});

export const { updateTeacherMode, importTeacherMode } =
  teacherModeSlice.actions;

export const selectTeacherMode = (state: RootState) =>
  state.teacherMode.teacherMode;

export default teacherModeSlice.reducer;
