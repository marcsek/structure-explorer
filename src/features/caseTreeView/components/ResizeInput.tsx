import "./ResizeInput.css";

import { useLayoutEffect, useRef } from "react";
import { FormControl, type FormControlProps } from "react-bootstrap";

const INPUT_END_BUFFER = 6;

export default function ResizeInput(inputProps: FormControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dummyRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!inputRef.current || !dummyRef.current) return;
    inputRef.current.style.width = `${dummyRef.current.offsetWidth + INPUT_END_BUFFER}px`;
  }, [inputProps.value]);

  return (
    <div className="resize-input-wrapper">
      <span ref={dummyRef} className="resize-input-dummy">
        {inputProps.value}
      </span>

      <FormControl {...inputProps} ref={inputRef} />
    </div>
  );
}
