"use client";

import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProFeatureTooltipProps {
  isEnabled: boolean;
  children: ReactNode;
  message?: string;
}

const DEFAULT_PRO_MESSAGE = "This feature is available on Pro and Enterprise plans. Upgrade to unlock it.";

export function ProFeatureTooltip({
  isEnabled,
  children,
  message = DEFAULT_PRO_MESSAGE,
}: ProFeatureTooltipProps) {
  if (isEnabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
