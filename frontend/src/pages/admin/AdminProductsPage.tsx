import { FormEvent, useMemo, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { useMenuExpressStore } from '../../hooks/useMenuExpressStore';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Produto } from '../../types/domain';

type ProductFormState = {
  nome: string;
  descricao: string;
  preco: string;
  categoriaId: string;
  imagem: string;
  ativo: boolean;
  destaque: boolean;
};

const defaultImage = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80';

const emptyProductForm: ProductFormState = {
  nome: '',
  descricao: '',
  preco: '',
  categoriaId: '',
  imagem: '',
  ativo: true,
  destaque: false,
};

export function AdminProductsPage() {
  usePageTitle('Admin Produtos');

  const { categorias, empresa, produtos, removeProduto, upsertProduto } = useMenuExpressStore();
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const availableCategories = useMemo(
    () => categorias.filter((category) => category.ativa),
    [categorias],
  );

  const selectedCategoryId = form.categoriaId || availableCategories[0]?.id || categorias[0]?.id || '';

  function resetForm() {
    setForm(emptyProductForm);
    setEditingProductId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const category = categorias.find((item) => item.id === selectedCategoryId);

    if (!category) {
      return;
    }

    const product: Produto = {
      id: editingProductId ?? `produto-${Date.now()}`,
      empresaId: empresa.id,
      categoriaId: category.id,
      nome: form.nome,
      descricao: form.descricao,
      preco: Number(form.preco),
      categoria: category.nome,
      imagem: form.imagem || defaultImage,
      destaque: form.destaque,
      disponivel: form.ativo,
    };

    upsertProduto(product);
    resetForm();
  }

  function editProduct(product: Produto) {
    setEditingProductId(product.id);
    setForm({
      nome: product.nome,
      descricao: product.descricao,
      preco: String(product.preco),
      categoriaId: product.categoriaId,
      imagem: product.imagem,
      ativo: product.disponivel,
      destaque: product.destaque,
    });
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Cadastre, edite e remova produtos usando a camada central local que alimenta o cardápio público."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black text-slate-950">Produtos cadastrados</h2>
            <p className="mt-1 text-sm text-slate-500">Produtos salvos no localStorage e exibidos no cardápio público quando ativos.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {produtos.map((product) => (
              <article key={product.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950">{product.nome}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${product.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {product.disponivel ? 'Ativo' : 'Inativo'}
                    </span>
                    {product.destaque ? (
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-black text-brand-700">Destaque</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{product.categoria} · {product.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editProduct(product)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:border-brand-500 hover:text-brand-600">
                    Editar
                  </button>
                  <button type="button" onClick={() => removeProduto(product.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100">
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{editingProductId ? 'Editar produto' : 'Novo produto'}</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-700">Nome
              <input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
            </label>
            <label className="block text-sm font-bold text-slate-700">Descrição
              <textarea required value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">Preço
                <input required type="number" min="0" step="0.01" value={form.preco} onChange={(event) => setForm({ ...form, preco: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Categoria
                <select required value={selectedCategoryId} onChange={(event) => setForm({ ...form, categoriaId: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
                  {categorias.map((category) => <option key={category.id} value={category.id}>{category.nome}{category.ativa ? '' : ' (inativa)'}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-bold text-slate-700">Imagem / URL
              <input value={form.imagem} onChange={(event) => setForm({ ...form, imagem: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} /> Ativo
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.destaque} onChange={(event) => setForm({ ...form, destaque: event.target.checked })} /> Destaque
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="flex-1 rounded-full bg-brand-600 px-5 py-3 font-black text-white hover:bg-brand-700">
                {editingProductId ? 'Salvar alterações' : 'Cadastrar produto'}
              </button>
              {editingProductId ? (
                <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 px-5 py-3 font-black text-slate-700 hover:border-brand-500 hover:text-brand-600">
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
