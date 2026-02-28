import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export function Container({ children, className, size = "lg" }: ContainerProps) {
  const sizes = {
    sm: "max-w-4xl",
    md: "max-w-6xl",
    lg: "max-w-7xl",
    full: "max-w-full",
  };

  return <div className={cn("w-full mx-auto px-4 sm:px-6 lg:px-8", sizes[size], className)}>{children}</div>;
}
