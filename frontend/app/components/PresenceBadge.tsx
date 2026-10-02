interface PresenceBadgeProps {
  status?: string | null;
  /** Diameter in px. The profile header uses 28; scale down for smaller avatars. */
  size?: number;
  title?: string;
}

/**
 * Online indicator shown at the bottom-right of an avatar: a coloured circle with a person icon
 * (green = in game, blue = online). Render it inside a `relative` wrapper around the avatar.
 * Returns nothing for offline/unknown status.
 */
export default function PresenceBadge({ status, size = 28, title }: PresenceBadgeProps) {
  if (!status || status === "offline") return null;
  const color = status === "in-game" ? "bg-green-500" : status === "online" ? "bg-blue-500" : "bg-gray-400";
  const offset = `${-size / 8}px`;
  const icon = Math.round(size * 0.57);

  return (
    <div
      className={`absolute ${color} rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900`}
      style={{ width: size, height: size, bottom: offset, right: offset }}
      title={title}
    >
      <svg className="text-white" style={{ width: icon, height: icon }} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}
