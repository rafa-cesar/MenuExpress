import { FormEvent, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Categoria } from '../../types/menu';
import { useMenuStore } from '../../context/MenuStoreContext';
import { supabase } from '../../lib/supabase';

const EMPRESA_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

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

  const { categorias, setCategorias } = useMenuStore();
  const [form, setForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);

    const novaCategoria = {
      empresa_id: EMPRESA_ID,
      nome: form.nome,
      slug: slugify(form.nome),
      ordem: Number(form.ordem),
      ativa: form.ativa,
    };

    const { data, error } = await supabase
      .from('categorias')
      .insert(novaCategoria)
      .select()
      .single();

    setSalvando(false);

    if (error || !data) {
      setErro('Erro ao salvar categoria: ' + (error?.message ?? 'sem resposta do banco'));
      return;
    }

    const categoriaAdicionada: Categoria = {
      id: data.id,
      empresaId: data.empresa_id,
      nome: data.nome,
      slug: data.slug,
      ordem: data.ordem,
      ativa: data.ativa,
    };

    setCategorias((current) =>
      [...current, categoriaAdicionada].sort((a, b) => a.ordem - b.ordem),
    );
    setForm(emptyCategoryForm);
  }

  async function removeCategory(categoryId: string) {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', categoryId);

    if (error) {
      alert('Erro ao remover categoria: ' + error.message);
      return;
    }

    setCategorias((current) => current.filter((c) => c.id !== categoryId));
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Organização"
        title="Categorias"
        description="Organize a ordem e disponibilidade das categorias exibidas no cardápio digital."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Tabela de categorias */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black text-slate-950">Categorias cadastradas</h2>
          </div>

          {categorias.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">Nenhuma categoria cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Nome</th>
                    <th className="px-5 py-3">Slug</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categorias.map((category: Categoria) => (
                    <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-400">{category.ordem}</td>
                      <td className="px-5 py-3 font-bold text-slate-950">{category.nome}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono">/{category.slug}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-black ${
                            category.ativa
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {category.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeCategory(category.id)}
                          className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-black text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulário de nova categoria */}
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-xl font-black text-slate-950">Nova categoria</h2>

          {erro ? (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erro}</p>
          ) : null}

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-700">
              Nome
              <input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Ordem
              <input
                required
                type="number"
                min="1"
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
              />{' '}
              Categoria ativa
            </label>
            <button
              type="submit"
              disabled={salvando}
              className="w-full rounded-full bg-brand-600 px-5 py-3 font-black text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Cadastrar categoria'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
