export function Badge({
  label,
  color,
  soft = true,
}: {
  label: string;
  color: string;
  soft?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={
        soft
          ? { color, background: `${color}1f`, border: `1px solid ${color}33` }
          : { color: "#fff", background: color }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
