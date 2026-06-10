import type { User, Trip, Expense } from '../types';
import { today, toISO } from '../lib/formatters';

/** Datas relativas a hoje — assim a "viagem ativa" sempre existe ao rodar */
function shift(days: number): string {
  const d = today();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export const MOCK_USER: User = {
  id: 'u_1',
  name: 'Ezequiel Andrade',
  email: 'ezequiel.andrade@gmail.com',
  avatarUrl: '',
};

export const MOCK_TRIPS: Trip[] = [
  {
    id: 't_1',
    userId: 'u_1',
    title: 'Verão em Floripa',
    destination: 'Florianópolis, SC',
    startDate: shift(-3), // começou há 3 dias
    endDate: shift(5), // termina em 5 dias  → ATIVA
    totalBudget: 8000,
    cover: 'beach',
  },
  {
    id: 't_2',
    userId: 'u_1',
    title: 'Réveillon em Lisboa',
    destination: 'Lisboa, Portugal',
    startDate: shift(180),
    endDate: shift(188), // futura
    totalBudget: 22000,
    cover: 'city',
  },
  {
    id: 't_3',
    userId: 'u_1',
    title: 'Trilha na Chapada',
    destination: 'Chapada Diamantina, BA',
    startDate: shift(-95),
    endDate: shift(-89), // encerrada
    totalBudget: 4500,
    cover: 'mountain',
  },
];

export const MOCK_EXPENSES: Expense[] = [
  // Floripa (ativa) — espalhadas pelos dias decorridos
  { id: 'e_01', tripId: 't_1', category: 'Aéreo', description: 'Passagens GRU → FLN', amount: 1240, expenseDate: shift(-3) },
  { id: 'e_02', tripId: 't_1', category: 'Transporte', description: 'Uber aeroporto → hotel', amount: 68, expenseDate: shift(-3) },
  { id: 'e_03', tripId: 't_1', category: 'Hospedagem', description: 'Pousada Lagoa (3 noites)', amount: 1560, expenseDate: shift(-3) },
  { id: 'e_04', tripId: 't_1', category: 'Alimentação', description: 'Jantar no centrinho', amount: 184, expenseDate: shift(-3) },
  { id: 'e_05', tripId: 't_1', category: 'Alimentação', description: 'Café da manhã Praia Mole', amount: 52, expenseDate: shift(-2) },
  { id: 'e_06', tripId: 't_1', category: 'Passeios', description: 'Escuna Ilha do Campeche', amount: 320, expenseDate: shift(-2) },
  { id: 'e_07', tripId: 't_1', category: 'Compras', description: 'Loja de surf — camiseta', amount: 139, expenseDate: shift(-2) },
  { id: 'e_08', tripId: 't_1', category: 'Alimentação', description: 'Ostras no Ribeirão', amount: 246, expenseDate: shift(-1) },
  { id: 'e_09', tripId: 't_1', category: 'Transporte', description: 'Aluguel de scooter', amount: 110, expenseDate: shift(-1) },
  { id: 'e_10', tripId: 't_1', category: 'Passeios', description: 'Sandboard nas dunas', amount: 90, expenseDate: shift(-1) },
  { id: 'e_11', tripId: 't_1', category: 'Alimentação', description: 'Almoço Joaquina', amount: 168, expenseDate: shift(0) },
  { id: 'e_12', tripId: 't_1', category: 'Seguro', description: 'Seguro viagem nacional', amount: 95, expenseDate: shift(0) },

  // Chapada (encerrada)
  { id: 'e_20', tripId: 't_3', category: 'Aéreo', description: 'Passagens p/ Lençóis', amount: 980, expenseDate: shift(-95) },
  { id: 'e_21', tripId: 't_3', category: 'Hospedagem', description: 'Pousada (6 noites)', amount: 1680, expenseDate: shift(-95) },
  { id: 'e_22', tripId: 't_3', category: 'Passeios', description: 'Guia + Cachoeira da Fumaça', amount: 600, expenseDate: shift(-93) },
  { id: 'e_23', tripId: 't_3', category: 'Alimentação', description: 'Refeições da semana', amount: 740, expenseDate: shift(-92) },
  { id: 'e_24', tripId: 't_3', category: 'Transporte', description: 'Transfer 4x4', amount: 420, expenseDate: shift(-91) },
];
