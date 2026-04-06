type PanelProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function Panel({
  eyebrow,
  title,
  description,
  className,
  children
}: PanelProps) {
  const classes = [
    "rounded-[2rem] border border-ink/10 bg-[var(--panel)] p-6 shadow-calm backdrop-blur sm:p-8",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.28em] text-signal/75">{eyebrow}</p>
      ) : null}
      {title ? <h2 className="mt-4 font-serif text-3xl text-ink">{title}</h2> : null}
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">{description}</p>
      ) : null}
      {children ? <div className={title || description ? "mt-6" : undefined}>{children}</div> : null}
    </section>
  );
}

