import { Globe2, Sprout, Target, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";

/**
 * Required design choice: project purpose and target group sit directly next
 * to the evidence review. Schmitz-Stiftungen funds target-group-oriented,
 * locally developed projects — caseworkers need the human and project
 * context while checking evidence, not documents in isolation.
 */
export function ProjectContext({
  theme,
  country,
  purpose,
  targetGroup,
}: {
  theme?: string;
  country?: string;
  purpose?: string;
  targetGroup?: string;
}) {
  if (!theme && !country && !purpose && !targetGroup) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project context</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {purpose ? (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Sprout className="size-3.5" aria-hidden /> Project purpose
            </p>
            <p className="mt-0.5">{purpose}</p>
          </div>
        ) : null}
        {targetGroup ? (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="size-3.5" aria-hidden /> Target group
            </p>
            <p className="mt-0.5">{targetGroup}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {theme ? (
            <span className="flex items-center gap-1.5">
              <Target className="size-3.5" aria-hidden /> {theme}
            </span>
          ) : null}
          {country ? (
            <span className="flex items-center gap-1.5">
              <Globe2 className="size-3.5" aria-hidden /> {country}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
