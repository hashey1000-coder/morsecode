type AdSlotProps = {
  id?: string;
  lazyParentUnit?: string;
  variant?: 'top' | 'bottom' | 'inline' | 'section';
  className?: string;
};

export default function AdSlot({
  id,
  lazyParentUnit,
  variant = 'section',
  className,
}: AdSlotProps) {
  if (!id && !lazyParentUnit) {
    return null;
  }

  const wrapperClassName = ['wp-ad-slot', `wp-ad-slot-${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={wrapperClassName} aria-label="Advertisement">
      {id ? (
        <div id={id} className="wp-ad-raw" />
      ) : (
        <div
          {...({
            className: 'lazy wp-ad-raw',
            'parent-unit': lazyParentUnit,
          } as Record<string, string>)}
        />
      )}
    </section>
  );
}