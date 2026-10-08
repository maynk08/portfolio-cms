type MediaNoteProps = {
  // What each media field holds now, e.g. [{ label: 'Company logo', isSet: true }].
  items: { label: string; isSet: boolean }[];
};

// Stands in for the media picker until the media library exists; saving keeps the current files.
export function MediaNote({ items }: MediaNoteProps) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
        {items.map((item) => (
          <div key={item.label} className="contents">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd>{item.isSet ? 'Set' : 'None yet'}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground">
        Choosing images and files comes with the media library. Saving this form keeps the current ones.
      </p>
    </div>
  );
}
