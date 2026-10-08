'use client';

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { get, useFieldArray, useFormState } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FieldDescription, FieldError } from '@/components/ui/field';

import type { ReactNode } from 'react';
import type { ArrayPath, Control, FieldArray, FieldValues } from 'react-hook-form';

type FieldArrayGroupProps<T extends FieldValues, TName extends ArrayPath<T>, TTransformed extends FieldValues = T> = {
  control: Control<T, unknown, TTransformed>;
  name: TName;
  label: string;
  description?: string;
  // Names one entry: "social link" gives "Social link 2", "Add social link", "Move social link 2 up".
  itemNoun: string;
  maxItems: number;
  createItem: () => FieldArray<T, TName>;
  // The fields of the entry at `index`.
  renderItem: (index: number) => ReactNode;
};

function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

// An ordered list of small groups of fields (social links, languages): add, remove, and move entries up or down.
export function FieldArrayGroup<T extends FieldValues, TName extends ArrayPath<T>, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  itemNoun,
  maxItems,
  createItem,
  renderItem,
}: FieldArrayGroupProps<T, TName, TTransformed>) {
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const { errors } = useFormState({ control });
  const listError = (get(errors, `${name}.root.message`) ?? get(errors, `${name}.message`)) as string | undefined;
  const noun = capitalize(itemNoun);

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{label}</h3>
        {description !== undefined && <FieldDescription>{description}</FieldDescription>}
      </div>

      {fields.length > 0 && (
        <ol className="flex flex-col gap-3">
          {fields.map((item, index) => (
            <li key={item.id} aria-label={`${noun} ${index + 1}`} className="flex flex-col gap-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {noun} {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move ${itemNoun} ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => {
                      move(index, index - 1);
                    }}
                  >
                    <ArrowUpIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move ${itemNoun} ${index + 1} down`}
                    disabled={index === fields.length - 1}
                    onClick={() => {
                      move(index, index + 1);
                    }}
                  >
                    <ArrowDownIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${itemNoun} ${index + 1}`}
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    <Trash2Icon aria-hidden />
                  </Button>
                </div>
              </div>
              {renderItem(index)}
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= maxItems}
          // Keeps focus (and so blur validation) where it is until the click lands: an error appearing on blur
          // would otherwise push this button down between mousedown and mouseup and swallow the click.
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            append(createItem());
          }}
        >
          <PlusIcon aria-hidden />
          Add {itemNoun}
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {fields.length} of {maxItems}
        </span>
      </div>
      {listError !== undefined && <FieldError>{listError}</FieldError>}
    </div>
  );
}
