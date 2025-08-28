// components/trust-bar.tsx
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Item = {
  label: string;
  hint?: string;
  dotClass: string; // e.g. "bg-emerald-400"
};

const items: Item[] = [
  {
    label: "Built in the UK",
    hint: "Designed and developed in the United Kingdom with higher education in mind.",
    dotClass: "bg-emerald-400",
  },
  {
    label: "Privacy-first",
    hint: "We only collect the minimum data required and never sell or share it.",
    dotClass: "bg-sky-400",
  },
  {
    label: "No spreadsheets",
    hint: "Move away from fragile Excel workflows with a platform made for workload planning.",
    dotClass: "bg-fuchsia-400",
  },
];

export default function TrustBar() {
  return (
    <TooltipProvider>
      <div className="mx-auto mt-6 flex w-full max-w-3xl items-center justify-center gap-4 px-4 relative z-20">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            {/* coloured dot */}
            <span
              className={`h-2.5 w-2.5 rounded-full ${item.dotClass} ring-2 ring-white/10`}
              aria-hidden="true"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="border-white/10 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/15 relative z-10"
                >
                  {item.label}
                </Badge>
              </TooltipTrigger>
              {item.hint ? (
                <TooltipContent
                  sideOffset={6}
                  className="max-w-xs rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/90 shadow-lg backdrop-blur-sm"
                >
                  {item.hint}
                </TooltipContent>
              ) : null}
            </Tooltip>
            {/* separator dot */}
            {i !== items.length - 1 ? (
              <span
                className="mx-1 h-1 w-1 rounded-full bg-white/30"
                aria-hidden="true"
              />
            ) : null}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
