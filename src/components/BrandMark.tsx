import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  asHeading?: boolean;
};

const SIZES = {
  sm: 28,
  md: 36,
  lg: 44,
} as const;

export default function BrandMark({
  href = "/",
  size = "md",
  label,
  showLabel = false,
  asHeading = false,
}: BrandMarkProps) {
  const px = SIZES[size];

  const labelEl =
    showLabel && label ? (
      asHeading ? (
        <h1 className="brand-mark__label">{label}</h1>
      ) : (
        <span className="brand-mark__label">{label}</span>
      )
    ) : null;

  const mark = (
    <span className={`brand-mark brand-mark--${size}`}>
      <Image
        src="/logo.png"
        alt=""
        width={px}
        height={px}
        className="brand-mark__icon"
        priority
      />
      {labelEl}
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link
      href={href}
      className="brand-mark-link"
      aria-label={showLabel && label ? undefined : (label ?? "Home")}
    >
      {mark}
    </Link>
  );
}
