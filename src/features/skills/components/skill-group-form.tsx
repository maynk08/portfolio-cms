'use client';

import { useRouter } from 'next/navigation';

import { ActionForm } from '@/components/forms/action-form';
import { FieldArrayGroup } from '@/components/forms/field-array-group';
import { FormSection } from '@/components/forms/form-section';
import { SwitchField } from '@/components/forms/switch-field';
import { TextField } from '@/components/forms/text-field';
import { useActionForm } from '@/components/forms/use-action-form';
import { createSkillGroup, updateSkillGroup } from '@/features/skills/actions';
import { MAX_SKILLS_PER_GROUP, SIMPLE_ICONS_URL, emptySkill, skillGroupFormSchema } from '@/features/skills/schemas';

import type { SkillGroupFormValues } from '@/features/skills/schemas';

const LIST_HREF = '/skills';

type SkillGroupFormProps = {
  // Absent when creating.
  id?: string;
  initialValues: SkillGroupFormValues;
};

export function SkillGroupForm({ id, initialValues }: SkillGroupFormProps) {
  const router = useRouter();
  const actionForm = useActionForm({
    schema: skillGroupFormSchema,
    defaultValues: initialValues,
    action: (values) => (id === undefined ? createSkillGroup(values) : updateSkillGroup(id, values)),
    onSuccess: () => {
      if (id === undefined) {
        router.push(LIST_HREF);
      }
    },
  });
  const { control } = actionForm.form;

  return (
    <ActionForm
      actionForm={actionForm}
      secondaryAction={{ type: 'cancel', href: LIST_HREF }}
      submitLabel={id === undefined ? 'Create skill group' : 'Save skill group'}
    >
      <FormSection title="Group">
        <TextField control={control} name="name" label="Name" placeholder="Backend" isRequired />
        <SwitchField control={control} name="isVisible" label="Show this group on the portfolio" />
      </FormSection>
      <FormSection title="Skills" description="Shown in this order. Names only; there are no skill levels.">
        <p className="text-sm text-muted-foreground">
          Icons use{' '}
          <a href={SIMPLE_ICONS_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Simple Icons<span className="sr-only"> (opens in a new tab)</span>
          </a>
          : search for the technology and copy its slug, such as <code className="font-mono">nodedotjs</code>.
        </p>
        <FieldArrayGroup
          control={control}
          name="skills"
          label="Skills in this group"
          itemNoun="skill"
          maxItems={MAX_SKILLS_PER_GROUP}
          createItem={emptySkill}
          renderItem={(index) => (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <TextField control={control} name={`skills.${index}.name`} label="Name" isRequired />
              <TextField control={control} name={`skills.${index}.icon`} label="Icon slug" placeholder="nodedotjs" />
              <SwitchField control={control} name={`skills.${index}.isVisible`} label={`Show skill ${index + 1}`} />
            </div>
          )}
        />
      </FormSection>
    </ActionForm>
  );
}
