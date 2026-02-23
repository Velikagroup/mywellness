import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, PlusCircle, Calendar as CalendarIcon, Tag, Percent, Crown, Sparkles, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    expires_at: null,
    is_active: true,
    assigned_to_email: '',
    assigned_plan: 'premium',
    notes: ''
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreatingLifetime, setIsCreatingLifetime] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const loadCoupons = async () => {
    setIsLoading(true);
    const [fetchedCoupons, fetchedTransactions, fetchedUsers] = await Promise.all([
      base44.entities.Coupon.list('-created_date'),
      base44.entities.Transaction.list('-payment_date', 1000),
      base44.entities.User.list('-created_date', 10000)
    ]);
    setCoupons(fetchedCoupons);
    setTransactions(fetchedTransactions);
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'code') {
      setNewCoupon({ ...newCoupon, [name]: value.toUpperCase() });
    } else {
      setNewCoupon({ ...newCoupon, [name]: value });
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    
    if (newCoupon.discount_type === 'percentage') {
      if (!newCoupon.code || !newCoupon.discount_value) {
        alert('Codice e Valore Sconto sono obbligatori.');
        return;
      }

      try {
        await base44.entities.Coupon.create({
          code: newCoupon.code,
          discount_type: 'percentage',
          discount_value: Number(newCoupon.discount_value),
          expires_at: newCoupon.expires_at ? newCoupon.expires_at.toISOString().split('T')[0] : null,
          is_active: newCoupon.is_active
        });
        setNewCoupon({ 
          code: '', 
          discount_type: 'percentage',
          discount_value: '', 
          expires_at: null, 
          is_active: true,
          assigned_to_email: '',
          assigned_plan: 'premium',
          notes: ''
        });
        setIsFormOpen(false);
        loadCoupons();
      } catch (error) {
        alert('Errore durante la creazione del coupon: ' + error.message);
      }
    }
  };

  const handleCreateLifetimeCoupon = async (e) => {
    e.preventDefault();
    
    if (!newCoupon.assigned_to_email || !newCoupon.assigned_plan) {
      alert('Email e Piano sono obbligatori per coupon lifetime.');
      return;
    }

    setIsCreatingLifetime(true);
    
    try {
      const response = await base44.functions.invoke('generateLifetimeCoupon', {
        email: newCoupon.assigned_to_email,
        plan: newCoupon.assigned_plan,
        notes: newCoupon.notes
      });

      const data = response.data || response;
      
      if (data.success) {
        alert(`✅ Coupon Lifetime creato!\n\nCodice: ${data.coupon.code}\nEmail: ${data.coupon.email}\nPiano: ${data.coupon.plan.toUpperCase()}\n\nInvia questo codice all'utente!`);
        setNewCoupon({ 
          code: '', 
          discount_type: 'percentage',
          discount_value: '', 
          expires_at: null, 
          is_active: true,
          assigned_to_email: '',
          assigned_plan: 'premium',
          notes: ''
        });
        setIsFormOpen(false);
        loadCoupons();
      } else {
        alert('Errore: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      alert('Errore durante la creazione del coupon lifetime: ' + error.message);
    }
    
    setIsCreatingLifetime(false);
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo coupon?')) {
      try {
        await base44.entities.Coupon.delete(couponId);
        loadCoupons();
      } catch (error) {
        alert("Errore durante l'eliminazione del coupon: " + error.message);
      }
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await base44.entities.Coupon.update(coupon.id, { is_active: !coupon.is_active });
      loadCoupons();
    } catch (error) {
      alert("Errore durante l'aggiornamento dello stato: " + error.message);
    }
  };

  // Calcola statistiche coupon basandosi sui coupon usati (used_by e used_at)
  const couponStats = useMemo(() => {
    // Conta utilizzi direttamente dai coupon
    const usedCoupons = coupons.filter(c => c.used_by || c.used_at);
    
    // Filtra per periodo
    let filteredCoupons = usedCoupons;
    if (selectedPeriod === 'month') {
      const start = startOfMonth(new Date(selectedYear, selectedMonth));
      const end = endOfMonth(new Date(selectedYear, selectedMonth));
      filteredCoupons = usedCoupons.filter(c => {
        if (!c.used_at) return false;
        const date = new Date(c.used_at);
        return date >= start && date <= end;
      });
    } else if (selectedPeriod === 'year') {
      const start = startOfYear(new Date(selectedYear, 0));
      const end = endOfYear(new Date(selectedYear, 0));
      filteredCoupons = usedCoupons.filter(c => {
        if (!c.used_at) return false;
        const date = new Date(c.used_at);
        return date >= start && date <= end;
      });
    }

    // Calcola totali dai coupon usati
    const totalPurchases = filteredCoupons.length;
    
    // Stima revenue/sconti basandosi sul tipo di coupon
    let totalRevenue = 0;
    let totalDiscounts = 0;
    
    // Statistiche per coupon
    const couponUsage = {};
    
    // Prima aggiungiamo tutti i coupon con i loro utilizzi
    coupons.forEach(coupon => {
      const isUsed = coupon.used_by || coupon.used_at;
      
      // Check periodo per coupon usati
      let inPeriod = true;
      if (isUsed && coupon.used_at) {
        const usedDate = new Date(coupon.used_at);
        if (selectedPeriod === 'month') {
          const start = startOfMonth(new Date(selectedYear, selectedMonth));
          const end = endOfMonth(new Date(selectedYear, selectedMonth));
          inPeriod = usedDate >= start && usedDate <= end;
        } else if (selectedPeriod === 'year') {
          const start = startOfYear(new Date(selectedYear, 0));
          const end = endOfYear(new Date(selectedYear, 0));
          inPeriod = usedDate >= start && usedDate <= end;
        }
      }
      
      if (!couponUsage[coupon.code]) {
        couponUsage[coupon.code] = {
          code: coupon.code,
          uses: 0,
          revenue: 0,
          discounts: 0,
          type: coupon.discount_type,
          discount_value: coupon.discount_value
        };
      }
      
      if (isUsed && inPeriod) {
        couponUsage[coupon.code].uses++;
        
        // Prezzi reali dei piani mensili
        const planPrices = { base: 19, pro: 29, premium: 39 };
        const planPrice = planPrices[coupon.assigned_plan] || 39; // Default premium
        
        if (coupon.discount_type === 'lifetime_free') {
          couponUsage[coupon.code].discounts += planPrice;
          totalDiscounts += planPrice;
        } else if (coupon.discount_type === 'percentage' && coupon.discount_value) {
          const discount = planPrice * (coupon.discount_value / 100);
          couponUsage[coupon.code].discounts += discount;
          couponUsage[coupon.code].revenue += planPrice - discount;
          totalRevenue += planPrice - discount;
          totalDiscounts += discount;
        }
      }
    });

    // Statistiche mensili (ultimi 12 mesi)
    const monthlyStats = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(date, 'MMM yyyy');
      monthlyStats[key] = {
        month: key,
        purchases: 0,
        revenue: 0,
        discounts: 0
      };
    }

    usedCoupons.forEach(coupon => {
      if (!coupon.used_at) return;
      const date = new Date(coupon.used_at);
      const key = format(date, 'MMM yyyy');
      if (monthlyStats[key]) {
        monthlyStats[key].purchases++;
        const planPrices = { base: 19, pro: 29, premium: 39 };
        const planPrice = planPrices[coupon.assigned_plan] || 39;
        if (coupon.discount_type === 'percentage' && coupon.discount_value) {
          const discount = planPrice * (coupon.discount_value / 100);
          monthlyStats[key].discounts += discount;
          monthlyStats[key].revenue += planPrice - discount;
        } else if (coupon.discount_type === 'lifetime_free') {
          monthlyStats[key].discounts += planPrice;
        }
      }
    });

    // Coupon più usati
    const topCoupons = Object.values(couponUsage)
      .filter(c => c.uses > 0)
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);

    return {
      totalPurchases,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      avgDiscount: totalPurchases > 0 ? Math.round((totalDiscounts / totalPurchases) * 100) / 100 : 0,
      couponUsage: Object.values(couponUsage),
      monthlyStats: Object.values(monthlyStats),
      topCoupons
    };
  }, [coupons, transactions, selectedPeriod, selectedYear, selectedMonth]);

  const COLORS = ['#26847F', '#1f6b66', '#3b9b95', '#56b2ab', '#71c9c1'];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Coupon</h1>
            <p className="text-gray-600">Crea coupon standard o lifetime gratuiti</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#26847F] hover:bg-[#1f6b66] text-white shadow-lg">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crea Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crea un Nuovo Coupon</DialogTitle>
              </DialogHeader>

              {/* Tabs per tipo coupon */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setNewCoupon({ ...newCoupon, discount_type: 'percentage' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    newCoupon.discount_type === 'percentage'
                      ? 'border-[#26847F] bg-[#26847F] !bg-opacity-100 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Percent className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-semibold">Sconto %</span>
                </button>
                <button
                  onClick={() => setNewCoupon({ ...newCoupon, discount_type: 'lifetime_free' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    newCoupon.discount_type === 'lifetime_free'
                      ? 'border-purple-500 bg-purple-500 !bg-opacity-100 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Crown className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-semibold">Lifetime Free</span>
                </button>
              </div>

              {/* Form Sconto Percentuale */}
              {newCoupon.discount_type === 'percentage' && (
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div>
                    <Label htmlFor="code">Codice Coupon</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                      <Input id="code" name="code" value={newCoupon.code} onChange={handleInputChange} placeholder="ES: ESTATE20" className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">Valore Sconto (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                      <Input id="discount_value" name="discount_value" type="number" value={newCoupon.discount_value} onChange={handleInputChange} placeholder="Es: 10 per 10%" className="pl-10"/>
                    </div>
                  </div>
                  <div>
                    <Label>Data di Scadenza (Opzionale)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newCoupon.expires_at ? format(newCoupon.expires_at, 'PPP', { locale: it }) : <span>Seleziona una data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newCoupon.expires_at}
                          onSelect={(date) => setNewCoupon({ ...newCoupon, expires_at: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button type="submit" className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white">Crea Coupon</Button>
                </form>
              )}

              {/* Form Lifetime Free */}
              {newCoupon.discount_type === 'lifetime_free' && (
                <form onSubmit={handleCreateLifetimeCoupon} className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <p className="font-semibold mb-1">🎁 Accesso Lifetime Gratuito</p>
                        <p className="text-purple-800 text-xs">
                          Questo coupon darà accesso gratuito ILLIMITATO all'app per l'utente specificato. Non ci saranno mai addebiti.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Utente</Label>
                    <Input 
                      id="email" 
                      name="assigned_to_email" 
                      type="email"
                      value={newCoupon.assigned_to_email} 
                      onChange={handleInputChange} 
                      placeholder="mario.rossi@email.com" 
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="plan">Piano da Assegnare</Label>
                    <Select 
                      value={newCoupon.assigned_plan} 
                      onValueChange={(value) => setNewCoupon({ ...newCoupon, assigned_plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Note Interne (Opzionale)</Label>
                    <Textarea 
                      id="notes" 
                      name="notes"
                      value={newCoupon.notes} 
                      onChange={handleInputChange} 
                      placeholder="Es: Influencer Mario Rossi, partnership Q1 2025"
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isCreatingLifetime}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                  >
                    {isCreatingLifetime ? 'Creazione...' : '🎁 Genera Coupon Lifetime'}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Analytics Section */}
        <div className="space-y-6">
          {/* Filtri Periodo */}
          <Card className="water-glass-effect border-gray-200/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#26847F]" />
                Analytics Coupon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <Button
                    variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedPeriod('all')}
                    size="sm"
                    className={selectedPeriod === 'all' ? 'bg-[#26847F] hover:bg-[#1f6b66]' : ''}
                  >
                    Tutti
                  </Button>
                  <Button
                    variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                    onClick={() => setSelectedPeriod('month')}
                    size="sm"
                    className={selectedPeriod === 'month' ? 'bg-[#26847F] hover:bg-[#1f6b66]' : ''}
                  >
                    Mese
                  </Button>
                  <Button
                    variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                    onClick={() => setSelectedPeriod('year')}
                    size="sm"
                    className={selectedPeriod === 'year' ? 'bg-[#26847F] hover:bg-[#1f6b66]' : ''}
                  >
                    Anno
                  </Button>
                </div>

                {selectedPeriod === 'month' && (
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'].map((m, i) => (
                        <SelectItem key={i} value={i.toString()}>{m} {selectedYear}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(selectedPeriod === 'month' || selectedPeriod === 'year') && (
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2024, 2023].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Acquisti con Coupon</p>
                    <p className="text-2xl font-bold text-gray-900">{couponStats.totalPurchases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fatturato con Coupon</p>
                    <p className="text-2xl font-bold text-gray-900">€{couponStats.totalRevenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sconti Totali Dati</p>
                    <p className="text-2xl font-bold text-gray-900">€{couponStats.totalDiscounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="water-glass-effect border-gray-200/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Percent className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sconto Medio</p>
                    <p className="text-2xl font-bold text-gray-900">€{couponStats.avgDiscount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Coupon */}
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle className="text-base">Top 10 Coupon Più Usati</CardTitle>
              </CardHeader>
              <CardContent>
                {couponStats.topCoupons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={couponStats.topCoupons}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="uses" fill="#26847F" name="Utilizzi" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>

            {/* Distribuzione Sconti */}
            <Card className="water-glass-effect border-gray-200/30">
              <CardHeader>
                <CardTitle className="text-base">Distribuzione Fatturato vs Sconti</CardTitle>
              </CardHeader>
              <CardContent>
                {couponStats.topCoupons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={couponStats.topCoupons.slice(0, 5)}
                        dataKey="discounts"
                        nameKey="code"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.code}: €${entry.discounts.toFixed(0)}`}
                      >
                        {couponStats.topCoupons.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>

            {/* Trend Mensile */}
            <Card className="water-glass-effect border-gray-200/30 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Trend Ultimi 12 Mesi</CardTitle>
              </CardHeader>
              <CardContent>
                {couponStats.monthlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={couponStats.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="purchases" stroke="#26847F" strokeWidth={2} name="Acquisti" />
                      <Line type="monotone" dataKey="revenue" stroke="#3b9b95" strokeWidth={2} name="Fatturato (€)" />
                      <Line type="monotone" dataKey="discounts" stroke="#f59e0b" strokeWidth={2} name="Sconti (€)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-12">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>


          </div>
        </div>

        {/* Coupons Card */}
        <Card className="water-glass-effect border-gray-200/30 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Tutti i Coupon e Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sconto/Piano</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead className="text-right">Trial Avviati</TableHead>
                    <TableHead className="text-right">Utilizzi</TableHead>
                    <TableHead className="text-right">Fatturato</TableHead>
                    <TableHead className="text-right">Sconti Dati</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={10} className="text-center">Caricamento...</TableCell></TableRow>
                  ) : coupons.length > 0 ? (
                    coupons.map((coupon) => {
                       const stats = couponStats.couponUsage.find(u => u.code === coupon.code) || { uses: 0, revenue: 0, discounts: 0 };
                       const usersWithCoupon = users.filter(u => 
                         u.influencer_referral_code?.toUpperCase() === coupon.code.toUpperCase() || 
                         u.coupon_applied?.toUpperCase() === coupon.code.toUpperCase()
                       );
                       const trialSetups = usersWithCoupon.reduce((count, user) => {
                         return count + transactions.filter(t => t.user_id === user.id && (t.type === 'trial_setup' || t.status === 'succeeded')).length;
                       }, 0);

                       return (
                         <TableRow key={coupon.id} className={coupon.discount_type === 'lifetime_free' ? 'bg-purple-50/30' : ''}>
                           <TableCell className="font-medium font-mono text-sm">{coupon.code}</TableCell>
                           <TableCell>
                             {coupon.discount_type === 'lifetime_free' ? (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                 <Crown className="w-3 h-3" />
                                 Lifetime
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                 <Percent className="w-3 h-3" />
                                 Sconto
                               </span>
                             )}
                           </TableCell>
                           <TableCell>
                             {coupon.discount_type === 'lifetime_free' 
                               ? <span className="font-semibold text-purple-700 uppercase">{coupon.assigned_plan || 'Premium'}</span>
                               : `${coupon.discount_value}%`
                             }
                           </TableCell>
                           <TableCell className="text-sm text-gray-600">
                             {coupon.assigned_to_email || '-'}
                           </TableCell>
                           <TableCell className="text-sm">{coupon.expires_at ? format(new Date(coupon.expires_at), 'dd/MM/yyyy') : 'Mai'}</TableCell>
                           <TableCell className="text-center">
                             {trialSetups > 0 ? (
                               <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                 {trialSetups}
                               </span>
                             ) : (
                               <span className="text-gray-400">—</span>
                             )}
                           </TableCell>
                           <TableCell className="text-right font-semibold text-blue-600">
                             {coupon.used_by ? '1' : '-'}
                           </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {stats.revenue > 0 ? `€${stats.revenue.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {stats.discounts > 0 ? `€${stats.discounts.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={coupon.is_active}
                                onCheckedChange={() => handleToggleActive(coupon)}
                                aria-label="Attiva/Disattiva"
                              />
                              {coupon.used_at && (
                                <span className="text-xs text-green-600">
                                  Usato {format(new Date(coupon.used_at), 'dd/MM/yy')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={10} className="text-center">Nessun coupon trovato.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}