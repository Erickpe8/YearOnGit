import { brandName } from "@/lib/brand/assets";

const sizeClasses = {
  sm: "text-sm max-[390px]:text-xs",
  md: "text-base md:text-lg",
  lg: "text-2xl md:text-3xl",
} as const;

type BrandWordmarkProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function BrandWordmark({ size = "md", className = "" }: BrandWordmarkProps) {
  return (
    <span
      className={`font-display font-extrabold tracking-tighter text-on-surface ${sizeClasses[size]} ${className}`}
    >
      Year<span className="text-primary">On</span>Git
    </span>
  );
}

export { brandName };
