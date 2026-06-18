export type EmpresaStatus = 'ativa' | 'inativa';
export type PedidoStatus = 'rascunho' | 'enviado' | 'confirmado' | 'cancelado';
export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
export type StatusManualFuncionamento = 'automatico' | 'aberto' | 'fechado';

export interface HorarioFuncionamento {
  dia: DiaSemana;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  whatsapp: string;
  cidade: string;
  status: EmpresaStatus;
  horarioFuncionamento: HorarioFuncionamento[];
  statusManual: StatusManualFuncionamento;
  mensagemCliente: string;
  corPrincipal: string;
  taxaEntrega: number;
  pedidoMinimo: number;
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
