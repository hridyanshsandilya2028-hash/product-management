import type { HTMLAttributes } from "react";

export function Pill({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`pill ${className}`} {...props} />;
}
