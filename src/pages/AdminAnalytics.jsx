
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // NEW STATE for managing variable expenses dialog
  const [showManageRecurringVariableExpenses, setShowManageRecurringVariableExpenses] = useState(false);
  const [currentVariableExpenseEntry, setCurrentVariableExpenseEntry] = useState({
    parent_id: null,
    month: format(new Date(), 'yyyy-MM'),
    amount: ''
  });

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
    recurring_variable: false,
    notes: ''
  });

  // NEW STATE for the analytics summary
  const [stats, setStats] = useState({
    totalUsers: 0, trialUsers: 0, activeUsers: 0, paidUsers: 0,
    quizCompletedUsers: 0, checkoutStartedUsers: 0, landingOfferPurchases: 0,
    trialPurchases: 0, // NEW: separato per riferimento
    totalPurchases: 0, // NEW: totale combinato
    unifiedConversionRate: 0, // NEW: conversione unificata
    totalRevenue: 0, mrr: 0, retentionRate: 0,
    baseUsers: 0, proUsers: 0, premiumUsers: 0,
    totalExpenses: 0, netProfit: 0, monthlyExpenses: 0
  });

  // NEW STATE for projection growth rate
  const [projectionGrowthRate, setProjectionGrowthRate] = useState(15);

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
      await loadData(); // This loads ALL users, expenses, transactions initially
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    // setIsLoading(false); // This will be set to false after loadAnalytics completes
  };

  const loadData = async () => {
    try {
      // Fetch ALL data, regardless of date range for initial full lists
      const [usersData, expensesData, transactionsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Expense.list(), // Fetch all expenses
        base44.entities.Transaction.list()
      ]);
      setUsers(usersData);
      setTransactions(transactionsData);

      // Store ALL expenses in the `expenses` state for general use and filtering
      setExpenses(expensesData);

      // Filter out parent recurring variable expenses for the specific `recurringExpenses` state
      const parentRecurringVariableExpenses = expensesData.filter(e => e.recurring_variable && !e.parent_expense_id);
      setRecurringExpenses(parentRecurringVariableExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // NEW useEffect block for specific analytics calculations from the outline
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true); // Indicate loading for analytics as well

      try {
        // Fetch users and transactions - the outline implies refetching or using the "all" lists
        // and then filtering them client-side for the current dateRange
        const allUsers = await base44.entities.User.list();
        const allTransactions = await base44.entities.Transaction.list();

        // Explicitly server-side filter expenses for this stats calculation, as per outline
        const fetchedExpenses = await base44.entities.Expense.filter({
          date: { $gte: dateRange.from.toISOString(), $lte: dateRange.to.toISOString() }
        });

        // Filter users and transactions based on dateRange client-side
        const currentUsersForStats = allUsers.filter(u => {
          if (!u.created_date) return false;
          const userDate = parseISO(u.created_date);
          return isWithinInterval(userDate, { start: dateRange.from, end: dateRange.to });
        });

        const currentTransactionsForStats = allTransactions.filter(t => {
            if (!t.payment_date) return false;
            const transactionDate = parseISO(t.payment_date);
            return isWithinInterval(transactionDate, { start: dateRange.from, end: dateRange.to });
        });

        const totalUsers = currentUsersForStats.length;
        const trialUsers = currentUsersForStats.filter(u => u.subscription_status === 'trial' || u.subscription_status === 'pending_trial').length;
        const activeUsers = currentUsersForStats.filter(u => u.subscription_status === 'active').length;
        const paidUsers = activeUsers; // Assuming paid users are active subscribers

        // UNIFIED FUNNEL STATS - Combina Trial Setup + Landing Checkout
        const quizCompletedUsers = currentUsersForStats.filter(u => u.quiz_completed === true).length;
        const checkoutStartedUsers = currentUsersForStats.filter(u => u.billing_name && u.billing_name.length > 0).length;
        
        // Acquisti totali: somma trial subscriptions + landing offer purchases
        const trialPurchases = currentUsersForStats.filter(u => u.purchased_plan_type === 'subscription').length;
        const landingOfferPurchases = currentUsersForStats.filter(u => u.purchased_landing_offer === true).length;
        const totalPurchases = trialPurchases + landingOfferPurchases;

        // Conversione unificata Quiz → Acquisto (qualsiasi tipo)
        const unifiedConversionRate = quizCompletedUsers > 0 
          ? ((totalPurchases / quizCompletedUsers) * 100).toFixed(1) 
          : 0;

        const totalRevenue = currentTransactionsForStats
          .filter(t => t.status === 'succeeded' && t.amount > 0) // Filtering out potential negative amounts for refunds
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = fetchedExpenses.reduce((sum, e) => sum + e.amount, 0); // Using the server-filtered expenses
        const netProfit = totalRevenue - totalExpenses;

        const baseUsers = currentUsersForStats.filter(u => u.subscription_plan === 'base' && u.subscription_status === 'active').length;
        const proUsers = currentUsersForStats.filter(u => u.subscription_plan === 'pro' && u.subscription_status === 'active').length;
        const premiumUsers = currentUsersForStats.filter(u => u.subscription_plan === 'premium' && u.subscription_status === 'active').length;

        // MRR: Monthly Recurring Revenue. Outline calculates from 'monthly' billing_period transactions.
        const mrr = currentTransactionsForStats
          .filter(t => t.status === 'succeeded' && t.type !== 'refund' && t.billing_period === 'monthly')
          .reduce((sum, t) => sum + t.amount, 0);

        // Monthly expenses: Outline filters for recurring=true and monthly frequency from the already fetched (date-filtered) expenses.
        const monthlyExpenses = fetchedExpenses
          .filter(e => e.recurring === true && e.recurring_frequency === 'monthly')
          .reduce((sum, e) => sum + e.amount, 0);

        // Retention rate: Outline calculates (activeUsers / totalUsers) * 100 based on the currentUsersForStats.
        const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

        setStats({
          totalUsers,
          trialUsers,
          activeUsers,
          paidUsers,
          quizCompletedUsers,
          checkoutStartedUsers,
          landingOfferPurchases,
          trialPurchases, // NEW: separato per riferimento
          totalPurchases, // NEW: totale combinato
          unifiedConversionRate, // NEW: conversione unificata
          totalRevenue,
          mrr,
          retentionRate,
          baseUsers,
          proUsers,
          premiumUsers,
          totalExpenses,
          netProfit,
          monthlyExpenses
        });

      } catch (error) {
        console.error('Error loading analytics:', error);
      }
      setIsLoading(false); // Set to false after this analytics load
    };

    if (dateRange.from && dateRange.to) { // Only run if date range is defined
        loadAnalytics();
    }
  }, [dateRange]); // Rerun when date range changes

  const handleSaveExpense = async () => {
    // If it's a recurring variable expense template, amount is not required for the template itself
    if (!expenseForm.recurring_variable && (!expenseForm.description || !expenseForm.amount)) {
      alert('Inserisci descrizione e importo');
      return;
    }
    // If it's a recurring variable expense template, only description is strictly needed
    if (expenseForm.recurring_variable && !expenseForm.description) {
      alert('Inserisci descrizione');
      return;
    }

    setIsSavingExpense(true);
    try {
      const payload = {
        ...expenseForm,
        // Amount is 0 for variable expense templates, actual amounts are added as child entries
        amount: expenseForm.recurring_variable ? 0 : parseFloat(expenseForm.amount)
      };

      await base44.entities.Expense.create(payload);

      await loadData(); // Reload all general data
      setShowAddExpense(false);
      setExpenseForm({
        category: 'server',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        recurring_frequency: 'monthly',
        recurring_variable: false,
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
        description: `${parent.description} - ${format(parseISO(month + '-01'), 'MMMM yyyy', { locale: it })}`, // e.g., 'Server AWS - Ottobre 2023'
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

  // NEW function to add a variable expense entry from the management dialog
  const handleAddVariableExpenseEntry = async (parentExpenseId) => {
    const { month, amount } = currentVariableExpenseEntry;
    if (currentVariableExpenseEntry.parent_id !== parentExpenseId || !month || !amount || parseFloat(amount) <= 0) {
      alert('Seleziona un mese e inserisci un importo valido.');
      return;
    }

    setIsSavingExpense(true);
    try {
      await handleSaveRecurringVariableEntry(parentExpenseId, amount, month);
      // Reset the current entry form after successful save
      setCurrentVariableExpenseEntry({ parent_id: null, month: format(new Date(), 'yyyy-MM'), amount: '' });
    } catch (error) {
      console.error('Error adding variable expense entry:', error);
      alert('Errore nell\'aggiunta della voce di spesa variabile.');
    }
    setIsSavingExpense(false);
  };

  // Filter users and expenses by date range (these use the *all* states)
  const filteredUsers = users.filter(u => {
    if (!u.created_date) return false;
    const userDate = parseISO(u.created_date);
    return isWithinInterval(userDate, { start: dateRange.from, end: dateRange.to });
  });

  const filteredExpenses = expenses.filter(e => {
    if (!e.date) return false;
    const expenseDate = parseISO(e.date);
    // Only include actual expenses (not parent templates for variable expenses)
    return isWithinInterval(expenseDate, { start: dateRange.from, end: dateRange.to }) && (!e.recurring_variable || e.parent_expense_id);
  });

  // Filter transactions by date range (these use the *all* states)
  const filteredTransactions = transactions.filter(t => {
    if (!t.payment_date) return false;
    const transactionDate = parseISO(t.payment_date);
    return isWithinInterval(transactionDate, { start: dateRange.from, end: dateRange.to });
  });

  // Analytics Calculations (using the existing filtered data where applicable, separate from `stats`)
  const activeSubscriptions = filteredUsers.filter(u => u.subscription_status === 'active').length;
  const trialUsers = filteredUsers.filter(u => u.subscription_status === 'trial').length;
  const cancelledUsers = filteredUsers.filter(u => u.subscription_status === 'cancelled').length;
  const expiredUsers = filteredUsers.filter(u => u.subscription_status === 'expired').length;

  // MRR Calculation (Existing, based on price map)
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

  const mrrFromPriceMap = calculateMRR();
  const arr = mrrFromPriceMap * 12;

  // Calculate actual revenue from transactions
  const totalRevenueExisting = filteredTransactions
    .filter(t => t.status === 'succeeded' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = filteredTransactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netRevenue = totalRevenueExisting - totalRefunds;

  // Subscription breakdown by plan
  const planBreakdown = {
    base: filteredUsers.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'base').length,
    pro: filteredUsers.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'pro').length,
    premium: filteredUsers.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'premium').length
  };

  // Churn rate
  const recentCancellations = users.filter(u => { // Uses 'users' (all users)
    if (!u.updated_date) return false;
    const updateDate = parseISO(u.updated_date);
    return isWithinInterval(updateDate, { start: dateRange.from, end: dateRange.to }) &&
           (u.subscription_status === 'cancelled' || u.subscription_status === 'expired');
  }).length;
  const churnRate = activeSubscriptions > 0 ? ((recentCancellations / activeSubscriptions) * 100).toFixed(1) : 0;

  // Retention rate (Existing, derived from churn)
  const retentionRateExisting = activeSubscriptions > 0 ? (100 - parseFloat(churnRate)).toFixed(1) : 0;

  // Total expenses (Existing)
  const monthlyRecurringExpenses = filteredExpenses
    .filter(e => e.recurring && e.recurring_frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0);

  const yearlyRecurringExpensesMonthly = filteredExpenses
    .filter(e => e.recurring && e.recurring_frequency === 'yearly')
    .reduce((sum, e) => sum + (e.amount / 12), 0);

  const totalMonthlyExpenses = monthlyRecurringExpenses + yearlyRecurringExpensesMonthly;

  // Calculate expenses by category for the Cash Flow Projection (monthly recurring fixed expenses)
  const monthlyRecurringExpensesForProjectionByCategory = filteredExpenses
    .filter(e => e.recurring && e.recurring_frequency === 'monthly')
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

  const yearlyRecurringExpensesForProjectionByCategory = filteredExpenses
    .filter(e => e.recurring && e.recurring_frequency === 'yearly')
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + (expense.amount / 12);
      return acc;
    }, {});

  // Merge yearly into monthly for the projection
  const combinedMonthlyExpensesForProjectionByCategory = { ...monthlyRecurringExpensesForProjectionByCategory };
  Object.keys(yearlyRecurringExpensesForProjectionByCategory).forEach(cat => {
    combinedMonthlyExpensesForProjectionByCategory[cat] = (combinedMonthlyExpensesForProjectionByCategory[cat] || 0) + yearlyRecurringExpensesForProjectionByCategory[cat];
  });


  // Profit (Existing)
  const monthlyProfit = mrrFromPriceMap - totalMonthlyExpenses;
  const profitMargin = mrrFromPriceMap > 0 ? ((monthlyProfit / mrrFromPriceMap) * 100).toFixed(1) : 0;

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

      const monthRevenue = transactions // Uses ALL transactions
        .filter(t => {
          if (!t.payment_date || t.status !== 'succeeded') return false;
          const tDate = parseISO(t.payment_date);
          return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const activeInMonth = users.filter(u => { // Uses ALL users
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
    const currentMRR = mrrFromPriceMap;
    const growthRate = 1 + (projectionGrowthRate / 100);

    for (let i = 1; i <= 12; i++) {
      const projectedMRR = currentMRR * Math.pow(growthRate, i);
      
      const projectionMonth = {
        month: format(new Date(new Date().setMonth(new Date().getMonth() + i)), 'MMM yy', { locale: it }),
        revenue: Math.round(projectedMRR),
        profit: Math.round(projectedMRR - totalMonthlyExpenses),
        // Aggiungi ogni categoria di spesa
        expense_server: Math.round(combinedMonthlyExpensesForProjectionByCategory['server'] || 0),
        expense_marketing: Math.round(combinedMonthlyExpensesForProjectionByCategory['marketing'] || 0),
        expense_staff: Math.round(combinedMonthlyExpensesForProjectionByCategory['staff'] || 0),
        expense_tools: Math.round(combinedMonthlyExpensesForProjectionByCategory['tools'] || 0),
        expense_infrastructure: Math.round(combinedMonthlyExpensesForProjectionByCategory['infrastructure'] || 0),
        expense_other: Math.round(combinedMonthlyExpensesForProjectionByCategory['other'] || 0)
      };
      
      projections.push(projectionMonth);
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

  // This `expensesByCategory` is for the "Spese per Categoria" pie chart, reflecting all filtered expenses.
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
        {/* Header */}
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Entrate Totali (Periodo)</p>
                  <p className="text-3xl font-bold text-gray-900">€{totalRevenueExisting.toLocaleString('it-IT')}</p>
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
                  <p className="text-3xl font-bold text-gray-900">€{mrrFromPriceMap.toLocaleString('it-IT')}</p>
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
                  <p className="text-3xl font-bold text-green-600">{retentionRateExisting}%</p>
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

        {/* OVERVIEW SECTION */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          
          {/* Funnel Unificato di Conversione */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--brand-primary)]" />
                Funnel di Conversione Unificato (Tutti i Funnel)
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Metriche aggregate di Trial Setup + Landing Checkout attraverso tutti i canali e location
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-indigo-100 rounded-full h-14 flex items-center justify-between px-6">
                    <span className="font-semibold text-indigo-900">Quiz Completati (Totale)</span>
                    <span className="font-bold text-indigo-900 text-xl">{stats.quizCompletedUsers}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-8">
                  <div className="flex-1 bg-cyan-100 rounded-full h-14 flex items-center justify-between px-6">
                    <span className="font-semibold text-cyan-900">Checkout Iniziati (Totale)</span>
                    <span className="font-bold text-cyan-900 text-xl">{stats.checkoutStartedUsers}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-16">
                  <div className="flex-1 bg-emerald-100 rounded-full h-14 flex items-center justify-between px-6">
                    <span className="font-semibold text-emerald-900">Acquisti Totali (Trial + Landing)</span>
                    <span className="font-bold text-emerald-900 text-xl">{stats.totalPurchases}</span>
                  </div>
                </div>
                
                {/* Breakdown acquisti per tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-20">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Trial Subscriptions</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.trialPurchases}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">Landing Offer (€67)</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.landingOfferPurchases}</p>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 mb-1">Tasso di Conversione Unificato</p>
                      <p className="text-xs text-gray-600">Quiz Completati → Acquisti (Qualsiasi Tipo)</p>
                    </div>
                    <p className="text-5xl font-black text-green-900">{stats.unifiedConversionRate}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Breakdown per Tipo (opzionale - per dettagli) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Breakdown: Trial Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Quiz → Trial Attivi</span>
                    <span className="font-bold text-blue-900">{stats.trialUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">Trial → Abbonati Paganti</span>
                    <span className="font-bold text-green-900">{stats.trialPurchases}</span>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Conversione Trial</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.quizCompletedUsers > 0 
                        ? ((stats.trialPurchases / stats.quizCompletedUsers) * 100).toFixed(1) 
                        : '0.0'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Breakdown: Landing Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                    <span className="font-medium text-cyan-900">Quiz → Checkout Iniziati</span>
                    <span className="font-bold text-cyan-900">{stats.checkoutStartedUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-purple-900">Checkout → Acquisti Landing</span>
                    <span className="font-bold text-purple-900">{stats.landingOfferPurchases}</span>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg border border-cyan-200">
                    <p className="text-xs text-gray-600 mb-1">Conversione Landing</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.quizCompletedUsers > 0 
                        ? ((stats.landingOfferPurchases / stats.quizCompletedUsers) * 100).toFixed(1) 
                        : '0.0'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Andamento Entrate Reali da Transazioni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={revenueTrend}
                    barGap={-55}
                    margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      tickLine={false}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      fill="#10b981" 
                      name="Entrate (€)"
                      radius={[6, 6, 0, 0]}
                      barSize={70}
                    />
                  </BarChart>
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
        </div>

        {/* FINANCIAL SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Finanza</h2>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowManageRecurringVariableExpenses(true)}
                variant="outline"
              >
                <Zap className="w-4 h-4 mr-2" />
                Gestisci Spese Variabili
              </Button>
              <Button
                onClick={() => setShowAddExpense(true)}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Spesa
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-2">Entrate Mensili</p>
                <p className="text-3xl font-bold text-green-600">€{mrrFromPriceMap.toLocaleString('it-IT')}</p>
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
                <div className="h-64">
                  {expensePieData.length > 0 ? (
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
                  ) : (
                    <p className="text-center text-gray-500 py-8">Nessuna spesa registrata</p>
                  )}
                </div>
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
        </div>

        {/* SUBSCRIPTIONS SECTION */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Abbonamenti</h2>
          
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
                  <p className="text-3xl font-bold text-green-900">{retentionRateExisting}%</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 mb-1">Churn Rate</p>
                  <p className="text-3xl font-bold text-red-900">{churnRate}%</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700 mb-1">ARPU</p>
                  <p className="text-3xl font-bold text-purple-900">
                    €{activeSubscriptions > 0 ? (mrrFromPriceMap / activeSubscriptions).toFixed(0) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PROJECTIONS SECTION */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Proiezioni</h2>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="growth-rate" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Tasso di Crescita Mensile (%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="growth-rate"
                      type="number"
                      step="0.1"
                      value={projectionGrowthRate}
                      onChange={(e) => setProjectionGrowthRate(parseFloat(e.target.value) || 0)}
                      className="w-32 h-12 text-lg font-bold"
                      min="0"
                      max="100"
                    />
                    <span className="text-2xl font-bold text-gray-600">%</span>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Crescita Annuale Equivalente</p>
                  <p className="text-2xl font-black text-blue-900">
                    {(Math.pow(1 + projectionGrowthRate / 100, 12) - 1) * 100 > 0 
                      ? `+${((Math.pow(1 + projectionGrowthRate / 100, 12) - 1) * 100).toFixed(1)}%` 
                      : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Proiezione Cash Flow (12 Mesi)</CardTitle>
              <p className="text-sm text-gray-500">Basato su crescita {projectionGrowthRate}% mensile delle entrate e spese mensili fisse</p>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={cashFlowProjection}
                    margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      tickLine={false}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Legend />
                    
                    {/* Entrate - barra larga di sfondo */}
                    <Bar 
                      dataKey="revenue" 
                      fill="#10b981" 
                      name="Entrate (€)"
                      radius={[6, 6, 0, 0]}
                      barSize={80}
                    />
                    
                    {/* Spese per categoria - sovrapposte al centro, più strette */}
                    <Bar 
                      dataKey="expense_server" 
                      fill="#ef4444" 
                      name="Server"
                      stackId="expenses"
                      barSize={35}
                    />
                    <Bar 
                      dataKey="expense_marketing" 
                      fill="#f59e0b" 
                      name="Marketing"
                      stackId="expenses"
                      barSize={35}
                    />
                    <Bar 
                      dataKey="expense_staff" 
                      fill="#8b5cf6" 
                      name="Personale"
                      stackId="expenses"
                      barSize={35}
                    />
                    <Bar 
                      dataKey="expense_tools" 
                      fill="#3b82f6" 
                      name="Tool"
                      stackId="expenses"
                      barSize={35}
                    />
                    <Bar 
                      dataKey="expense_infrastructure" 
                      fill="#ec4899" 
                      name="Infrastruttura"
                      stackId="expenses"
                      barSize={35}
                    />
                    <Bar 
                      dataKey="expense_other" 
                      fill="#6b7280" 
                      name="Altro"
                      stackId="expenses"
                      barSize={35}
                    />
                  </BarChart>
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
                  +{((cashFlowProjection[5]?.revenue / mrrFromPriceMap - 1) * 100).toFixed(0)}% crescita
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
                  +{((cashFlowProjection[11]?.revenue / mrrFromPriceMap - 1) * 100).toFixed(0)}% crescita
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
        </div>
      </div>

      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                disabled={expenseForm.recurring_variable} // Disable amount input if it's a variable recurring expense template
              />
              {expenseForm.recurring_variable && (
                <p className="text-xs text-gray-500 mt-1">L'importo per le spese variabili viene impostato mensilmente.</p>
              )}
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
                onChange={(e) => setExpenseForm({...expenseForm, recurring: e.target.checked, recurring_variable: false})}
                className="w-4 h-4"
              />
              <Label htmlFor="recurring">Spesa Ricorrente Fissa</Label>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurringVariable"
                checked={expenseForm.recurring_variable}
                onChange={(e) => setExpenseForm({...expenseForm, recurring_variable: e.target.checked, recurring: false})}
                className="w-4 h-4"
              />
              <Label htmlFor="recurringVariable">Spesa Ricorrente con Importo Variabile</Label>
            </div>

            {expenseForm.recurring_variable && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                <p className="font-semibold mb-1">ℹ️ Spesa Ricorrente Variabile</p>
                <p>Verrà creata una voce che potrai riutilizzare ogni mese inserendo l'importo diverso. L'importo della spesa madre sarà impostato a 0.</p>
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

      {/* NEW DIALOG for managing recurring variable expenses */}
      <Dialog open={showManageRecurringVariableExpenses} onOpenChange={setShowManageRecurringVariableExpenses}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestisci Spese Variabili Ricorrenti</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {recurringExpenses.length === 0 ? (
              <p className="text-center text-gray-500">Nessuna spesa variabile ricorrente configurata.</p>
            ) : (
              recurringExpenses.map((parentExpense) => (
                <Card key={parentExpense.id} className="p-4 border">
                  <CardTitle className="text-lg font-semibold mb-2">{parentExpense.description}</CardTitle>
                  <p className="text-sm text-gray-600 mb-4">Categoria: {parentExpense.category}</p>

                  <div className="space-y-3">
                    <Label htmlFor={`month-select-${parentExpense.id}`}>Mese/Anno</Label>
                    <Select
                      value={currentVariableExpenseEntry.parent_id === parentExpense.id ? currentVariableExpenseEntry.month : format(new Date(), 'yyyy-MM')}
                      onValueChange={(value) => setCurrentVariableExpenseEntry({ parent_id: parentExpense.id, month: value, amount: '' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona Mese" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => {
                          const month = subMonths(new Date(), i);
                          const formattedMonth = format(month, 'yyyy-MM');
                          const displayMonth = format(month, 'MMMM yyyy', { locale: it });
                          return <SelectItem key={formattedMonth} value={formattedMonth}>{displayMonth}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>

                    <Label htmlFor={`amount-input-${parentExpense.id}`}>Importo Mensile (€)</Label>
                    <Input
                      id={`amount-input-${parentExpense.id}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={currentVariableExpenseEntry.parent_id === parentExpense.id ? currentVariableExpenseEntry.amount : ''}
                      onChange={(e) => setCurrentVariableExpenseEntry({ ...currentVariableExpenseEntry, amount: e.target.value })}
                    />

                    <Button
                      onClick={() => handleAddVariableExpenseEntry(parentExpense.id)}
                      disabled={!currentVariableExpenseEntry.amount || isSavingExpense || currentVariableExpenseEntry.parent_id !== parentExpense.id}
                      className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                    >
                      {isSavingExpense && currentVariableExpenseEntry.parent_id === parentExpense.id ? 'Aggiunta...' : 'Aggiungi Voce'}
                    </Button>

                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Ultime Voci registrate:</h5>
                      {expenses.filter(e => e.parent_expense_id === parentExpense.id).length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {expenses
                            .filter(e => e.parent_expense_id === parentExpense.id)
                            .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()) // Sort by date descending
                            .slice(0, 5) // Show last 5 entries
                            .map(entry => (
                              <li key={entry.id}>
                                {format(parseISO(entry.date), 'MMMM yyyy', { locale: it })}: €{entry.amount.toLocaleString('it-IT')}
                              </li>
                            ))}
                          {expenses.filter(e => e.parent_expense_id === parentExpense.id).length > 5 && (
                              <li className="text-xs text-gray-500">...altre voci...</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Nessuna voce registrata per questa spesa variabile.</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowManageRecurringVariableExpenses(false)} variant="outline">
                Chiudi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
