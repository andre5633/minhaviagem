import {
  Plane,
  BedDouble,
  Car,
  Utensils,
  Camera,
  ShoppingBag,
  ShieldCheck,
  MoreHorizontal,
  Palmtree,
  Ticket,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryKey, CoverKey } from '../types';

export interface CategoryDef {
  key: CategoryKey;
  color: string;
  Icon: LucideIcon;
}

// Cores da paleta da marca aplicadas às categorias
export const CATEGORIES: CategoryDef[] = [
  { key: 'Aéreo', color: '#43346A', Icon: Plane },
  { key: 'Hospedagem', color: '#7B6BB6', Icon: BedDouble },
  { key: 'Transporte', color: '#DF8E1E', Icon: Car },
  { key: 'Alimentação', color: '#EF5244', Icon: Utensils },
  { key: 'Passeios', color: '#2E9E8F', Icon: Camera },
  { key: 'Compras', color: '#FD796D', Icon: ShoppingBag },
  { key: 'Seguro', color: '#3E73C4', Icon: ShieldCheck },
  { key: 'Outros', color: '#8B8598', Icon: MoreHorizontal },
];

export const CATEGORY_MAP: Record<CategoryKey, CategoryDef> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<CategoryKey, CategoryDef>,
);

export interface CoverDef {
  key: CoverKey;
  gradient: string;
  Icon: LucideIcon;
  tag: string;
  image: string;
}

export const COVERS: Record<CoverKey, CoverDef> = {
  beach: { key: 'beach', gradient: 'linear-gradient(135deg,#FEAC3A,#FD796D)', Icon: Palmtree, tag: 'praia', image: '/praia.jpg' },
  city: { key: 'city', gradient: 'linear-gradient(135deg,#43346A,#7B6BB6)', Icon: Ticket, tag: 'cidade', image: '/cidade.jpg' },
  mountain: { key: 'mountain', gradient: 'linear-gradient(135deg,#DF8E1E,#EF5244)', Icon: Compass, tag: 'montanha', image: '/montanha.jpg' },
};

export const COVER_KEYS: CoverKey[] = ['beach', 'city', 'mountain'];
