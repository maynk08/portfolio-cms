'use client';

import { useController } from 'react-hook-form';

import { CharacterCount } from '@/components/forms/character-count';
import { fieldId } from '@/components/forms/field-props';
import { FieldShell, describedByIds } from '@/components/forms/field-shell';
import { MarkdownPreview } from '@/components/forms/markdown-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type MarkdownFieldProps<T extends FieldValues> = FormFieldProps<T> & {
  maxLength: number;
  rows?: number;
};

const MARKDOWN_HELP = 'Supports Markdown: **bold**, _italic_, `code`, lists, links and code blocks.';

export function MarkdownField<T extends FieldValues>({
  control,
  name,
  label,
  description = MARKDOWN_HELP,
  isRequired,
  maxLength,
  rows = 10,
}: MarkdownFieldProps<T>) {
  const {
    field: { ref, name: inputName, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const id = fieldId(name);
  const error = fieldState.error?.message;
  const value = (fieldValue as string | null | undefined) ?? '';
  const hint = <CharacterCount length={value.length} maxLength={maxLength} />;

  return (
    <FieldShell id={id} label={label} description={description} isRequired={isRequired} error={error} hint={hint}>
      <Tabs defaultValue="write">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <Textarea
            id={id}
            ref={ref}
            name={inputName}
            rows={rows}
            className="font-mono text-sm"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={error !== undefined}
            aria-required={isRequired}
            aria-describedby={describedByIds(id, { description, error, hint })}
          />
        </TabsContent>
        <TabsContent value="preview" className="min-h-40 rounded-md border px-4 py-3">
          <MarkdownPreview markdown={value} />
        </TabsContent>
      </Tabs>
    </FieldShell>
  );
}
