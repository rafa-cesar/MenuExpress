export type EmpresaStatus = 'ativa' | 'inativa';
export type PedidoStatus = 'novo' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
export type StatusLoja = 'automatico' | 'forcar_aberto' | 'forcar_fechado';
export type DiaSemanaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
export type EstiloVisual = 'moderno' | 'clean' | 'vibrante' | 'classico';
export type ModalidadeEntrega = 'retirada' | 'entrega';

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

export interface EnderecoLoja {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento?: string;
}

export interface ConfigEntrega {
  retiradaAtiva: boolean;
  entregaAtiva: boolean;
  taxaEntregaFixa: number;
  pedidoMinimoEntrega: number;
  endereco?: EnderecoLoja;
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
  estiloVisual?: EstiloVisual;
  taxaEntrega: number;
  pedidoMinimo: number;
  horario: HorarioFuncionamento;
  entrega?: ConfigEntrega;
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

export interface PedidoItem {
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  empresaId: string;
  numero: number;
  status: PedidoStatus;
  modalidade: ModalidadeEntrega;
  clienteNome?: string;
  clienteTel?: string;
  clienteEnd?: string;
  itens: PedidoItem[];
  observacao?: string;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Cliente {
  nome: string;
  telefone?: string;
  endereco?: string;
}
