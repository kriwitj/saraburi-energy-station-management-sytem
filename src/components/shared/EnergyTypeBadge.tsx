import { ENERGY_TYPE_CONFIG, type EnergyTypeKey } from "@/lib/constants";

interface EnergyTypeBadgeProps {
  type: string;
  size?: "sm" | "md";
}

export default function EnergyTypeBadge({ type, size = "sm" }: EnergyTypeBadgeProps) {
  const config = ENERGY_TYPE_CONFIG[type as EnergyTypeKey];

  const sizeClass = size === "md" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-[10px]";
  const color = config?.mapColor ?? "#10b981";
  const icon = config?.icon ?? "⚡";
  const label = config?.label ?? type;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass}`}
      style={{
        background: `${color}1a`,
        color: color,
        border: `1px solid ${color}33`,
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

interface EnergyTypeBadgeListProps {
  types: string[];
  size?: "sm" | "md";
}

export function EnergyTypeBadgeList({ types, size = "sm" }: EnergyTypeBadgeListProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => (
        <EnergyTypeBadge key={type} type={type} size={size} />
      ))}
    </div>
  );
}
