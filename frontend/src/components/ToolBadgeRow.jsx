import Badge from './ui/Badge';
import { humanizeToolName } from '../config/toolLabels';

export default function ToolBadgeRow({ toolsUsed }) {
  if (!toolsUsed || toolsUsed.length === 0) return null;

  const seen = new Set();
  const unique = toolsUsed.filter((t) => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {unique.map((tool, i) => (
        <div
          key={tool}
          style={{
            animation: `stagger-fade-in 200ms ease-out both`,
            animationDelay: `${i * 50}ms`,
            display: 'inline-block',
          }}
        >
          <Badge variant="tool-called">{humanizeToolName(tool)}</Badge>
        </div>
      ))}
    </div>
  );
}
