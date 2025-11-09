import type { ReactElement, SVGProps } from "react";
import { cloneElement } from "react";

export interface CustomIconProps extends SVGProps<SVGSVGElement> {
  size?: SVGProps<SVGSVGElement>["height"];
}

export function ForwardSlashIcon(props: CustomIconProps) {
  return (
    <CustomIconWrapper {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="6" y1="23" x2="18" y2="1" />
      </svg>
    </CustomIconWrapper>
  );
}

interface CustomIconWrapperProps extends CustomIconProps {
  children: ReactElement<SVGProps<SVGSVGElement>>;
}

function CustomIconWrapper({
  children,
  size,
  ...props
}: CustomIconWrapperProps) {
  return cloneElement(children, {
    width: size ?? props.width,
    height: size ?? props.height,
    ...props,
  });
}
