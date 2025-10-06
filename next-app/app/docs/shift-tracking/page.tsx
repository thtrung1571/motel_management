import fs from 'node:fs';
import path from 'node:path';

export default function ShiftTrackingDoc() {
  const filePath = path.join(process.cwd(), 'docs', 'shift-tracking.md');
  const content = fs.readFileSync(filePath, 'utf8');

  return (
    <article className="prose prose-slate mx-auto max-w-3xl py-12 dark:prose-invert">
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{content}</pre>
    </article>
  );
}
