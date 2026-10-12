/**
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function Container({ children, className = '', wide = false }) {
  const width = wide ? 'max-w-6xl' : 'max-w-5xl';
  return <div className={`mx-auto w-full ${width} px-4 sm:px-6 ${className}`}>{children}</div>;
}
