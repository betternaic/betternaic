import { Link } from 'react-router';
import type { Components } from 'react-markdown';

// Styling comes from the Tailwind typography `prose` classes on the wrapper;
// this routes internal links through the router, opens external links in a
// new tab, and turns requirement checklists into real, tickable checkboxes.
export const markdownComponents: Components = {
  a: ({ href = '', children }) =>
    href.startsWith('/') ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  // GFM renders disabled, unlabeled boxes. Wrap each item in a <label> so the
  // whole line is a large tap target people can tick while gathering papers.
  li: ({ className, children }) =>
    className?.includes('task-list-item') ? (
      <li className="list-none pl-0">
        <label className="flex cursor-pointer items-start gap-3">{children}</label>
      </li>
    ) : (
      <li className={className}>{children}</li>
    ),
  input: ({ type, checked }) =>
    type === 'checkbox' ? (
      <input type="checkbox" defaultChecked={checked} className="mt-1.5 h-5 w-5 shrink-0 accent-primary-500" />
    ) : null,
  table: ({ children }) => (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Table">
      <table>{children}</table>
    </div>
  ),
};
