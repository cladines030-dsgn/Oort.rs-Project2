import { ReactNode } from "react";

interface GridContainerProps {
  children: ReactNode;
}

export function GridContainer({ children }: GridContainerProps) {
  // Grid system: 6 columns, width=180, gutter=20
  // Total width: (180 * 6) + (20 * 5) = 1180px
  return (
    <div className="mx-auto px-5" style={{ maxWidth: "1180px" }}>
      {children}
    </div>
  );
}
