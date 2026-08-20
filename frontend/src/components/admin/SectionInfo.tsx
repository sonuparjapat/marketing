'use client';

// A consistent "what is this section for, concretely" banner shown at the top of every admin
// page — every admin section should be understandable to someone who has never used this panel
// before, without needing to ask a developer what a button does. `example` is optional but strongly
// preferred: an abstract description ("manages homepage content") explains far less than a concrete
// scenario ("a visitor lands on / and sees this exact list of services, in this exact order").
export function SectionInfo({ description, example }: { description: string; example?: string }) {
  return (
    <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
      <strong className="text-fg">What this does:</strong> {description}
      {example && (
        <>
          <br />
          <span className="text-faint">Example: {example}</span>
        </>
      )}
    </p>
  );
}
