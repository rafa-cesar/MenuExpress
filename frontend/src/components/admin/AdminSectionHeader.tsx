type AdminSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AdminSectionHeader({ eyebrow, title, description }: AdminSectionHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}
