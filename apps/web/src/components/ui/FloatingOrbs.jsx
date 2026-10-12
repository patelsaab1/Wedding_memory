/** Soft decorative shapes. They do not capture clicks. */
export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="absolute -top-8 right-[8%] h-28 w-28 rounded-full bg-[#edd9c4]/80 sm:h-40 sm:w-40" />
      <span className="absolute top-24 left-[6%] h-16 w-16 rounded-full border border-gold/30 sm:h-24 sm:w-24" />
      <span className="absolute right-[18%] bottom-6 h-10 w-10 rounded-full bg-wine/10 sm:h-14 sm:w-14" />
    </div>
  );
}
