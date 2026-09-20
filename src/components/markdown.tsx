/**
 * Renders the small markdown subset used by grammar explanations and AI output:
 * `## ` headings, `- ` bullets, `**bold**`. Keeps LLM output safe (no raw HTML).
 */
export function MiniMarkdown({ md, className = '' }: { md: string; className?: string }) {
  const bold = (line: string): React.ReactNode[] =>
    line.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
  const blocks: React.ReactNode[] = []
  let list: React.ReactNode[] = []
  const flush = (): void => {
    if (list.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
          {list}
        </ul>,
      )
      list = []
    }
  }
  for (const line of md.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      flush()
      continue
    }
    if (trimmed.startsWith('## ')) {
      flush()
      blocks.push(
        <h3
          key={`h-${blocks.length}`}
          className="mt-4 text-sm font-bold uppercase tracking-wide text-indigo-700"
        >
          {trimmed.slice(3)}
        </h3>,
      )
    } else if (trimmed.startsWith('- ')) {
      list.push(
        <li key={`li-${blocks.length}-${list.length}`} className="text-sm text-slate-700">
          {bold(trimmed.slice(2))}
        </li>,
      )
    } else {
      flush()
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm text-slate-700">
          {bold(trimmed)}
        </p>,
      )
    }
  }
  flush()
  return <div className={`space-y-2 ${className}`}>{blocks}</div>
}
