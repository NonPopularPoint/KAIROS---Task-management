export function CharacterCounter({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const color = pct > 95 ? "text-coral-500" : pct > 80 ? "text-amber-500" : "text-gray-400";

  return (
    <p className={`mt-1 text-xs text-right transition-colors ${color}`}>
      {current} / {max}
    </p>
  );
}
