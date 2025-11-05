
import React, { useState, useEffect } from 'react';
import { Coupon } from '@/entities/Coupon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, PlusCircle, Calendar as CalendarIcon, Tag, Percent } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_value: '',
    expires_at: null,
    is_active: true
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadCoupons = async () => {
    setIsLoading(true);
    const fetchedCoupons = await Coupon.list('-created_date');
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
    if (!newCoupon.code || !newCoupon.discount_value) {
      alert('Codice e Valore Sconto sono obbligatori.');
      return;
    }

    try {
      await Coupon.create({
        ...newCoupon,
        discount_type: 'percentage',
        discount_value: Number(newCoupon.discount_value),
        expires_at: newCoupon.expires_at ? newCoupon.expires_at.toISOString().split('T')[0] : null
      });
      setNewCoupon({ code: '', discount_value: '', expires_at: null, is_active: true });
      setIsFormOpen(false);
      loadCoupons();
    } catch (error) {
      alert('Errore durante la creazione del coupon: ' + error.message);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo coupon?')) {
      try {
        await Coupon.delete(couponId);
        loadCoupons();
      } catch (error) {
        alert("Errore durante l'eliminazione del coupon: " + error.message);
      }
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await Coupon.update(coupon.id, { is_active: !coupon.is_active });
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
            <p className="text-gray-600">Crea e gestisci i codici sconto</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white shadow-lg">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crea Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crea un Nuovo Coupon</DialogTitle>
              </DialogHeader>
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
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons Card */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Coupon Attivi e Disattivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Sconto</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Caricamento...</TableCell></TableRow>
                  ) : coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">{coupon.code}</TableCell>
                        <TableCell>{coupon.discount_value}%</TableCell>
                        <TableCell>{coupon.expires_at ? format(new Date(coupon.expires_at), 'dd/MM/yyyy') : 'Nessuna'}</TableCell>
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
                    <TableRow><TableCell colSpan={5} className="text-center">Nessun coupon trovato.</TableCell></TableRow>
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
