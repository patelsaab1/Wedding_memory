/**
 * Monogram for the master panel. The two letters are Rohit and Roshni.
 * @param {{ compact?: boolean }} props
 */
export function CoupleLogo({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      <svg viewBox="0 0 64 64" className="size-11 shrink-0" role="img" aria-label="Rohit and Roshni">
        <circle cx="32" cy="32" r="31" fill="#7a3040" />
        <circle cx="32" cy="32" r="27" fill="#faf7f4" />
        <circle cx="32" cy="32" r="24" fill="none" stroke="#8c6a3d" strokeWidth="0.75" />
        <text
          x="22"
          y="38"
          textAnchor="middle"
          fill="#7a3040"
          fontFamily="Georgia, Palatino, serif"
          fontSize="18"
        >
          R
        </text>
        <text
          x="32"
          y="30"
          textAnchor="middle"
          fill="#8c6a3d"
          fontFamily="Georgia, Palatino, serif"
          fontSize="9"
        >
          &
        </text>
        <text
          x="42"
          y="38"
          textAnchor="middle"
          fill="#7a3040"
          fontFamily="Georgia, Palatino, serif"
          fontSize="18"
        >
          R
        </text>
      </svg>
      {compact ? null : (
        <div className="min-w-0 leading-tight">
          <p className="font-serif text-ink truncate text-base">Rohit & Roshni</p>
          <p className="text-gold mt-0.5 text-[10px] tracking-[0.2em] uppercase">Master panel</p>
        </div>
      )}
    </div>
  );
}
