// Categorias padrão (semeadas por usuário). `key` é estável e é o que as
// despesas guardam — por isso "Passeios" continua sendo a chave (despesas
// antigas não quebram), mas o nome exibido já nasce como "Ingressos".
export interface DefaultCategory {
  key: string;
  name: string;
  icon: string; // nome do ícone (lucide) — resolvido no frontend
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { key: 'Aéreo', name: 'Aéreo', icon: 'Plane', color: '#43346A' },
  { key: 'Hospedagem', name: 'Hospedagem', icon: 'BedDouble', color: '#7B6BB6' },
  { key: 'Transporte', name: 'Transporte', icon: 'Car', color: '#DF8E1E' },
  { key: 'Alimentação', name: 'Alimentação', icon: 'Utensils', color: '#EF5244' },
  { key: 'Passeios', name: 'Ingressos', icon: 'Ticket', color: '#2E9E8F' },
  { key: 'Compras', name: 'Compras', icon: 'ShoppingBag', color: '#FD796D' },
  { key: 'Seguro', name: 'Seguro', icon: 'ShieldCheck', color: '#3E73C4' },
  { key: 'Outros', name: 'Outros', icon: 'MoreHorizontal', color: '#8B8598' },
];
