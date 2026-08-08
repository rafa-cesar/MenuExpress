export type EmpresaStatus = 'ativa' | 'inativa';
export type PedidoStatus =
  | 'aguardando'
  | 'em_preparo'
  | 'pronto_retirada'
  | 'saiu_entrega'
  | 'finalizado'
  | 'cancelado';
export type StatusLoja = 'automatico' | 'forcar_aberto' | 'forcar_fechado';
export type DiaSemanaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
export type EstiloVisual = 'moderno' | 'clean' | 'vibrante' | 'classico';
export type ModalidadeEntrega = 'retirada' | 'entrega';
export type FormaPagamento = 'online' | 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
export type StatusPagamento = 'nao_aplicavel' | 'aguardando' | 'pago' | 'falhou' | 'cancelado' | 'expirado' | 'estorno_pendente' | 'estornado';

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

export interface EnderecoCliente {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento?: string;
  cep?: string;
}

export interface ConfigEntrega {
  retiradaAtiva: boolean;
  entregaAtiva: boolean;
  taxaEntregaFixa: number;
  pedidoMinimoEntrega: number;
  endereco?: EnderecoLoja;
  tempoPadraoMinutos?: number;
}

export interface ConfigPagamento {
  onlineAntecipadoAtivo: boolean;
  dinheiroNaHoraAtivo: boolean;
  cartaoNaHoraAtivo: boolean;
  pixNaHoraAtivo: boolean;
  chavePix?: string;
  nomeBeneficiarioPix?: string;
}

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  whatsapp: string;
  instagram?: string;
  cidade: string;
  status: EmpresaStatus;
  corPrincipal: string;
  logoUrl?: string;
  capaUrl?: string;
  estiloVisual?: EstiloVisual;
  taxaEntrega: number;
  pedidoMinimo: number;
  horario: HorarioFuncionamento;
  entrega?: ConfigEntrega;
  pagamentos?: ConfigPagamento;
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
  produtoId?: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  empresaId: string;
  clienteId?: string;
  numero: number;
  status: PedidoStatus;
  modalidade: ModalidadeEntrega;
  formaPagamento?: FormaPagamento;
  statusPagamento?: StatusPagamento;
  provedorPagamento?: string;
  pagamentoUrl?: string;
  pagamentoExpiraEm?: string;
  pagoEm?: string;
  clienteNome?: string;
  clienteTel?: string;
  clienteEnd?: string;
  itens: PedidoItem[];
  observacao?: string;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  estimativaMinutos?: number;
  previsaoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ClientePerfil {
  id: string;
  authId: string;
  empresaId: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  dataNasc?: string;
  endereco?: EnderecoCliente;
  fotoUrl?: string;
}
