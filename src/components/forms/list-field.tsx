'use client';

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useRef, useState } from 'react';
import { get, useController, useFormState } from 'react-hook-form';

import { fieldId } from '@/components/forms/field-props';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { FormFieldProps } from '@/components/forms/field-props';
import type { FieldValues } from 'react-hook-form';

type ListFieldProps<T extends FieldValues, TTransformed extends FieldValues = T> = FormFieldProps<T, TTransformed> & {
  // Names one entry: "highlight" gives "Highlight 2", "Add highlight", "Move highlight 2 up".
  itemNoun: string;
  maxItems: number;
  isMultiline?: boolean;
};

function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

let nextKey = 0;
function createKey(): number {
  nextKey += 1;
  return nextKey;
}

// An ordered list of text lines (highlights, hero phrases): add, edit, remove and move entries up or down.
export function ListField<T extends FieldValues, TTransformed extends FieldValues = T>({
  control,
  name,
  label,
  description,
  isRequired,
  itemNoun,
  maxItems,
  isMultiline = false,
}: ListFieldProps<T, TTransformed>) {
  const {
    field: { ref, value: fieldValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const { errors } = useFormState({ control, name });
  const id = fieldId(name);
  const items = (fieldValue as string[] | undefined) ?? [];
  const inputRefs = useRef(new Map<number, HTMLInputElement | HTMLTextAreaElement>());
  const focusKeyAfterRender = useRef<number | null>(null);

  // Stable keys per entry, so moving an entry keeps its input (and focus) instead of re-creating it.
  const [keys, setKeys] = useState<number[]>(() => items.map(createKey));
  if (keys.length !== items.length) {
    // The list was replaced from outside (for example a form reset): start over with fresh keys.
    setKeys(items.map(createKey));
  }

  const update = (nextItems: string[], nextKeys: number[]): void => {
    setKeys(nextKeys);
    onChange(nextItems);
  };

  const move = (index: number, offset: -1 | 1): void => {
    const target = index + offset;
    const nextItems = [...items];
    const nextKeys = [...keys];
    [nextItems[index], nextItems[target]] = [nextItems[target] ?? '', nextItems[index] ?? ''];
    [nextKeys[index], nextKeys[target]] = [nextKeys[target] ?? createKey(), nextKeys[index] ?? createKey()];
    update(nextItems, nextKeys);
  };

  const listError = fieldState.error?.message;
  const noun = capitalize(itemNoun);
  const InputComponent = isMultiline ? Textarea : Input;

  return (
    <FieldSet aria-describedby={description === undefined ? undefined : `${id}-description`}>
      <FieldLegend variant="label">
        {label}
        {isRequired === true && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLegend>
      {description !== undefined && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}

      <ol className="flex flex-col gap-2">
        {items.map((item, index) => {
          const key = keys[index] ?? index;
          const itemId = `${id}-${index}`;
          const itemError = get(errors, `${name}.${index}.message`) as string | undefined;
          return (
            <li key={key}>
              <Field data-invalid={itemError !== undefined}>
                <div className="flex items-start gap-1">
                  <InputComponent
                    id={itemId}
                    ref={(element: HTMLInputElement | HTMLTextAreaElement | null) => {
                      if (index === 0) {
                        ref(element);
                      }
                      if (element === null) {
                        inputRefs.current.delete(key);
                        return;
                      }
                      inputRefs.current.set(key, element);
                      if (focusKeyAfterRender.current === key) {
                        focusKeyAfterRender.current = null;
                        element.focus();
                      }
                    }}
                    value={item}
                    aria-label={`${noun} ${index + 1}`}
                    aria-invalid={itemError !== undefined}
                    aria-describedby={itemError === undefined ? undefined : `${itemId}-error`}
                    onChange={(event) => {
                      onChange(items.map((existing, itemIndex) => (itemIndex === index ? event.target.value : existing)));
                    }}
                    onBlur={onBlur}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${itemNoun} ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => {
                      move(index, -1);
                    }}
                  >
                    <ArrowUpIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${itemNoun} ${index + 1} down`}
                    disabled={index === items.length - 1}
                    onClick={() => {
                      move(index, 1);
                    }}
                  >
                    <ArrowDownIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${itemNoun} ${index + 1}`}
                    onClick={() => {
                      update(
                        items.filter((_item, itemIndex) => itemIndex !== index),
                        keys.filter((_key, keyIndex) => keyIndex !== index),
                      );
                    }}
                  >
                    <Trash2Icon aria-hidden />
                  </Button>
                </div>
                {itemError !== undefined && <FieldError id={`${itemId}-error`}>{itemError}</FieldError>}
              </Field>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={items.length >= maxItems}
          onClick={() => {
            const key = createKey();
            focusKeyAfterRender.current = key;
            update([...items, ''], [...keys, key]);
          }}
        >
          <PlusIcon aria-hidden />
          Add {itemNoun}
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {items.length} of {maxItems}
        </span>
      </div>
      {listError !== undefined && <FieldError>{listError}</FieldError>}
    </FieldSet>
  );
}
