'use client';

import { FolderGit2Icon, PlusIcon } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { InstantSwitch } from '@/components/data-table/instant-switch';
import { ItemRowActions } from '@/components/data-table/item-row-actions';
import { useOptimisticOrder } from '@/components/data-table/use-optimistic-order';
import { VisibilityToggle } from '@/components/data-table/visibility-toggle';
import { EmptyState } from '@/components/feedback/empty-state';
import { GuardedLink } from '@/components/navigation/guarded-link';
import { Button } from '@/components/ui/button';
import { deleteProject, reorderProjects, setProjectFeatured, setProjectVisibility } from '@/features/projects/actions';

import type { DataTableColumn } from '@/components/data-table/data-table';
import type { Project } from '@/features/projects/schemas';

export function ProjectTable({ projects }: { projects: Project[] }) {
  const { orderedRows, move } = useOptimisticOrder(projects, (project) => project.id, reorderProjects);

  const columns: DataTableColumn<Project>[] = [
    { id: 'position', header: 'Position', align: 'end', className: 'w-20', cell: (project) => orderedRows.indexOf(project) + 1 },
    {
      id: 'title',
      header: 'Project',
      cell: (project) => (
        <span className="flex flex-col">
          <span className="font-medium">{project.title}</span>
          <span className="font-mono text-xs text-muted-foreground">/projects/{project.slug}</span>
        </span>
      ),
    },
    {
      id: 'featured',
      header: 'Featured',
      cell: (project) => (
        <InstantSwitch
          checked={project.isFeatured}
          label={`Feature "${project.title}" on the home page`}
          onChange={(isFeatured) => setProjectFeatured(project.id, isFeatured, project.title)}
        />
      ),
    },
    {
      id: 'visible',
      header: 'Visible',
      cell: (project) => (
        <VisibilityToggle
          isVisible={project.isVisible}
          itemLabel={project.title}
          onChange={(isVisible) => setProjectVisibility(project.id, isVisible, project.title)}
        />
      ),
    },
  ];

  return (
    <DataTable
      caption="Projects, in display order"
      columns={columns}
      rows={orderedRows}
      getRowId={(project) => project.id}
      getRowLabel={(project) => project.title}
      emptyState={
        <EmptyState
          icon={FolderGit2Icon}
          title="No projects yet"
          description="Projects you add appear here and on the portfolio’s Projects page; featured ones also show on the home page."
          action={
            <Button asChild>
              <GuardedLink href="/projects/new">
                <PlusIcon aria-hidden />
                Add project
              </GuardedLink>
            </Button>
          }
        />
      }
      rowActions={(project) => {
        const index = orderedRows.indexOf(project);
        return (
          <ItemRowActions
            itemNoun="project"
            itemLabel={project.title}
            editHref={`/projects/${project.id}`}
            onDelete={() => deleteProject(project.id, project.title)}
            reorder={{
              isFirst: index === 0,
              isLast: index === orderedRows.length - 1,
              onMove: (offset) => {
                move(index, offset);
              },
            }}
          />
        );
      }}
    />
  );
}
