import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminSectionHeader } from '../../components/admin/AdminSectionHeader';
import { demoCategorias, demoEmpresa, demoMenuItems, menuCategories } from '../../data/menu';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { MenuCategory, MenuItem } from '../../types/menu';
import { useMenuStore } from '../../context/MenuStoreContext';

type ProductFormState = {
  nome: string;
  descricao: string;
  preco: string;
  categoria: MenuCategory;
  imagem: string;
  ativo: boolean;
  destaque: boolean;
};

const emptyProductForm: ProductFormState = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'Hambúrgueres',
  imagem: '',
  ativo: true,
  destaque: false,
};

export function AdminProductsPage() {
  usePageTitle('Admin Produtos');

  const { produtos, setProdutos } = useMenuStore();

  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Garante fallback para demoMenuItems caso store esteja vazia
  useEffect(() => {
    if (!produtos.length) {
      setProdutos(demoMenuItems);
    }
  }, [produtos.length, setProdutos]);

  const submitLabel = useMemo(() => (editingProductId ? 'Salvar alterações' : 'Cadastrar produto'), [editingProductId]);
  const modalTitle = editingProductId ? 'Editar produto' : 'Novo produto';

  function resetForm() {
    setForm(emptyProductForm);
    setEditingProductId(null);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const category = demoCategorias.find((item) => item.nome === form.categoria);
    const product: MenuItem = {
      id: editingProductId ?? `produto-${Date.now()}`,
      empresaId: demoEmpresa.id,
      categoriaId: category?.id ?? 'categoria-1',
      nome: form.nome,
      descricao: form.descricao,
      preco: Number(form.preco),
      categoria: form.categoria,
      imagem: form.imagem || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
      destaque: form.destaque,
      disponivel: form.ativo,
    };

    if (editingProductId) {
      setProdutos((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === editingProductId ? product : currentProduct,
        ),
      );
    } else {
      setProdutos((currentProducts) => [product, ...currentProducts]);
    }

    closeModal();
  }

  function handleEdit(product: MenuItem) {
    setEditingProductId(product.id);
    setForm({
      nome: product.nome,
      descricao: product.descricao,
      preco: String(product.preco),
      categoria: product.categoria,
      imagem: product.imagem,
      ativo: product.disponivel,
      destaque: product.destaque,
    });
    setIsModalOpen(true);
  }

  function removeProduct(productId: string) {
    setProdutos((currentProducts) => currentProducts.filter((product) => product.id !== productId));

    if (editingProductId === productId) {
      closeModal();
    }
  }

  return (
    <section>
      <AdminSectionHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Cadastre produtos, destaque promoções e mantenha a listagem pronta para futura persistência no Supabase."
      />

      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-brand-700"
          >
            Novo produto
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black text-slate-950">Produtos cadastrados</h2>
            <p className="mt-1 text-sm text-slate-500">Dados compartilhados com o cardápio público nesta etapa.</p>
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
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:border-brand-500 hover:text-brand-600"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">Catálogo</p>
                <h2 id="product-modal-title" className="mt-1 text-2xl font-black text-slate-950">
                  {modalTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-bold text-slate-700">Nome
                <input required autoFocus value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Descrição
                <textarea required value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">Preço
                  <input required type="number" min="0" step="0.01" value={form.preco} onChange={(event) => setForm({ ...form, preco: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
                </label>
                <label className="block text-sm font-bold text-slate-700">Categoria
                  <select value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value as MenuCategory })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
                    {menuCategories.map((category) => <option key={category}>{category}</option>)}
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
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 px-5 py-3 font-black text-slate-700 hover:border-slate-300 hover:text-slate-900">
                  Cancelar
                </button>
                <button type="submit" className="rounded-full bg-brand-600 px-5 py-3 font-black text-white hover:bg-brand-700">
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
