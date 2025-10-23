import { useEffect } from "react";
import { useAppDispatch } from "./app/hooks";
import { updatePredicates } from "./features/language/languageSlice";
import {
  updateDomain,
  updateInterpretationPredicates,
} from "./features/structure/structureSlice";

export default function usePreset() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log(window.location.pathname);
    if (window.location.pathname === "/preset") {
      dispatch(
        updatePredicates(
          "teaches/2, student/1, janitor/1, principal/1, teacher/1",
        ),
      );

      dispatch(updateDomain("A, B, C, D, E"));
      dispatch(
        updateInterpretationPredicates({ key: "student", value: "A, B" }),
      );
      dispatch(
        updateInterpretationPredicates({ key: "janitor", value: "C, D" }),
      );
      dispatch(
        updateInterpretationPredicates({ key: "principal", value: "A, C, E" }),
      );
      dispatch(
        updateInterpretationPredicates({
          key: "teacher",
          value: "A, B, C, D, E",
        }),
      );
    }
  }, [dispatch]);
}
