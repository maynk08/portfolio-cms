'use server';

import { deleteResource, quoteLabel, saveResource, setResourceFlag } from '@/lib/actions/resource-actions';

import { CERTIFICATIONS_PATH, certificationFormSchema } from './schemas';

import type { ActionResult } from '@/lib/actions/action-result';

const describe = (input: { name: string }): string => `Certification "${input.name}"`;

export async function createCertification(values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: CERTIFICATIONS_PATH, schema: certificationFormSchema, values, describe });
}

export async function updateCertification(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return saveResource({ path: CERTIFICATIONS_PATH, id, schema: certificationFormSchema, values, describe });
}

export async function deleteCertification(id: unknown, label: unknown): Promise<ActionResult> {
  return deleteResource(CERTIFICATIONS_PATH, id, `Certification ${quoteLabel(label)}`);
}

export async function setCertificationVisibility(id: unknown, isVisible: unknown, label: unknown): Promise<ActionResult> {
  return setResourceFlag(
    CERTIFICATIONS_PATH,
    id,
    'isVisible',
    isVisible,
    `Certification ${quoteLabel(label)} ${isVisible === true ? 'shown on' : 'hidden from'} the portfolio`,
  );
}
