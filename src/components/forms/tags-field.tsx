'use client';

import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { get, useController, useFormState } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type TagsFieldProps<T extends FieldValues, TTransformed extends FieldValues = T> = FormFieldProps<T, TTransformed> & {
  maxItems: number;
  placeholder?: string;
};

const ADD_KEYS = new Set(['Enter', ',']);

// Short values such as a tech stack: type one and press Enter (or a comma) to add it; duplicates are ignored.
export function TagsField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  isRequired,
  maxItems,
  placeholder,
}: TagsFieldProps<T, TTransformed>) {
  const {
    field: { ref, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const { errors } = useFormState({ control, name });
  const [draft, setDraft] = useState('');
  const id = fieldId(name);
  const tags = (fieldValue as string[] | undefined) ?? [];
  const isFull = tags.length >= maxItems;

  // The list's own error, or the first error of one of its items.
  const itemErrors = (get(errors, name) as unknown[] | undefined) ?? [];
  const firstItemError = Array.isArray(itemErrors) ? itemErrors.find((item) => item !== undefined) : undefined;
  const error = fieldState.error?.message ?? (get(firstItemError, 'message') as string | undefined);
  const hint = `${tags.length} of ${maxItems}. Press Enter to add.`;

  const addDraft = (): void => {
    const tag = draft.trim();
    setDraft('');
    if (tag === '' || isFull || tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      return;
    }
    onChange([...tags, tag]);
  };

  const removeTag = (index: number): void => {
    onChange(tags.filter((_tag, tagIndex) => tagIndex !== index));
  };

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error} hint={hint}>
      {tags.length > 0 && (
        <ul aria-label={`${label} (added)`} className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <li key={tag}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={`Remove ${tag}`}
                  onClick={() => {
                    removeTag(index);
                  }}
                >
                  <XIcon aria-hidden className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        ref={ref}
        value={draft}
        disabled={isFull}
        placeholder={isFull ? `Limit of ${maxItems} reached` : placeholder}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (ADD_KEYS.has(event.key)) {
            event.preventDefault();
            addDraft();
          } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
            removeTag(tags.length - 1);
          }
        }}
        onBlur={() => {
          addDraft();
          onBlur();
        }}
        aria-invalid={error !== undefined}
        aria-required={isRequired}
        aria-describedby={describedByIds(id, { description, error, hint })}
      />
    </FieldShell>
  );
}
