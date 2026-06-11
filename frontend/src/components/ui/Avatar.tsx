import { useMemo } from "react";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const gradients = [
  "from-kairos-500 to-kairos-700",
  "from-amber-400 to-amber-600",
  "from-teal-400 to-teal-600",
  "from-coral-400 to-coral-600",
  "from-violet-500 to-violet-700",
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-rose-400 to-rose-600",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function Avatar({
  src,
  name = "",
  size = "md",
  className = "",
}: {
  src?: string;
  name?: string;
  size?: Size;
  className?: string;
}) {
  const initials = useMemo(() => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const gradient = useMemo(() => gradients[hashName(name) % gradients.length], [name]);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full border-2 border-white shadow-sm object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-semibold border-2 border-white shadow-sm shrink-0 ${className}`}
    >
      {initials || "?"}
    </div>
  );
}

export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
}: {
  users: { name: string; avatar_url?: string }[];
  max?: number;
  size?: Size;
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div key={i} style={{ zIndex: max - i, marginLeft: i > 0 ? -8 : 0 }}>
          <Avatar src={user.avatar_url} name={user.name} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{ zIndex: 0, marginLeft: -8 }}
          className={`${sizes[size]} rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white shrink-0`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
