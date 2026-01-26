
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
  X,
  Menu,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Tag,
  PlusCircle,
  Filter
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
import { INITIAL_EXPENSES, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { Expense, SummaryData, MonthlyDataStore, MonthData, CategoryInfo } from './types';
import { getFinancialInsights } from './services/geminiService';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  // Categorias Dinâmicas
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>(() => {
    const saved = localStorage.getItem('finance_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [monthlyStore, setMonthlyStore] = useState<MonthlyDataStore>(() => {
    try {
      const savedStore = localStorage.getItem('finance_monthly_store');
      if (savedStore) {
        const parsed = JSON.parse(savedStore);
        if (parsed[0] && Array.isArray(parsed[0])) {
           const migrated: MonthlyDataStore = {};
           Object.keys(parsed).forEach(key => {
             migrated[Number(key)] = { expenses: parsed[key], userName: '' };
           });
           return migrated;
        }
        return parsed;
      }
      
      const initialStore: MonthlyDataStore = {};
      MONTHS.forEach((_, index) => {
        if (index === 0) {
          initialStore[index] = {
            expenses: INITIAL_EXPENSES.map(e => ({ 
              ...e, 
              id: `${e.id}-${index}-${Math.random().toString(36).substr(2, 9)}` 
            })),
            userName: ''
          };
        } else {
          initialStore[index] = {
            expenses: INITIAL_EXPENSES.map(e => ({ 
              ...e, 
              id: `${e.id}-${index}-${Math.random().toString(36).substr(2, 9)}`,
              expectedValue: 0,
              paidValue: 0,
              status: 'Pendente'
            })),
            userName: ''
          };
        }
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

  useEffect(() => {
    localStorage.setItem('finance_categories', JSON.stringify(categories));
  }, [categories]);

  const currentMonthData = useMemo(() => monthlyStore[selectedMonth] || { expenses: [], userName: '' }, [monthlyStore, selectedMonth]);
  const expenses = currentMonthData.expenses;

  // Filtro de despesas
  const filteredExpenses = useMemo(() => {
    if (!filterCategory) return expenses;
    return expenses.filter(e => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const getMonthSummary = (monthIdx: number): SummaryData => {
    const data = monthlyStore[monthIdx];
    const monthExpenses = data ? data.expenses : [];
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
      color: categories[cat]?.color || '#ccc'
    })).sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  const handleUpdateUserName = (name: string) => {
    setMonthlyStore(prev => ({
      ...prev,
      [selectedMonth]: { ...prev[selectedMonth], userName: name }
    }));
  };

  const handleUpdateExpense = (id: string, field: keyof Expense, value: any) => {
    setMonthlyStore(prev => {
      const monthData = prev[selectedMonth];
      const newExpenses = monthData.expenses.map(e => {
        if (e.id === id) {
          const updated = { ...e, [field]: value };
          if (field === 'paidValue') {
            const val = parseFloat(value) || 0;
            updated.status = val > 0 ? 'Pago' : 'Pendente';
          }
          return updated;
        }
        return e;
      });
      return { ...prev, [selectedMonth]: { ...monthData, expenses: newExpenses } };
    });
  };

  const removeExpense = (id: string) => {
    setMonthlyStore(prev => {
      const monthData = prev[selectedMonth];
      const newExpenses = monthData.expenses.filter(e => e.id !== id);
      return { ...prev, [selectedMonth]: { ...monthData, expenses: newExpenses } };
    });
  };

  const toggleStatus = (id: string) => {
    setMonthlyStore(prev => {
      const monthData = prev[selectedMonth];
      const newExpenses = monthData.expenses.map(e => {
        if (e.id === id) {
          const newStatus = e.status === 'Pago' ? 'Pendente' : 'Pago';
          return { 
            ...e, 
            status: newStatus as any, 
            paidValue: newStatus === 'Pago' ? (e.paidValue > 0 ? e.paidValue : e.expectedValue) : 0 
          };
        }
        return e;
      });
      return { ...prev, [selectedMonth]: { ...monthData, expenses: newExpenses } };
    });
  };

  const addNewExpense = (catName?: string) => {
    const baseCategory = catName || Object.keys(categories)[0] || 'Geral';
    const baseDescription = catName || 'Novo Gasto';
    const baseGroupId = Math.random().toString(36).substr(2, 9);

    setMonthlyStore(prev => {
      const newStore = { ...prev };
      // Itera por todos os meses de Jan (0) a Dez (11)
      for (let i = 0; i < 12; i++) {
        const monthData = newStore[i] || { expenses: [], userName: '' };
        const newExp: Expense = {
          id: `${Date.now()}-${i}-${baseGroupId}`,
          description: baseDescription,
          category: baseCategory,
          type: 'Variável',
          expectedValue: 0,
          paidValue: 0,
          dueDate: '',
          status: 'Pendente'
        };
        newStore[i] = {
          ...monthData,
          expenses: [...monthData.expenses, newExp]
        };
      }
      return newStore;
    });

    setActiveTab('list');
    setIsCategoryModalOpen(false);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const catName = newCatName.trim();
    setCategories(prev => ({
      ...prev,
      [catName]: { name: catName, color: newCatColor }
    }));
    
    // Inserção automática em TODOS os meses ao criar categoria
    addNewExpense(catName);
    
    setNewCatName('');
  };

  const removeCategory = (name: string) => {
    const newCats = { ...categories };
    delete newCats[name];
    setCategories(newCats);
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const text = await getFinancialInsights(expenses);
    setInsights(text || "Nenhum insight disponível.");
    setLoadingInsights(false);
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

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

      <main className="flex-1 flex flex-col min-h-screen">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-4 flex-1">
                  <h3 className="font-bold text-white text-lg">Lançamentos</h3>
                  <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Responsável:</span>
                    <input 
                      type="text" 
                      placeholder="Nome do responsável..." 
                      value={currentMonthData.userName}
                      onChange={(e) => handleUpdateUserName(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-all shadow-lg"><Tag className="w-4 h-4" /> Categorias</button>
                  <button onClick={() => addNewExpense()} className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 text-slate-950 rounded-xl text-sm font-bold border border-emerald-400/20 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"><Plus className="w-4 h-4" /> Novo Gasto</button>
                </div>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                  onClick={() => setFilterCategory(null)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${!filterCategory ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                >
                  <Filter className="w-3 h-3" /> Todos
                </button>
                {Object.values(categories).map((cat: CategoryInfo) => (
                  <button 
                    key={cat.name}
                    onClick={() => setFilterCategory(cat.name)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterCategory === cat.name ? 'border-white shadow-xl bg-slate-800 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                    style={{ borderLeftColor: cat.color, borderLeftWidth: filterCategory === cat.name ? '1px' : '4px' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-5">Descrição</th>
                      <th className="px-6 py-5">Categoria</th>
                      <th className="px-6 py-5 text-right">Previsto</th>
                      <th className="px-6 py-5 text-right">Pago</th>
                      <th className="px-6 py-5 text-center">Dia</th>
                      <th className="px-6 py-5 text-center">Status</th>
                      <th className="px-4 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <input type="text" value={expense.description} onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)} className="bg-transparent text-white font-bold outline-none w-full" />
                        </td>
                        <td className="px-6 py-4">
                          <select value={expense.category} onChange={(e) => handleUpdateExpense(expense.id, 'category', e.target.value)} className="bg-transparent text-xs font-bold outline-none" style={{ color: categories[expense.category]?.color || '#fff' }}>
                            {Object.keys(categories).map(c => <option key={c} value={c} className="bg-slate-900" style={{ color: categories[c]?.color }}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-500 text-[10px] font-bold">R$</span>
                            <input type="number" step="0.01" value={expense.expectedValue} onChange={(e) => handleUpdateExpense(expense.id, 'expectedValue', parseFloat(e.target.value) || 0)} className="bg-transparent text-right w-24 outline-none text-white font-bold mono text-sm" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-500 text-[10px] font-bold">R$</span>
                            <input type="number" step="0.01" value={expense.paidValue} onChange={(e) => handleUpdateExpense(expense.id, 'paidValue', parseFloat(e.target.value) || 0)} className="bg-transparent text-right w-24 outline-none text-white font-bold mono text-sm" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input type="text" value={expense.dueDate} maxLength={2} onChange={(e) => handleUpdateExpense(expense.id, 'dueDate', e.target.value)} className="bg-transparent text-center w-8 outline-none text-slate-300 font-bold" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(expense.id)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${expense.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{expense.status.toUpperCase()}</button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => removeExpense(expense.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg" style={{ borderLeft: `4px solid ${categories[expense.category]?.color || '#475569'}` }}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1 w-full">
                        <input type="text" value={expense.description} onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)} className="bg-transparent text-white font-bold text-lg outline-none" />
                        <div className="flex gap-2">
                           <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50" style={{ color: categories[expense.category]?.color }}>{expense.category}</span>
                           <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50 text-slate-400">{expense.type}</span>
                        </div>
                      </div>
                      <button onClick={() => removeExpense(expense.id)} className="text-slate-600 hover:text-red-400 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Previsto</label>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 text-[10px] font-bold">R$</span>
                          <input type="number" inputMode="decimal" value={expense.expectedValue} onChange={(e) => handleUpdateExpense(expense.id, 'expectedValue', parseFloat(e.target.value) || 0)} className="bg-transparent font-bold mono text-white w-full outline-none" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Pago</label>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 text-[10px] font-bold">R$</span>
                          <input type="number" inputMode="decimal" value={expense.paidValue} onChange={(e) => handleUpdateExpense(expense.id, 'paidValue', parseFloat(e.target.value) || 0)} className="bg-transparent font-bold mono text-white w-full outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                      <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-slate-500" />
                         <input type="text" value={expense.dueDate} maxLength={2} placeholder="Dia" onChange={(e) => handleUpdateExpense(expense.id, 'dueDate', e.target.value)} className="bg-transparent text-xs font-bold text-slate-400 w-10 outline-none" />
                      </div>
                      <button onClick={() => toggleStatus(expense.id)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${expense.status === 'Pago' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-amber-500 border border-amber-500/20'}`}>{expense.status.toUpperCase()}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Acumulado Pago" value={formatBRL(historyData.reduce((acc, curr) => acc + curr.pago, 0))} icon={<ArrowUpRight className="text-emerald-400" />} />
                <Card title="Média de Gasto" value={formatBRL(historyData.reduce((acc, curr) => acc + curr.pago, 0) / 12)} icon={<Activity className="text-indigo-400" />} />
                <Card title="Total Economizado" value={formatBRL(historyData.reduce((acc, curr) => acc + curr.economia, 0))} icon={<TrendingUp className="text-emerald-400" />} />
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-[300px] md:h-[400px] shadow-2xl">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} formatter={(v: number) => formatBRL(v)} />
                    <Area type="monotone" dataKey="pago" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </main>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="relative bg-slate-900 w-full max-w-lg border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-emerald-400" /> Gerenciar Categorias</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="space-y-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nova Categoria (Ex: Financiamento Casa)</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: Financiamento" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-white"
                    />
                    <div className="relative group">
                      <input 
                        type="color" 
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-11 h-11 bg-transparent cursor-pointer rounded-xl overflow-hidden border-none"
                      />
                    </div>
                    <button onClick={addCategory} className="bg-emerald-500 text-slate-950 px-5 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-all flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Categorias Ativas & Atalhos</p>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.values(categories) as CategoryInfo[]).map((cat: CategoryInfo) => (
                    <div key={cat.name} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 group hover:bg-slate-800/60 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full shadow-lg shadow-black/40" style={{ backgroundColor: cat.color }}></div>
                        <span className="font-bold text-slate-200">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => addNewExpense(cat.name)}
                          title="Lançar gasto desta categoria em todos os meses"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Lançar (Anual)
                        </button>
                        <button 
                          onClick={() => removeCategory(cat.name)}
                          className="text-slate-600 hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950/30 text-center border-t border-slate-800">
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Novos gastos e categorias são replicados automaticamente para todos os meses do ano</p>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => {
          if (activeTab === 'list') {
             addNewExpense();
          } else {
             setActiveTab('list');
          }
        }} 
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl z-40 active:scale-95 transition-all shadow-emerald-500/20"
      >
        <Plus className="w-9 h-9" />
      </button>
    </div>
  );
};

const Card = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group shadow-lg">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{title}</span>
      <div className="p-2 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div className="text-xl md:text-2xl font-bold mono text-white truncate">{value}</div>
  </div>
);

export default App;
