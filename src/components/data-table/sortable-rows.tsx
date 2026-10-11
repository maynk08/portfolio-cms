'use client';

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon } from 'lucide-react';
import { useId } from 'react';

import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';

import type { Announcements, DragEndEvent, Modifier, UniqueIdentifier } from '@dnd-kit/core';
import type { ReactNode } from 'react';

// A small movement before a drag starts, so clicks and taps on the handle are never taken for drags.
const DRAG_START_DISTANCE_PX = 4;

const SCREEN_READER_INSTRUCTIONS =
  'To change the order, press Space or Enter to pick up the row, use the up and down arrow keys to move it, then press Space or Enter to drop it. Press Escape to cancel.';

// Rows only move up and down.
const onlyVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });

type SortableRowsProps = {
  // Every row id in display order, locked rows included.
  rowIds: string[];
  // The rows that can be dragged; locked rows (such as the hero) stay where they are.
  movableIds: string[];
  getLabel: (id: string) => string;
  onMoveTo: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
};

/**
 * Drag-and-drop ordering for table rows, by pointer, touch or keyboard, with plain-language updates for screen
 * readers ("Projects moved to position 2 of 8").
 */
export function SortableRows({ rowIds, movableIds, getLabel, onMoveTo, children }: SortableRowsProps) {
  // A stable id keeps the server and browser markup the same.
  const contextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_START_DISTANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const position = (id: UniqueIdentifier): number => rowIds.indexOf(String(id)) + 1;
  const total = rowIds.length;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${getLabel(String(active.id))}. Position ${position(active.id)} of ${total}.`,
    onDragOver: ({ active, over }) =>
      over === null
        ? `${getLabel(String(active.id))} is no longer over a position.`
        : `${getLabel(String(active.id))} is at position ${position(over.id)} of ${total}.`,
    onDragEnd: ({ active, over }) =>
      over === null
        ? `${getLabel(String(active.id))} was dropped and stays at position ${position(active.id)}.`
        : `${getLabel(String(active.id))} moved to position ${position(over.id)} of ${total}.`,
    onDragCancel: ({ active }) => `Moving cancelled. ${getLabel(String(active.id))} stays at position ${position(active.id)}.`,
  };

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (over === null || active.id === over.id) {
      return;
    }
    onMoveTo(rowIds.indexOf(String(active.id)), rowIds.indexOf(String(over.id)));
  };

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[onlyVertical]}
      accessibility={{ announcements, screenReaderInstructions: { draggable: SCREEN_READER_INSTRUCTIONS } }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={movableIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

type SortableTableRowProps = {
  id: string;
  label: string;
  isSelected: boolean;
  children: ReactNode;
};

// A row that can be dragged by its handle in the first cell.
export function SortableTableRow({ id, label, isSelected, children }: SortableTableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <TableRow
      ref={setNodeRef}
      data-state={isSelected ? 'selected' : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 bg-background shadow-md')}
    >
      <TableCell className="w-10">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder "${label}"`}
          className="inline-flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon aria-hidden className="size-4" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

// A row that keeps its place (such as the hero), with an empty handle cell so the columns line up.
export function LockedTableRow({ isSelected, children }: { isSelected: boolean; children: ReactNode }) {
  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell className="w-10" />
      {children}
    </TableRow>
  );
}
