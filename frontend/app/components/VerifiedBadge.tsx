"use client";
interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
export default function VerifiedBadge({
  size = "md",
  className = "",
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  return (
    <svg
      className={`${sizeClasses[size]} inline-block flex-shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Verified"
    >
      <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
      <path
        d="M6.5 12.5l3.5 3.5 7.5-8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
