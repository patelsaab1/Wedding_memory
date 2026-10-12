/**
 * Minimal button primitive — extend as the design system grows.
 * @param {{
 *   children: import('react').ReactNode,
 *   type?: 'button' | 'submit' | 'reset',
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   className?: string,
 * }} props
 */
export function Button({ children, type = 'button', onClick, disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-accent inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
