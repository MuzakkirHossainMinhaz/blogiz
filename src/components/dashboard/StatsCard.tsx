import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  icon: IconType;
  variant?: "default" | "primary" | "accent" | "success" | "warning" | "error";
  className?: string;
}

const StatsCard = ({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
  className,
}: StatsCardProps) => {
  const variants = {
    default: "bg-white border-neutral-200",
    primary: "bg-primary-50 border-primary-200",
    accent: "bg-accent-50 border-accent-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
  };

  const iconVariants = {
    default: "text-neutral-600",
    primary: "text-primary-600",
    accent: "text-accent-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  const changeVariants = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-neutral-600",
  };

  return (
    <div className={cn(
      "p-6 rounded-lg border shadow-sm card-hover",
      variants[variant],
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-sm font-medium",
                changeVariants[change.type]
              )}>
                {change.value}
              </span>
              <span className="text-sm text-neutral-500 ml-1">from last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg bg-white",
          iconVariants[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
