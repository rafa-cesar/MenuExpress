type AdminStatCardProps = {
  title: string;
  value: string | number;
  description: string;
};

export function AdminStatCard({ title, value, description }: AdminStatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}
