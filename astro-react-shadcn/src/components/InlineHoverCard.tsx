import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InlineHoverCardProps {
  trigger: string;
  title: string;
  description: string;
}

export default function InlineHoverCard({
  trigger,
  title,
  description,
}: InlineHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a
          href="#"
          className="font-medium text-foreground underline decoration-dotted underline-offset-4"
        >
          {trigger}
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
