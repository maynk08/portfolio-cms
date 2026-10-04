'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';

type TruncatedTextProps = {
  text: string;
  className?: string;
};

// Long values end in an ellipsis; the full text is in a tooltip that also opens on keyboard focus.
export function TruncatedText({ text, className }: TruncatedTextProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Focusable so keyboard users can read the full value too. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the tooltip is the only way to read the cut-off text */}
        <span tabIndex={0} className={cn('block max-w-full truncate', className)}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm break-words">{text}</TooltipContent>
    </Tooltip>
  );
}
