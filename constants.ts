
import { Expense, CategoryInfo } from './types';

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'aluguel', description: 'Aluguel', category: 'Moradia', type: 'Fixa', expectedValue: 1200, paidValue: 1200, dueDate: '17', status: 'Pago' },
  { id: 'pensao', description: 'Pensão Alimentícia', category: 'Família', type: 'Fixa', expectedValue: 800, paidValue: 0, dueDate: '15', status: 'Pendente' },
  { id: 'energia', description: 'Energia Elétrica (Luz)', category: 'Utilidades', type: 'Variável', expectedValue: 150, paidValue: 142.50, dueDate: '23', status: 'Pago' },
  { id: 'agua', description: 'Água e Esgoto', category: 'Utilidades', type: 'Variável', expectedValue: 60, paidValue: 0, dueDate: '09', status: 'Pendente' },
  { id: 'internet', description: 'Internet / Telefone', category: 'Comunicação', type: 'Fixa', expectedValue: 99.90, paidValue: 99.90, dueDate: '23', status: 'Pago' },
  { id: 'alimentacao', description: 'Alimentação (Mercado)', category: 'Essencial', type: 'Variável', expectedValue: 800, paidValue: 345.20, dueDate: '', status: 'Pendente' },
  { id: 'riachuelo', description: 'Riachuelo', category: 'Crédito', type: 'Variável', expectedValue: 200, paidValue: 0, dueDate: '16', status: 'Pendente' },
  { id: 'cea', description: 'C&A', category: 'Crédito', type: 'Variável', expectedValue: 150, paidValue: 0, dueDate: '16', status: 'Pendente' },
  { id: 'recarga_tim', description: 'Recarga de Celular TIM', category: 'Comunicação', type: 'Variável', expectedValue: 40, paidValue: 40, dueDate: '13', status: 'Pago' },
  { id: 'recarga_claro', description: 'Recarga de Celular Claro', category: 'Comunicação', type: 'Variável', expectedValue: 40, paidValue: 0, dueDate: '15', status: 'Pendente' },
  { id: 'google', description: 'Google (Assinatura)', category: 'Aplicativo', type: 'Fixa', expectedValue: 9.90, paidValue: 9.90, dueDate: '24', status: 'Pago' },
  { id: 'canva', description: 'Canva (Assinatura)', category: 'Aplicativo', type: 'Fixa', expectedValue: 34.90, paidValue: 0, dueDate: '24', status: 'Pendente' },
  { id: 'nubank', description: 'Cartão Nubank', category: 'Crédito', type: 'Variável', expectedValue: 500, paidValue: 0, dueDate: '17', status: 'Pendente' },
  { id: 'bradesco', description: 'Cartão Bradesco', category: 'Crédito', type: 'Variável', expectedValue: 300, paidValue: 0, dueDate: '20', status: 'Pendente' },
  { id: 'itau', description: 'Cartão Itaú', category: 'Crédito', type: 'Variável', expectedValue: 250, paidValue: 0, dueDate: '18', status: 'Pendente' }
];

export const CATEGORIES: Record<string, CategoryInfo> = {
  'Moradia': { name: 'Moradia', color: '#3b82f6', icon: 'Home' },
  'Família': { name: 'Família', color: '#f43f5e', icon: 'Users' },
  'Utilidades': { name: 'Utilidades', color: '#f59e0b', icon: 'Zap' },
  'Comunicação': { name: 'Comunicação', color: '#a855f7', icon: 'Wifi' },
  'Essencial': { name: 'Essencial', color: '#10b981', icon: 'ShoppingBag' },
  'Aplicativo': { name: 'Aplicativo', color: '#06b6d4', icon: 'Smartphone' },
  'Crédito': { name: 'Crédito', color: '#ec4899', icon: 'CreditCard' },
};
