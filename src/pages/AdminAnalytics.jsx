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
  Calendar,
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
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: 'server',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
    recurring_frequency: 'monthly',
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
      const [usersData, expensesData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Expense.list()
      ]);
      setUsers(usersData);
      setExpenses(expensesData);
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
        notes: ''
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Errore nel salvataggio della spesa');
    }
    setIsSavingExpense(false);
  };

  // Analytics Calculations
  const activeSubscriptions = users.filter(u => u.subscription_status === 'active').length;
  const trialUsers = users.filter(u => u.subscription_status === 'trial').length;
  const cancelledUsers = users.filter(u => u.subscription_status === 'cancelled').length;
  const expiredUsers = users.filter(u => u.subscription_status === 'expired').length;
  
  // MRR Calculation
  const PRICE_MAP = {
    base: { monthly: 19, yearly: 15.2 },
    pro: { monthly: 29, yearly: 23.2 },
    premium: { monthly: 39, yearly: 31.2 }
  };

  const calculateMRR = () => {
    return users
      .filter(u => u.subscription_status === 'active')
      .reduce((sum, u) => {
        const plan = u.subscription_plan || 'base';
        // Assume monthly for MRR calculation
        return sum + (PRICE_MAP[plan]?.monthly || 19);
      }, 0);
  };

  const mrr = calculateMRR();
  const arr = mrr * 12;

  // Subscription breakdown by plan
  const planBreakdown = {
    base: users.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'base').length,
    pro: users.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'pro').length,
    premium: users.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'premium').length
  };

  // Churn rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCancellations = users.filter(u => {
    if (!u.updated_date) return false;
    return new Date(u.updated_date) >= thirtyDaysAgo && 
           (u.subscription_status === 'cancelled' || u.subscription_status === 'expired');
  }).length;
  const churnRate = activeSubscriptions > 0 ? ((recentCancellations / activeSubscriptions) * 100).toFixed(1) : 0;

  // Retention rate
  const retentionRate = activeSubscriptions > 0 ? (100 - parseFloat(churnRate)).toFixed(1) : 0;

  // Total expenses (recurring monthly + one-time)
  const monthlyRecurringExpenses = expenses
    .filter(e => e.recurring && e.recurring_frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0);

  const yearlyRecurringExpensesMonthly = expenses
    .filter(e => e.recurring && e.recurring_frequency === 'yearly')
    .reduce((sum, e) => sum + (e.amount / 12), 0);

  const totalMonthlyExpenses = monthlyRecurringExpenses + yearlyRecurringExpensesMonthly;

  // Profit
  const monthlyProfit = mrr - totalMonthlyExpenses;
  const profitMargin = mrr > 0 ? ((monthlyProfit / mrr) * 100).toFixed(1) : 0;

  // Conversion rate (from trial to paid)
  const totalTrialsStarted = users.filter(u => 
    u.subscription_status === 'active' || 
    u.subscription_status === 'trial' ||
    u.subscription_status === 'cancelled' ||
    u.subscription_status === 'expired'
  ).length;
  const conversionRate = totalTrialsStarted > 0 ? 
    ((activeSubscriptions / totalTrialsStarted) * 100).toFixed(1) : 0;

  // Monthly revenue trend (last 6 months)
  const getMonthlyRevenueTrend = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Count active subscriptions in that month
      const activeInMonth = users.filter(u => {
        const createdDate = new Date(u.created_date);
        return createdDate <= monthEnd && 
               (u.subscription_status === 'active' || 
                (u.subscription_expires_at && new Date(u.subscription_expires_at) >= monthStart));
      }).length;

      months.push({
        month: format(date, 'MMM yy'),
        revenue: activeInMonth * 30, // Rough estimate
        users: activeInMonth
      });
    }
    return months;
  };

  const revenueTrend = getMonthlyRevenueTrend();

  // Cash flow projection (next 12 months)
  const getCashFlowProjection = () => {
    const projections = [];
    const currentMRR = mrr;
    const growthRate = 1.15; // Assume 15% monthly growth
    
    for (let i = 1; i <= 12; i++) {
      const projectedMRR = currentMRR * Math.pow(growthRate, i);
      const projectedExpenses = totalMonthlyExpenses * (1 + (i * 0.05)); // Expenses grow 5% per month
      
      projections.push({
        month: format(new Date(new Date().setMonth(new Date().getMonth() + i)), 'MMM yy'),
        revenue: Math.round(projectedMRR),
        expenses: Math.round(projectedExpenses),
        profit: Math.round(projectedMRR - projectedExpenses)
      });
    }
    return projections;
  };

  const cashFlowProjection = getCashFlowProjection();

  // Pie chart data for subscriptions
  const subscriptionPieData = [
    { name: 'Base', value: planBreakdown.base, color: '#3b82f6' },
    { name: 'Pro', value: planBreakdown.pro, color: '#26847F' },
    { name: 'Premium', value: planBreakdown.premium, color: '#a855f7' }
  ].filter(item => item.value > 0);

  // Expense breakdown by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value)
  }));

  const EXPENSE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Financial Dashboard</h1>
          <p className="text-gray-600">Panoramica completa delle metriche e proiezioni finanziarie</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">MRR (Monthly Recurring Revenue)</p>
                  <p className="text-3xl font-bold text-gray-900">€{mrr.toLocaleString('it-IT')}</p>
                  <p className="text-xs text-gray-500 mt-1">ARR: €{arr.toLocaleString('it-IT')}</p>
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
                  <p className="text-sm text-gray-500 mb-1">Abbonamenti Attivi</p>
                  <p className="text-3xl font-bold text-gray-900">{activeSubscriptions}</p>
                  <p className="text-xs text-gray-500 mt-1">Trial: {trialUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Finanza</TabsTrigger>
            <TabsTrigger value="subscriptions">Abbonamenti</TabsTrigger>
            <TabsTrigger value="projections">Proiezioni</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Conversion Funnel */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Funnel di Conversione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-blue-100 rounded-full h-12 flex items-center justify-between px-6">
                      <span className="font-semibold text-blue-900">Utenti Registrati</span>
                      <span className="font-bold text-blue-900">{users.length}</span>
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

            {/* Revenue Trend */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Andamento Entrate (Ultimi 6 Mesi)</CardTitle>
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
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial" className="space-y-6">
            {/* Add Expense Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowAddExpense(true)}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Spesa
              </Button>
            </div>

            {/* Financial Overview */}
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

            {/* Expense Breakdown */}
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
                    {expenses.slice(0, 10).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{expense.description}</p>
                          <p className="text-xs text-gray-500">
                            {expense.category} • {format(new Date(expense.date), 'dd/MM/yyyy')}
                            {expense.recurring && ` • Ricorrente (${expense.recurring_frequency})`}
                          </p>
                        </div>
                        <p className="font-bold text-red-600">-€{expense.amount}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SUBSCRIPTIONS TAB */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Distribution */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Distribuzione Piani</CardTitle>
                </CardHeader>
                <CardContent>
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

              {/* Subscription Status */}
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

            {/* Key Metrics */}
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

          {/* PROJECTIONS TAB */}
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

            {/* Future Projections Cards */}
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

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md">
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
                onChange={(e) => setExpenseForm({...expenseForm, recurring: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="recurring">Spesa Ricorrente</Label>
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