interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export function Skeleton({ width = "100%", height = "16px", rounded = "md", className = "" }: SkeletonProps) {
  const radiusMap: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  return (
    <div
      className={`animate-shimmer ${radiusMap[rounded] || "rounded-md"} ${className}`}
      style={{ width, height }}
    />
  );
}
