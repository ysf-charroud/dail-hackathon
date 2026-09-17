import { STATUS_LABELS, type ReviewStatus } from "@/lib/types";
import { Badge } from "./ui/badge";

const VARIANTS: Record<
  ReviewStatus,
  "secondary" | "destructive" | "outline" | "default"
> = {
  analysis_required: "secondary",
  missing_evidence: "destructive",
  needs_clarification: "outline",
  review_ready: "default",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant={VARIANTS[status]}>
      <span
        aria-hidden
        className={
          status === "needs_clarification"
            ? "size-1.5 rounded-full bg-amber-500"
            : "size-1.5 rounded-full bg-current"
        }
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
