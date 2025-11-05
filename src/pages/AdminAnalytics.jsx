
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Calendar as CalendarIcon,
  PieChart as PieChartIcon,
  BarChart3,
  Plus,
  Euro,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, isWithinInterval, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]); // NEW STATE
  const [transactions, setTransactions] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: 'server',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
    recurring_frequency: 'monthly',
    recurring_variable: false, // NEW FIELD
    notes: ''
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setUser(currentUser);
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const loadData = async () => {
    try {
      const [usersData, expensesData, transactionsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Expense.list(),
        base44.entities.Transaction.list()
      ]);
      setUsers(usersData);
      
      // Separate actual expenses from recurring variable expense templates
      const actualExpenses = expensesData.filter(e => !e.recurring_variable || (e.recurring_variable && e.parent_expense_id));
      const parentRecurringVariableExpenses = expensesData.filter(e => e.recurring_variable && !e.parent_expense_id);
      
      setExpenses(actualExpenses); // These are the expenses to be filtered by date and used in calculations
      setRecurringExpenses(parentRecurringVariableExpenses); // These are the parent definitions for variable expenses
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      alert('Inserisci descrizione e importo');
      return;
    }

    setIsSavingExpense(true);
    try {
      await base44.entities.Expense.create({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });

      await loadData();
      setShowAddExpense(false);
      setExpenseForm({
        category: 'server',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        recurring_frequency: 'monthly',
        recurring_variable: false, // NEW FIELD
        notes: ''
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Errore nel salvataggio della spesa');
    }
    setIsSavingExpense(false);
  };

  const handleSaveRecurringVariableEntry = async (parentExpenseId, amount, month) => {
    try {
      const parent = recurringExpenses.find(e => e.id === parentExpenseId);
      if (!parent) {
        throw new Error('Parent expense not found');
      }
      await base44.entities.Expense.create({
        category: parent.category,
        description: `${parent.description} - ${month}`, // e.g., 'Server AWS - 2023-10'
        amount: parseFloat(amount),
        date: month + '-01', // Assuming month is 'YYYY-MM'
        recurring: false, // Individual entries are not recurring themselves, they are instances of a variable recurring expense
        recurring_variable: true, // This marks it as an instance of a variable recurring expense
        parent_expense_id: parentExpenseId,
        notes: `Voce mensile variabile (generata da ID parent: ${parentExpenseId})`
      });
      await loadData();
    } catch (error) {
      console.error('Error saving monthly entry:', error);
      alert('Errore nel salvataggio della voce mensile');
    }
  };

  // Filter users and expenses by date range
  const filteredUsers = users.filter(u => {
    if (!u.created_date) return false;
    const userDate = parseISO(u.created_date);
    return isWithinInterval(userDate, { start: dateRange.from, end: dateRange.to });
  });

  const filteredExpenses = expenses.filter(e => {
    if (!e.date) return false;
    const expenseDate = parseISO(e.date);
    return isWithinInterval(expenseDate, { start: dateRange.from, end: dateRange.to });
  });

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => {
    if (!t.payment_date) return false;
    const transactionDate = parseISO(t.payment_date);
    return isWithinInterval(transactionDate, { start: dateRange.from, end: dateRange.to });
  });

  // Analytics Calculations
  const activeSubscriptions = filteredUsers.filter(u => u.subscription_status === 'active').length;
  const trialUsers = filteredUsers.filter(u => u.subscription_status === 'trial').length;
  const cancelledUsers = filteredUsers.filter(u => u.subscription_status === 'cancelled').length;
  const expiredUsers = filteredUsers.filter(u => u.subscription_status === 'expired').length;

  // MRR Calculation
  const PRICE_MAP = {
    base: { monthly: 19, yearly: 15.2 },
    pro: { monthly: 29, yearly: 23.2 },
    premium: { monthly: 39, yearly: 31.2 }
  };

  const calculateMRR = () => {
    const recurringRevenue = filteredUsers
      .filter(u => u.subscription_status === 'active' && u.subscription_plan)
      .reduce((sum, u) => {
        const plan = u.subscription_plan || 'base';
        const monthlyValue = PRICE_MAP[plan]?.monthly || 19;
        return sum + monthlyValue;
      }, 0);

    return recurringRevenue;
  };

  const mrr = calculateMRR();
  const arr = mrr * 12;

  // Calculate actual revenue from transactions
  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'succeeded' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = filteredTransactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netRevenue = totalRevenue - totalRefunds;

  // Subscription breakdown by plan
  const planBreakdown = {
    base: filteredUsers.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'base').length,
    pro: filteredUsers.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'pro').length,
    premium: filteredUsers.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'premium').length
  };

  // Churn rate
  const recentCancellations = users.filter(u => {
    if (!u.updated_date) return false;
    const updateDate = parseISO(u.updated_date);
    return isWithinInterval(updateDate, { start: dateRange.from, end: dateRange.to }) &&
           (u.subscription_status === 'cancelled' || u.subscription_status === 'expired');
  }).length;
  const churnRate = activeSubscriptions > 0 ? ((recentCancellations / activeSubscriptions) * 100).toFixed(1) : 0;

  // Retention rate
  const retentionRate = activeSubscriptions > 0 ? (100 - parseFloat(churnRate)).toFixed(1) : 0;

  // Total expenses
  const monthlyRecurringExpenses = filteredExpenses
    .filter(e => e.recurring && e.recurring_frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0);

  const yearlyRecurringExpensesMonthly = filteredExpenses
    .filter(e => e.recurring && e.recurring_frequency === 'yearly')
    .reduce((sum, e) => sum + (e.amount / 12), 0);

  const totalMonthlyExpenses = monthlyRecurringExpenses + yearlyRecurringExpensesMonthly;

  // Profit
  const monthlyProfit = mrr - totalMonthlyExpenses;
  const profitMargin = mrr > 0 ? ((monthlyProfit / mrr) * 100).toFixed(1) : 0;

  // Conversion rate
  const totalTrialsStarted = filteredUsers.filter(u =>
    u.subscription_status === 'active' ||
    u.subscription_status === 'trial' ||
    u.subscription_status === 'cancelled' ||
    u.subscription_status === 'expired'
  ).length;
  const conversionRate = totalTrialsStarted > 0 ?
    ((activeSubscriptions / totalTrialsStarted) * 100).toFixed(1) : 0;

  // Monthly revenue trend
  const getMonthlyRevenueTrend = () => {
    const trends = [];
    let currentDate = startOfMonth(dateRange.from);
    while (currentDate <= dateRange.to) {
      const monthStart = currentDate;
      const monthEnd = endOfMonth(currentDate);

      const monthRevenue = transactions
        .filter(t => {
          if (!t.payment_date || t.status !== 'succeeded') return false;
          const tDate = parseISO(t.payment_date);
          return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const activeInMonth = users.filter(u => {
        if (!u.created_date) return false;
        const createdDate = parseISO(u.created_date);
        return createdDate <= monthEnd &&
               (u.subscription_status === 'active' ||
                (u.subscription_expires_at && parseISO(u.subscription_expires_at) >= monthStart));
      }).length;

      trends.push({
        month: format(currentDate, 'MMM yy', { locale: it }),
        revenue: Math.round(monthRevenue),
        users: activeInMonth
      });
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }
    return trends;
  };

  const revenueTrend = getMonthlyRevenueTrend();

  // Cash flow projection
  const getCashFlowProjection = () => {
    const projections = [];
    const currentMRR = mrr;
    const growthRate = 1.15; // 15% monthly growth assumption

    for (let i = 1; i <= 12; i++) {
      const projectedMRR = currentMRR * Math.pow(growthRate, i);
      const projectedExpenses = totalMonthlyExpenses * (1 + (i * 0.05)); // 5% monthly expense increase assumption

      projections.push({
        month: format(new Date(new Date().setMonth(new Date().getMonth() + i)), 'MMM yy', { locale: it }),
        revenue: Math.round(projectedMRR),
        expenses: Math.round(projectedExpenses),
        profit: Math.round(projectedMRR - projectedExpenses)
      });
    }
    return projections;
  };

  const cashFlowProjection = getCashFlowProjection();

  // Pie chart data
  const subscriptionPieData = [
    { name: 'Base', value: planBreakdown.base, color: '#3b82f6' },
    { name: 'Pro', value: planBreakdown.pro, color: '#26847F' },
    { name: 'Premium', value: planBreakdown.premium, color: '#a855f7' }
  ].filter(item => item.value > 0);

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value)
  }));

  const EXPENSE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  const transactionsByType = filteredTransactions
    .filter(t => t.status === 'succeeded' && t.amount > 0)
    .reduce((acc, t) => {
      const type = t.type || 'other';
      acc[type] = (acc[type] || 0) + t.amount;
      return acc;
    }, {});

  const transactionPieData = Object.entries(transactionsByType).map(([name, value]) => ({
    name: name === 'subscription_payment' ? 'Abbonamenti' :
          name === 'one_time_payment' ? 'Pagamenti Unici' :
          name === 'trial_setup' ? 'Setup Trial' : 'Altro',
    value: Math.round(value)
  }));


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Financial Dashboard</h1>
              <p className="text-gray-600">Panoramica completa delle metriche e proiezioni finanziarie</p>
            </div>

            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-auto justify-start text-left font-normal border-2">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd MMM yyyy', { locale: it })} - {format(dateRange.to, 'dd MMM yyyy', { locale: it })}
                    </>
                  ) : (
                    <span>Seleziona periodo</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Data Inizio</Label>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                      initialFocus
                      locale={it}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Data Fine</Label>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                      disabled={(date) => date < dateRange.from}
                      locale={it}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDateRange({
                          from: subMonths(new Date(), 1),
                          to: new Date()
                        });
                        setShowDatePicker(false);
                      }}
                    >
                      Ultimo Mese
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDateRange({
                          from: subMonths(new Date(), 3),
                          to: new Date()
                        });
                        setShowDatePicker(false);
                      }}
                    >
                      Ultimi 3 Mesi
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDateRange({
                          from: subMonths(new Date(), 12),
                          to: new Date()
                        });
                        setShowDatePicker(false);
                      }}
                    >
                      Ultimo Anno
                    </Button>
                  </div>
                  <Button
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                    onClick={() => setShowDatePicker(false)}
                  >
                    Applica Filtro
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Entrate Totali (Periodo)</p>
                  <p className="text-3xl font-bold text-gray-900">€{totalRevenue.toLocaleString('it-IT')}</p>
                  <p className="text-xs text-gray-500 mt-1">Netto: €{netRevenue.toLocaleString('it-IT')}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">MRR (Ricorrente Mensile)</p>
                  <p className="text-3xl font-bold text-gray-900">€{mrr.toLocaleString('it-IT')}</p>
                  <p className="text-xs text-gray-500 mt-1">ARR: €{arr.toLocaleString('it-IT')}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Retention Rate</p>
                  <p className="text-3xl font-bold text-green-600">{retentionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Churn: {churnRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Profitto Mensile</p>
                  <p className={`text-3xl font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{monthlyProfit.toLocaleString('it-IT')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Margine: {profitMargin}%</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${monthlyProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-6 h-6 ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Finanza</TabsTrigger>
            <TabsTrigger value="subscriptions">Abbonamenti</TabsTrigger>
            <TabsTrigger value="projections">Proiezioni</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Funnel di Conversione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-blue-100 rounded-full h-12 flex items-center justify-between px-6">
                      <span className="font-semibold text-blue-900">Utenti Registrati</span>
                      <span className="font-bold text-blue-900">{filteredUsers.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-8">
                    <div className="flex-1 bg-purple-100 rounded-full h-12 flex items-center justify-between px-6">
                      <span className="font-semibold text-purple-900">Trial Attivi</span>
                      <span className="font-bold text-purple-900">{trialUsers}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-16">
                    <div className="flex-1 bg-green-100 rounded-full h-12 flex items-center justify-between px-6">
                      <span className="font-semibold text-green-900">Abbonati Paganti</span>
                      <span className="font-bold text-green-900">{activeSubscriptions}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-center text-green-900 font-bold text-lg">
                      Tasso di Conversione: {conversionRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Andamento Entrate Reali da Transazioni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#26847F" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#26847F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#26847F"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Entrate (€)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Breakdown Transazioni per Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    {transactionPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={transactionPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {transactionPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#26847F', '#3b82f6', '#a855f7'][index % 3]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `€${value}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Nessuna transazione nel periodo</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Transazioni Recenti</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {filteredTransactions
                        .filter(t => t.status === 'succeeded')
                        .slice(0, 8)
                        .map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">{transaction.description}</p>
                              <p className="text-xs text-gray-500">
                                {format(parseISO(transaction.payment_date), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                            <p className="font-bold text-green-600">+€{transaction.amount}</p>
                          </div>
                        ))}
                    </div>
                    {filteredTransactions.filter(t => t.status === 'succeeded').length === 0 && (
                      <p className="text-center text-gray-500 py-4">Nessuna transazione riuscita nel periodo</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowAddExpense(true)}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Spesa
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 mb-2">Entrate Mensili</p>
                  <p className="text-3xl font-bold text-green-600">€{mrr.toLocaleString('it-IT')}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 mb-2">Spese Mensili</p>
                  <p className="text-3xl font-bold text-red-600">€{totalMonthlyExpenses.toLocaleString('it-IT')}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 mb-2">Profitto Netto</p>
                  <p className={`text-3xl font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{monthlyProfit.toLocaleString('it-IT')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Spese per Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {expensePieData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expensePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `€${value}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Nessuna spesa registrata</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Spese Recenti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredExpenses.slice(0, 10).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{expense.description}</p>
                          <p className="text-xs text-gray-500">
                            {expense.category} • {format(new Date(expense.date), 'dd/MM/yyyy')}
                            {(expense.recurring && expense.recurring_frequency) && ` • Ricorrente (${expense.recurring_frequency})`}
                            {(expense.recurring_variable && !expense.recurring && expense.parent_expense_id) && ` • Variabile`}
                          </p>
                        </div>
                        <p className="font-bold text-red-600">-€{expense.amount}</p>
                      </div>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <p className="text-center text-gray-500 py-4">Nessuna spesa nel periodo</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Distribuzione Piani</CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionPieData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subscriptionPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {subscriptionPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Nessun abbonamento attivo</p>
                  )}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm font-medium">Base (€19/mese)</span>
                      <span className="font-bold">{planBreakdown.base} utenti</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-teal-50 rounded">
                      <span className="text-sm font-medium">Pro (€29/mese)</span>
                      <span className="font-bold">{planBreakdown.pro} utenti</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm font-medium">Premium (€39/mese)</span>
                      <span className="font-bold">{planBreakdown.premium} utenti</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Stati Abbonamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">Attivi</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{activeSubscriptions}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">In Trial</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{trialUsers}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-orange-900">Cancellati</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{cancelledUsers}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Scaduti</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-600">{expiredUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Metriche Chiave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Conversion Rate</p>
                    <p className="text-3xl font-bold text-blue-900">{conversionRate}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-1">Retention Rate</p>
                    <p className="text-3xl font-bold text-green-900">{retentionRate}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 mb-1">Churn Rate</p>
                    <p className="text-3xl font-bold text-red-900">{churnRate}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">ARPU</p>
                    <p className="text-3xl font-bold text-purple-900">
                      €{activeSubscriptions > 0 ? (mrr / activeSubscriptions).toFixed(0) : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Proiezione Cash Flow (12 Mesi)</CardTitle>
                <p className="text-sm text-gray-500">Basato su crescita 15% mensile e aumento spese 5%</p>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowProjection}>
                      <defs>
                        <linearGradient id="colorRevProj" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpProj" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorRevProj)"
                        name="Entrate (€)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorExpProj)"
                        name="Spese (€)"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#26847F"
                        strokeWidth={3}
                        name="Profitto (€)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <CardContent className="p-6">
                  <p className="text-sm text-green-700 mb-2">MRR Proiettato (6 mesi)</p>
                  <p className="text-4xl font-bold text-green-900">
                    €{cashFlowProjection[5]?.revenue.toLocaleString('it-IT')}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    +{((cashFlowProjection[5]?.revenue / mrr - 1) * 100).toFixed(0)}% crescita
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardContent className="p-6">
                  <p className="text-sm text-blue-700 mb-2">MRR Proiettato (12 mesi)</p>
                  <p className="text-4xl font-bold text-blue-900">
                    €{cashFlowProjection[11]?.revenue.toLocaleString('it-IT')}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    +{((cashFlowProjection[11]?.revenue / mrr - 1) * 100).toFixed(0)}% crescita
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <CardContent className="p-6">
                  <p className="text-sm text-purple-700 mb-2">Profitto Proiettato (12 mesi)</p>
                  <p className="text-4xl font-bold text-purple-900">
                    €{cashFlowProjection[11]?.profit.toLocaleString('it-IT')}
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    Break-even: {monthlyProfit < 0 ? 'Mese ' + Math.ceil(Math.abs(monthlyProfit) / (cashFlowProjection[11]?.profit / 12)) : 'Raggiunto'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"> {/* MODIFIED */}
          <DialogHeader>
            <DialogTitle>Aggiungi Nuova Spesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Categoria</Label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                className="w-full h-10 px-3 border rounded-lg mt-1"
              >
                <option value="server">Server / Hosting</option>
                <option value="marketing">Marketing</option>
                <option value="staff">Personale</option>
                <option value="tools">Tool / Software</option>
                <option value="infrastructure">Infrastruttura</option>
                <option value="other">Altro</option>
              </select>
            </div>

            <div>
              <Label>Descrizione</Label>
              <Input
                placeholder="Es: Server AWS"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Importo (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="100.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={expenseForm.recurring}
                onChange={(e) => setExpenseForm({...expenseForm, recurring: e.target.checked, recurring_variable: false})} {/* MODIFIED: mutually exclusive */}
                className="w-4 h-4"
              />
              <Label htmlFor="recurring">Spesa Ricorrente Fissa</Label> {/* MODIFIED LABEL */}
            </div>

            {expenseForm.recurring && (
              <div>
                <Label>Frequenza</Label>
                <select
                  value={expenseForm.recurring_frequency}
                  onChange={(e) => setExpenseForm({...expenseForm, recurring_frequency: e.target.value})}
                  className="w-full h-10 px-3 border rounded-lg mt-1"
                >
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2"> {/* NEW BLOCK */}
              <input
                type="checkbox"
                id="recurringVariable"
                checked={expenseForm.recurring_variable}
                onChange={(e) => setExpenseForm({...expenseForm, recurring_variable: e.target.checked, recurring: false})} {/* NEW: mutually exclusive */}
                className="w-4 h-4"
              />
              <Label htmlFor="recurringVariable">Spesa Ricorrente con Importo Variabile</Label>
            </div>

            {expenseForm.recurring_variable && ( {/* NEW BLOCK */}
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                <p className="font-semibold mb-1">ℹ️ Spesa Ricorrente Variabile</p>
                <p>Verrà creata una voce che potrai riutilizzare ogni mese inserendo l'importo diverso.</p>
              </div>
            )}

            <div>
              <Label>Note (opzionale)</Label>
              <Input
                placeholder="Note aggiuntive..."
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveExpense}
                disabled={isSavingExpense}
                className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                {isSavingExpense ? 'Salvataggio...' : 'Salva Spesa'}
              </Button>
              <Button
                onClick={() => setShowAddExpense(false)}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

