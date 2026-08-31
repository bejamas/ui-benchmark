import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeatureTooltipProps {
  text: string;
}

export default function FeatureTooltip({ text }: FeatureTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`More information: ${text}`}
            className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted text-xs text-muted-foreground"
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
