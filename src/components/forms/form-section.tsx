import { useId } from 'react';

import type { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

// Groups related fields of a long form under a real heading, so the form reads (and navigates) as a few short parts.
export function FormSection({ title, description, children }: FormSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5 border-t pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-lg font-semibold">
          {title}
        </h2>
        {description !== undefined && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
