import { sectors } from "@/data/site";

export function SectorMarquee() {
  const items = [...sectors, ...sectors];
  return (
    <div className="overflow-hidden border-y border-line bg-white py-4" aria-label="Industries represented in HEH">
      <div className="flex w-max animate-marquee gap-3">
        {items.map((s, i) => (
          <span key={`${s}-${i}`} className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-navy-700 whitespace-nowrap">{s}</span>
        ))}
      </div>
    </div>
  );
}
