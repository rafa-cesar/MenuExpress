export type EmpresaStatus = 'ativa' | 'inativa';
export type PedidoStatus = 'rascunho' | 'enviado' | 'confirmado' | 'cancelado';

export type StatusLoja = 'automatico' | 'forcar_aberto' | 'forcar_fechado';
export type DiaSemanaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export interface HorarioDia {
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

export type HorarioDias = Record<DiaSemanaKey, HorarioDia>;

export interface HorarioFuncionamento {
  status: StatusLoja;
  dias: HorarioDias;
  mensagemCliente?: string;
}

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  whatsapp: string;
  cidade: string;
  status: EmpresaStatus;
  corPrincipal: string;
  logoUrl?: string;
  taxaEntrega: number;
  pedidoMinimo: number;
  horario: HorarioFuncionamento;
}

export interface Categoria {
  id: string;
  empresaId: string;
  nome: string;
  slug: string;
  ordem: number;
  ativa: boolean;
}

export interface Produto {
  id: string;
  empresaId: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  destaque: boolean;
  disponivel: boolean;
}

export interface Cliente {
  nome: string;
  telefone?: string;
  endereco?: string;
}

export interface PedidoItem {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  empresaId: string;
  cliente?: Cliente;
  itens: PedidoItem[];
  observacao?: string;
  total: number;
  formaPagamento?: string;
  trocoPara?: number;
  status: PedidoStatus;
  criadoEm: string;
}
