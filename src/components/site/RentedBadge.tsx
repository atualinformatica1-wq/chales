export function RentedBadge({ large = false }: { large?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-foreground/35">
      <span
        className={`-rotate-12 rounded-md border-2 border-primary-foreground bg-destructive font-display font-bold text-destructive-foreground uppercase shadow-lg ${
          large ? "px-10 py-3 text-4xl sm:text-5xl" : "px-6 py-2 text-2xl"
        }`}
      >
        Locado
      </span>
    </div>
  );
}
