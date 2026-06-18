import { FormEvent, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { useMenuExpressStore } from '../../hooks/useMenuExpressStore';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Categoria } from '../../types/menu';

type CategoryFormState = {
  nome: string;
  ordem: string;
  ativa: boolean;
};

const emptyCategoryForm: CategoryFormState = {
  nome: '',
  ordem: '',
  ativa: true,
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminCategoriesPage() {
  usePageTitle('Admin Categorias');

  const { categorias, empresa, removeCategoria, upsertCategoria } = useMenuExpressStore();
  const [form, setForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  function resetForm() {
    setForm(emptyCategoryForm);
    setEditingCategoryId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const category: Categoria = {
      id: editingCategoryId ?? `categoria-${Date.now()}`,
      empresaId: empresa.id,
      nome: form.nome,
      slug: slugify(form.nome),
      ordem: Number(form.ordem),
      ativa: form.ativa,
    };

    upsertCategoria(category);
    resetForm();
  }

  function editCategory(category: Categoria) {
    setEditingCategoryId(category.id);
    setForm({ nome: category.nome, ordem: String(category.ordem), ativa: category.ativa });
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Organização"
        title="Categorias"
        description="Organize a ordem e disponibilidade das categorias exibidas no cardápio digital."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black text-slate-950">Categorias cadastradas</h2>
            <p className="mt-1 text-sm text-slate-500">Categorias ativas aparecem no cardápio público.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {categorias.map((category) => (
              <article key={category.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black text-slate-950">{category.ordem}. {category.nome}</p>
                  <p className="text-sm text-slate-500">/{category.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${category.ativa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {category.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                  <button type="button" onClick={() => editCategory(category)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:border-brand-500 hover:text-brand-600">
                    Editar
                  </button>
                  <button type="button" onClick={() => removeCategoria(category.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100">
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{editingCategoryId ? 'Editar categoria' : 'Nova categoria'}</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-700">Nome
              <input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
            </label>
            <label className="block text-sm font-bold text-slate-700">Ordem
              <input required type="number" min="1" value={form.ordem} onChange={(event) => setForm({ ...form, ordem: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.ativa} onChange={(event) => setForm({ ...form, ativa: event.target.checked })} /> Categoria ativa
            </label>
            <div className="flex flex-col gap-3">
              <button type="submit" className="w-full rounded-full bg-brand-600 px-5 py-3 font-black text-white hover:bg-brand-700">
                {editingCategoryId ? 'Salvar alterações' : 'Cadastrar categoria'}
              </button>
              {editingCategoryId ? (
                <button type="button" onClick={resetForm} className="w-full rounded-full border border-slate-200 px-5 py-3 font-black text-slate-700 hover:border-brand-500 hover:text-brand-600">
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
