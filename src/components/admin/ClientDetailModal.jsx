import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Mail,
  CreditCard,
  Tag,
  MessageSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Briefcase,
  Gift,
  Utensils,
  Dumbbell,
  Shield
} from 'lucide-react';

export default function ClientDetailModal({ client, isOpen, onClose, onUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [emailsSent, setEmailsSent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditType, setCreditType] = useState('meal');
  const [creditAmount, setCreditAmount] = useState(1);
  const [creditReason, setCreditReason] = useState('');
  const [extraCredits, setExtraCredits] = useState({ meal: 0, workout: 0 });
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState('');

  useEffect(() => {
    if (client && isOpen) {
      loadClientData();
    }
  }, [client, isOpen]);

  const loadClientData = async () => {
    try {
      const [txs, fbs, credits] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: client.id }),
        base44.entities.AIFeedback.filter({ user_id: client.id }),
        base44.entities.PlanGenerationCredit.filter({ user_id: client.id })
      ]);
      
      setTransactions(txs);
      setFeedbacks(fbs);
      
      // Calcola crediti extra disponibili
      const currentMonth = new Date().toISOString().slice(0, 7);
      const mealCredits = credits
        .filter(c => c.plan_type === 'meal' && (!c.expiration_month || c.expiration_month >= currentMonth))
        .reduce((sum, c) => sum + c.credits_amount, 0);
      const workoutCredits = credits
        .filter(c => c.plan_type === 'workout' && (!c.expiration_month || c.expiration_month >= currentMonth))
        .reduce((sum, c) => sum + c.credits_amount, 0);
      
      setExtraCredits({ meal: mealCredits, workout: workoutCredits });
      
      // Email sent: stima basata su eventi
      setEmailsSent(5); // Placeholder - puoi implementare tracking reale
    } catch (error) {
      console.error('Error loading client data:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(`Sei sicuro di voler cancellare l'abbonamento di ${client.full_name}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('cancelUserSubscription', {
        userId: client.id
      });

      if (response.success) {
        alert('✅ Abbonamento cancellato con successo!');
        await onUpdate();
        onClose();
      } else {
        alert('❌ Errore: ' + response.error);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('❌ Errore: ' + error.message);
    }
    setIsProcessing(false);
  };

  const handleRenewSubscription = async () => {
    if (!confirm(`Rinnovare l'abbonamento di ${client.full_name}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('renewUserSubscription', {
        userId: client.id
      });

      if (response.success) {
        alert('✅ Abbonamento rinnovato con successo!');
        await onUpdate();
        onClose();
      } else {
        alert('❌ Errore: ' + response.error);
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      alert('❌ Errore: ' + error.message);
    }
    setIsProcessing(false);
  };

  const handleToggleLandingOffer = async () => {
    const action = client.purchased_landing_offer ? 'disattivare' : 'attivare';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Landing Offer per ${client.full_name}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await base44.entities.User.update(client.id, {
        purchased_landing_offer: !client.purchased_landing_offer
      });

      alert(`✅ Landing Offer ${client.purchased_landing_offer ? 'disattivata' : 'attivata'} con successo!`);
      await onUpdate();
    } catch (error) {
      console.error('Error toggling landing offer:', error);
      alert('❌ Errore: ' + error.message);
    }
    setIsProcessing(false);
  };

  const handleChangePlan = async () => {
    if (!newPlan) return;
    
    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('adminUpdateUserPlan', {
        userEmail: client.email,
        newPlan: newPlan
      });

      if (response.data?.success || response.success) {
        alert(`✅ Piano aggiornato a ${newPlan}!`);
        setShowPlanDialog(false);
        await onUpdate();
      } else {
        alert('❌ Errore: ' + (response.data?.error || response.error));
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('❌ Errore: ' + error.message);
    }
    setIsProcessing(false);
  };

  const handleToggleCustomerSupport = async () => {
    const isCurrentlySupport = client.custom_role === 'customer_support';
    const action = isCurrentlySupport ? 'rimuovere' : 'assegnare';
    
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} il ruolo Customer Support a ${client.full_name || client.email}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('adminUpdateUserPlan', {
        userEmail: client.email,
        customRole: isCurrentlySupport ? null : 'customer_support'
      });

      if (response.data?.success || response.success) {
        alert(`✅ Ruolo ${isCurrentlySupport ? 'rimosso' : 'assegnato'} con successo!`);
        await onUpdate();
      } else {
        alert('❌ Errore: ' + (response.data?.error || response.error));
      }
    } catch (error) {
      console.error('Error toggling customer support:', error);
      alert('❌ Errore: ' + error.message);
    }
    setIsProcessing(false);
  };

  const handleGrantCredits = async () => {
    setIsProcessing(true);
    try {
      const adminUser = await base44.auth.me();
      
      await base44.entities.PlanGenerationCredit.create({
        user_id: client.id,
        plan_type: creditType,
        credits_amount: creditAmount,
        reason: creditReason || 'Crediti extra concessi da admin',
        granted_by: adminUser.email,
        expiration_month: null
      });

      alert(`✅ ${creditAmount} ${creditType === 'meal' ? 'generazioni nutrizionali' : 'generazioni allenamento'} concesse con successo!`);
      setShowCreditDialog(false);
      setCreditReason('');
      await loadClientData();
    } catch (error) {
      console.error('Error granting credits:', error);
      alert('❌ Errore: ' + error.message);
    }
    setIsProcessing(false);
  };

  if (!client) return null;

  const totalSpent = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const products = transactions.map(tx => tx.plan || 'N/A').filter((v, i, a) => a.indexOf(v) === i);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {(client.full_name || client.email || 'U')[0].toUpperCase()}
            </div>
            {client.full_name || 'Utente'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button
              onClick={handleCancelSubscription}
              disabled={isProcessing || client.subscription_status !== 'active'}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancella Abb.
            </Button>
            
            <Button
              onClick={handleRenewSubscription}
              disabled={isProcessing || client.subscription_status === 'active'}
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Rinnova Abb.
            </Button>
            
            <Button
              onClick={handleToggleLandingOffer}
              disabled={isProcessing}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {client.purchased_landing_offer ? 'Disattiva' : 'Attiva'} Landing
            </Button>
            
            <Button
              onClick={() => {
                setNewPlan(client.subscription_plan || 'base');
                setShowPlanDialog(true);
              }}
              variant="outline"
              className="border-amber-200 text-amber-600 hover:bg-amber-50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Cambia Piano
            </Button>
            
            <Button
              onClick={() => setShowCreditDialog(true)}
              variant="outline"
              className="border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
            >
              <Gift className="w-4 h-4 mr-2" />
              Dai Crediti
            </Button>
            
            <Button
              onClick={() => window.open(`mailto:${client.email}`, '_blank')}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Invia Email
            </Button>
          </div>

          {/* Crediti Extra */}
          {(extraCredits.meal > 0 || extraCredits.workout > 0) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-green-600" />
                <div className="flex-1">
                  <p className="font-bold text-green-900">🎁 Crediti Extra Attivi</p>
                  <div className="flex gap-4 mt-2">
                    {extraCredits.meal > 0 && (
                      <Badge className="bg-green-600 text-white">
                        <Utensils className="w-3 h-3 mr-1" />
                        +{extraCredits.meal} Piani Nutrizionali
                      </Badge>
                    )}
                    {extraCredits.workout > 0 && (
                      <Badge className="bg-blue-600 text-white">
                        <Dumbbell className="w-3 h-3 mr-1" />
                        +{extraCredits.workout} Piani Allenamento
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Panoramica</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="transactions">Transazioni</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="contact">Contatti</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Finanziario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spesa Totale:</span>
                      <span className="font-bold text-[var(--brand-primary)]">€{totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transazioni:</span>
                      <span className="font-semibold">{transactions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prodotti:</span>
                      <span className="font-semibold">{products.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ultimo Pagamento:</span>
                      <span className="text-sm text-gray-600">
                        {client.last_payment_date ? new Date(client.last_payment_date).toLocaleDateString('it-IT') : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Abbonamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stato:</span>
                      <Badge className={
                        client.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                        client.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {client.subscription_status || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Piano:</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        {client.subscription_plan || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scadenza:</span>
                      <span className="text-sm">
                        {client.subscription_period_end ? new Date(client.subscription_period_end).toLocaleDateString('it-IT') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Landing Offer:</span>
                      <Badge className={client.purchased_landing_offer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {client.purchased_landing_offer ? '✅ Sì' : '❌ No'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Marketing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sorgente Traffico:</span>
                      <Badge variant="outline">
                        {client.traffic_source || 'direct'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Inviate:</span>
                      <span className="font-semibold">{emailsSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lingua:</span>
                      <span className="font-semibold">
                        {client.language === 'it' ? '🇮🇹 Italiano' :
                         client.language === 'en' ? '🇬🇧 Inglese' :
                         client.language || 'it'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Dati Fisici
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso Attuale:</span>
                      <span className="font-semibold">{client.current_weight || 'N/A'} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso Obiettivo:</span>
                      <span className="font-semibold">{client.target_weight || 'N/A'} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Altezza:</span>
                      <span className="font-semibold">{client.height || 'N/A'} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">BMR:</span>
                      <span className="font-semibold">{client.bmr || 'N/A'} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Massa Grassa:</span>
                      <span className="font-semibold">{client.body_fat_percentage || 'N/A'}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risposte Quiz Iniziale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Genere</p>
                      <p className="font-semibold">{client.gender === 'male' ? '♂️ Uomo' : client.gender === 'female' ? '♀️ Donna' : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Età</p>
                      <p className="font-semibold">{client.age || 'N/A'} anni</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tipo Dieta</p>
                      <p className="font-semibold">{client.diet_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Livello Attività</p>
                      <p className="font-semibold">{client.activity_level || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Obiettivo Fitness</p>
                      <p className="font-semibold">{client.fitness_goal || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Esperienza</p>
                      <p className="font-semibold">{client.fitness_experience || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Luogo Allenamento</p>
                      <p className="font-semibold">{client.workout_location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Giorni Workout/sett</p>
                      <p className="font-semibold">{client.workout_days || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {client.allergies && client.allergies.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-500 mb-2">Allergie/Intolleranze</p>
                      <div className="flex flex-wrap gap-2">
                        {client.allergies.map((allergy, idx) => (
                          <Badge key={idx} variant="outline">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {client.favorite_foods && client.favorite_foods.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-500 mb-2">Cibi Preferiti</p>
                      <div className="flex flex-wrap gap-2">
                        {client.favorite_foods.map((food, idx) => (
                          <Badge key={idx} className="bg-green-100 text-green-700">{food}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Storico Transazioni ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-900">{tx.description || tx.type}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(tx.payment_date).toLocaleDateString('it-IT')}
                            </p>
                            {tx.plan && (
                              <Badge className="mt-1 bg-purple-100 text-purple-700">{tx.plan}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[var(--brand-primary)]">€{tx.amount.toFixed(2)}</p>
                            <Badge className={
                              tx.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                              tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nessuna transazione</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Feedback Ricevuti ({feedbacks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feedbacks.length > 0 ? (
                    <div className="space-y-3">
                      {feedbacks.map(fb => (
                        <div key={fb.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-100 text-blue-700">{fb.feedback_type}</Badge>
                            <Badge className={
                              fb.status === 'implemented' ? 'bg-green-100 text-green-700' :
                              fb.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {fb.status}
                            </Badge>
                          </div>
                          <p className="text-gray-900">{fb.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(fb.created_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nessun feedback</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Dati di Contatto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-semibold">{client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Telefono</p>
                      <p className="font-semibold">{client.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Lingua</p>
                      <p className="font-semibold">
                        {client.language === 'it' ? '🇮🇹 Italiano' :
                         client.language === 'en' ? '🇬🇧 Inglese' :
                         client.language || 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Indirizzo Fatturazione
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nome Fatturazione</p>
                      <p className="font-semibold">{client.billing_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
                      <p className="font-semibold">{client.billing_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Città, CAP</p>
                      <p className="font-semibold">
                        {client.billing_city || 'N/A'}, {client.billing_zip || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Paese</p>
                      <p className="font-semibold">{client.billing_country || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                {client.billing_type === 'company' && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Dati Aziendali
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Nome Azienda</p>
                          <p className="font-semibold">{client.company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Partita IVA</p>
                          <p className="font-semibold">{client.tax_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">PEC/SDI</p>
                          <p className="font-semibold">{client.pec_sdi || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Metodo di Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Carta Salvata</p>
                        <p className="font-semibold">
                          {client.stripe_card_brand ? `${client.stripe_card_brand.toUpperCase()} •••• ${client.stripe_card_last4}` : 'Nessuna carta salvata'}
                        </p>
                      </div>
                      {client.stripe_card_brand && (
                        <Badge className="bg-green-100 text-green-700">Attiva</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog Cambia Piano */}
        <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Cambia Piano Abbonamento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Seleziona Nuovo Piano</label>
                <div className="grid grid-cols-2 gap-2">
                  {['free', 'base', 'pro', 'premium'].map(plan => (
                    <Button
                      key={plan}
                      onClick={() => setNewPlan(plan)}
                      variant={newPlan === plan ? 'default' : 'outline'}
                      className={newPlan === plan ? 'bg-[#26847F] hover:bg-[#1f6b66] text-white' : ''}
                    >
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Questo cambierà immediatamente il piano dell'utente da <strong>{client.subscription_plan}</strong> a <strong>{newPlan}</strong>.
                  <br />
                  <span className="text-xs">Nota: Non modifica la subscription Stripe, solo il database.</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPlanDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleChangePlan}
                  disabled={isProcessing || newPlan === client.subscription_plan}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  Conferma Cambio
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Crediti */}
        <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[var(--brand-primary)]" />
                Concedi Crediti Generazione Extra
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tipo Piano</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCreditType('meal')}
                    variant={creditType === 'meal' ? 'default' : 'outline'}
                    className={creditType === 'meal' ? 'bg-[#26847F] hover:bg-[#1f6b66] text-white' : ''}
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Nutrizionale
                  </Button>
                  <Button
                    onClick={() => setCreditType('workout')}
                    variant={creditType === 'workout' ? 'default' : 'outline'}
                    className={creditType === 'workout' ? 'bg-[#26847F] hover:bg-[#1f6b66] text-white' : ''}
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Allenamento
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Numero Generazioni</label>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCreditAmount(Math.max(1, creditAmount - 1))}
                    variant="outline"
                    size="sm"
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold text-gray-900 px-6">{creditAmount}</span>
                  <Button
                    onClick={() => setCreditAmount(creditAmount + 1)}
                    variant="outline"
                    size="sm"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Il cliente riceverà <strong>{creditAmount}</strong> {creditType === 'meal' ? 'generazioni nutrizionali' : 'generazioni allenamento'} extra che potrà utilizzare senza limiti di tempo.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCreditDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleGrantCredits}
                  disabled={isProcessing}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  Conferma
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}