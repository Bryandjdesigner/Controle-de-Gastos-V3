
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  BrainCircuit, 
  Plus, 
  RefreshCw,
  LayoutDashboard,
  Receipt,
  PieChart as PieChartIcon,
  Calendar,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Menu,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { INITIAL_EXPENSES, CATEGORIES } from './constants';
import { Expense, SummaryData, MonthlyDataStore } from './types';
import { getFinancialInsights } from './services/geminiService';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [monthlyStore, setMonthlyStore] = useState<MonthlyDataStore>(() => {
    try {
      const savedStore = localStorage.getItem('finance_monthly_store');
      if (savedStore) return JSON.parse(savedStore);
      
      const initialStore: MonthlyDataStore = {};
      MONTHS.forEach((_, index) => {
        initialStore[index] = INITIAL_EXPENSES.map(e => ({ 
          ...e, 
          id: `${e.id}-${index}-${Math.random().toString(36).substr(2, 9)}` 
        }));
      });
      return initialStore;
    } catch (e) {
      return {};
    }
  });

  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'history'>('dashboard');

  useEffect(() => {
    localStorage.setItem('finance_monthly_store', JSON.stringify(monthlyStore));
  }, [monthlyStore]);

  const expenses = useMemo(() => monthlyStore[selectedMonth] || [], [monthlyStore, selectedMonth]);

  const getMonthSummary = (monthIdx: number): SummaryData => {
    const monthExpenses = monthlyStore[monthIdx] || [];
    const totalExpected = monthExpenses.reduce((acc, curr) => acc + (curr.expectedValue || 0), 0);
    const totalPaid = monthExpenses.reduce((acc, curr) => acc + (curr.paidValue || 0), 0);
    const fixedTotal = monthExpenses.filter(e => e.type === 'Fixa').reduce((acc, curr) => acc + (curr.paidValue || 0), 0);
    const variableTotal = monthExpenses.filter(e => e.type === 'Variável').reduce((acc, curr) => acc + (curr.paidValue || 0), 0);
    
    return {
      totalExpected,
      totalPaid,
      balance: totalExpected - totalPaid,
      progress: totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0,
      fixedTotal,
      variableTotal
    };
  };

  const currentSummary = useMemo(() => getMonthSummary(selectedMonth), [monthlyStore, selectedMonth]);
  const prevSummary = useMemo(() => selectedMonth > 0 ? getMonthSummary(selectedMonth - 1) : null, [monthlyStore, selectedMonth]);

  const historyData = useMemo(() => {
    return MONTHS.map((name, index) => {
      const s = getMonthSummary(index);
      return {
        name: name.substring(0, 3),
        fullName: name,
        pago: s.totalPaid,
        previsto: s.totalExpected,
        economia: s.totalExpected - s.totalPaid > 0 ? s.totalExpected - s.totalPaid : 0,
        index
      };
    });
  }, [monthlyStore]);

  const chartData = useMemo(() => {
    const cats = Array.from(new Set(expenses.map(e => e.category)));
    return cats.map((cat: string) => ({
      name: cat,
      value: expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + (curr.paidValue || 0), 0),
      color: CATEGORIES[cat]?.color || '#ccc'
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const handleUpdateExpense = (id: string, field: keyof Expense, value: any) => {
    setMonthlyStore(prev => {
      const monthData = [...(prev[selectedMonth] || [])];
      const index = monthData.findIndex(e => e.id === id);
      if (index > -1) {
        monthData[index] = { ...monthData[index], [field]: value };
      }
      return { ...prev, [selectedMonth]: monthData };
    });
  };

  const removeExpense = (id: string) => {
    setMonthlyStore(prev => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).filter(e => e.id !== id)
    }));
  };

  const toggleStatus = (id: string) => {
    setMonthlyStore(prev => {
      const monthData = (prev[selectedMonth] || []).map(e => {
        if (e.id === id) {
          const newStatus = e.status === 'Pago' ? 'Pendente' : 'Pago';
          return { ...e, status: newStatus as any, paidValue: newStatus === 'Pago' ? e.expectedValue : 0 };
        }
        return e;
      });
      return { ...prev, [selectedMonth]: monthData };
    });
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const text = await getFinancialInsights(expenses);
    setInsights(text || "Nenhum insight disponível.");
    setLoadingInsights(false);
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const addNewExpense = () => {
    const newExp: Expense = {
      id: Date.now().toString(),
      description: 'Novo Gasto',
      category: 'Essencial',
      type: 'Variável',
      expectedValue: 0,
      paidValue: 0,
      dueDate: '',
      status: 'Pendente'
    };
    setMonthlyStore(prev => ({ 
      ...prev, 
      [selectedMonth]: [...(prev[selectedMonth] || []), newExp] 
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden">
      {/* Menu Lateral Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Menu Lateral */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Wallet className="w-6 h-6 text-slate-950" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">FinanceFlow</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400"><X /></button>
          </div>

          <nav className="flex flex-col gap-2 mb-8">
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => { setActiveTab('list'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Receipt className="w-5 h-5" /> Gastos
            </button>
            <button onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <History className="w-5 h-5" /> Histórico
            </button>
          </nav>

          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4">Meses</p>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, idx) => (
                <button key={month} onClick={() => setSelectedMonth(idx)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${selectedMonth === idx ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {month.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-100"><Menu /></button>
          <div className="text-sm font-bold text-emerald-400 uppercase tracking-widest">{MONTHS[selectedMonth]}</div>
          <button onClick={fetchInsights} disabled={loadingInsights} className="p-2 text-indigo-400"><BrainCircuit className={loadingInsights ? 'animate-spin' : ''} /></button>
        </div>

        <div className="p-4 md:p-8 flex-1">
          {activeTab === 'dashboard' ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Previsto" value={formatBRL(currentSummary.totalExpected)} icon={<TrendingUp className="text-blue-400" />} />
                <Card title="Pago" value={formatBRL(currentSummary.totalPaid)} icon={<TrendingDown className="text-emerald-400" />} />
                <Card title="Em Aberto" value={formatBRL(currentSummary.balance)} icon={<Wallet className="text-amber-400" />} />
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Execução</span>
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl font-bold mono text-white">{Math.round(currentSummary.progress)}%</span>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500" style={{ width: `${currentSummary.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {insights && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-indigo-300 flex items-center gap-2 mb-4"><BrainCircuit className="w-5 h-5" /> Inteligência Financeira</h3>
                  <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">{insights.split('\n').map((l, i) => <p key={i} className="mb-2">{l}</p>)}</div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-cyan-400" /> Gastos por Categoria</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} axisLine={false} tickLine={false} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
                  <h3 className="font-bold text-white mb-6 w-full flex items-center gap-2"><RefreshCw className="w-5 h-5 text-pink-400" /> Balanço do Mês</h3>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ name: 'Fixas', value: currentSummary.fixedTotal }, { name: 'Variáveis', value: currentSummary.variableTotal }]} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                          <Cell fill="#22d3ee" /><Cell fill="#f472b6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'list' ? (
            <div className="space-y-4 pb-24 md:pb-0">
              <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h3 className="font-bold text-white">Lançamentos</h3>
                <button onClick={addNewExpense} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold border border-emerald-500/20 hover:bg-emerald-500/20"><Plus className="w-4 h-4" /> Novo</button>
              </div>

              {/* Tabela Desktop */}
              <div className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Descrição</th>
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4 text-right">Previsto</th>
                      <th className="px-6 py-4 text-right">Pago</th>
                      <th className="px-6 py-4 text-center">Dia</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-3"><input type="text" value={expense.description} onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)} className="bg-transparent text-white font-medium outline-none w-full" /></td>
                        <td className="px-6 py-3">
                          <select value={expense.category} onChange={(e) => handleUpdateExpense(expense.id, 'category', e.target.value)} className="bg-transparent text-xs font-bold" style={{ color: CATEGORIES[expense.category]?.color || '#fff' }}>
                            {Object.keys(CATEGORIES).map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-sm"><input type="number" value={expense.expectedValue} onChange={(e) => handleUpdateExpense(expense.id, 'expectedValue', parseFloat(e.target.value) || 0)} className="bg-transparent text-right w-20 outline-none" /></td>
                        <td className="px-6 py-3 text-right font-mono text-sm"><input type="number" value={expense.paidValue} onChange={(e) => handleUpdateExpense(expense.id, 'paidValue', parseFloat(e.target.value) || 0)} className="bg-transparent text-right w-20 outline-none" /></td>
                        <td className="px-6 py-3 text-center"><input type="text" value={expense.dueDate} maxLength={2} onChange={(e) => handleUpdateExpense(expense.id, 'dueDate', e.target.value)} className="bg-transparent text-center w-8 outline-none text-slate-400" /></td>
                        <td className="px-6 py-3 text-center">
                          <button onClick={() => toggleStatus(expense.id)} className={`px-3 py-1 rounded-full text-[10px] font-bold ${expense.status === 'Pago' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{expense.status}</button>
                        </td>
                        <td className="px-4 py-3"><button onClick={() => removeExpense(expense.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {expenses.map((expense) => (
                  <div key={expense.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <input type="text" value={expense.description} onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)} className="bg-transparent text-white font-bold text-lg outline-none w-4/5" />
                      <button onClick={() => removeExpense(expense.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Previsto</label>
                        <input type="number" inputMode="decimal" value={expense.expectedValue} onChange={(e) => handleUpdateExpense(expense.id, 'expectedValue', parseFloat(e.target.value) || 0)} className="bg-slate-800 p-2 rounded-lg font-mono text-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Pago</label>
                        <input type="number" inputMode="decimal" value={expense.paidValue} onChange={(e) => handleUpdateExpense(expense.id, 'paidValue', parseFloat(e.target.value) || 0)} className="bg-slate-800 p-2 rounded-lg font-mono text-white" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button onClick={() => toggleStatus(expense.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${expense.status === 'Pago' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-amber-400 border border-amber-500/20'}`}>{expense.status.toUpperCase()}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Histórico Anual */
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Acumulado Pago" value={formatBRL(historyData.reduce((acc, curr) => acc + curr.pago, 0))} icon={<ArrowUpRight className="text-emerald-400" />} />
                <Card title="Média de Gasto" value={formatBRL(historyData.reduce((acc, curr) => acc + curr.pago, 0) / 12)} icon={<Activity className="text-indigo-400" />} />
                <Card title="Total Economizado" value={formatBRL(historyData.reduce((acc, curr) => acc + curr.economia, 0))} icon={<TrendingUp className="text-emerald-400" />} />
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} formatter={(v: number) => formatBRL(v)} />
                    <Area type="monotone" dataKey="pago" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Botão Flutuante Mobile */}
      <button onClick={activeTab === 'list' ? addNewExpense : () => setActiveTab('list')} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl z-40"><Plus className="w-8 h-8" /></button>
    </div>
  );
};

const Card = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{title}</span>
      <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
    </div>
    <div className="text-xl md:text-2xl font-bold mono text-white">{value}</div>
  </div>
);

export default App;
