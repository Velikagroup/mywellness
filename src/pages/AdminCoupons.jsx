import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, PlusCircle, Calendar as CalendarIcon, Tag, Percent, Crown, Sparkles } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
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

  const loadCoupons = async () => {
    setIsLoading(true);
    const fetchedCoupons = await base44.entities.Coupon.list('-created_date');
    setCoupons(fetchedCoupons);
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
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Percent className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-semibold">Sconto %</span>
                </button>
                <button
                  onClick={() => setNewCoupon({ ...newCoupon, discount_type: 'lifetime_free' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    newCoupon.discount_type === 'lifetime_free'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
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
                  <Button type="submit" className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">Crea Coupon</Button>
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

        {/* Coupons Card */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Tutti i Coupon</CardTitle>
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
                    <TableHead>Usato</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center">Caricamento...</TableCell></TableRow>
                  ) : coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id} className={coupon.discount_type === 'lifetime_free' ? 'bg-purple-50/30' : ''}>
                        <TableCell className="font-medium font-mono text-sm">{coupon.code}</TableCell>
                        <TableCell>
                          {coupon.discount_type === 'lifetime_free' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              <Crown className="w-3 h-3" />
                              Lifetime Free
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              <Percent className="w-3 h-3" />
                              Sconto %
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
                        <TableCell>{coupon.expires_at ? format(new Date(coupon.expires_at), 'dd/MM/yyyy') : 'Mai'}</TableCell>
                        <TableCell>
                          {coupon.used_by ? (
                            <span className="text-xs text-green-600 font-semibold">✓ Usato</span>
                          ) : (
                            <span className="text-xs text-gray-400">Non usato</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={() => handleToggleActive(coupon)}
                            aria-label="Attiva/Disattiva"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={8} className="text-center">Nessun coupon trovato.</TableCell></TableRow>
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