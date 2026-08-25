function groupByPhase(steps) {
  const groups = [];
  for (const step of steps) {
    const last = groups[groups.length - 1];
    if (last && last.phase === step.phase) {
      last.items.push(step);
    } else {
      groups.push({ phase: step.phase, items: [step] });
    }
  }
  return groups;
}

export function JourneyTimeline({ steps }) {
  const groups = groupByPhase(steps);
  let stepCounter = 0;

  return (
    <ol className="flex flex-col gap-8">
      {groups.map((group) => (
        <li key={group.phase} className="animate-fade-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-dark">{group.phase}</p>
          <ol className="relative ml-3 flex flex-col gap-5 border-l-2 border-border pl-6">
            {group.items.map((item) => {
              stepCounter += 1;
              return (
                <li key={item.id || item.title} className="relative animate-fade-up" style={{ animationDelay: `${stepCounter * 40}ms` }}>
                  <span
                    className="absolute -left-[1.95rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent bg-cream"
                    aria-hidden="true"
                  />
                  <p className="font-display text-base text-charcoal">{item.title}</p>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}
