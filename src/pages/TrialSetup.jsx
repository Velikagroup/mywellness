
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, CheckCircle, Sparkles, Shield, FileText, Check, ChevronsUpDown, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const countries = [
  { code: 'IT', name: 'Italia', dial_code: '+39' },
  { code: 'US', name: 'Stati Uniti', dial_code: '+1' },
  { code: 'GB', name: 'Regno Unito', dial_code: '+44' },
  { code: 'FR', name: 'Francia', dial_code: '+33' },
  { code: 'DE', name: 'Germania', dial_code: '+49' },
  { code: 'ES', name: 'Spagna', dial_code: '+34' },
  { code: 'CH', name: 'Svizzera', dial_code: '+41' },
  { code: 'BR', name: 'Brasile', dial_code: '+55' },
  { code: 'AU', name: 'Australia', dial_code: '+61' },
  { code: 'CA', name: 'Canada', dial_code: '+1' },
];

const countryCodeToFlag = (code) => {
  if (!code) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)));
};

const TRIAL_DAYS = 3;
const ORDER_BUMP_PRICE = 19.99;

export default function TrialSetup() {
  const navigate = useNavigate();
  const location = useLocation(); // Keep location if it's used elsewhere, otherwise can be removed. Not used in the provided snippet.
  const [isSaving, setIsSaving] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    email: '',
    companyName: '',
    taxId: '',
    pecSdi: '',
    billingType: 'private',
    address: '',
    city: '',
    zip: '',
    country: 'IT'
  });
  const [showBillingFields, setShowBillingFields] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderBumpSelected, setOrderBumpSelected] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'IT'));

  // New states for authentication check
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsLoading(false);

        // Se l'utente ha già una sottoscrizione attiva, reindirizza alla dashboard
        if (currentUser && currentUser.subscription_status === 'active') {
          navigate(createPageUrl('Dashboard'), { replace: true });
          return;
        }

        // Controlla se ci sono dati del quiz da salvare
        const savedQuizData = localStorage.getItem('quizData');
        if (savedQuizData) {
          try {
            const quizData = JSON.parse(savedQuizData);
            // Salva i dati del quiz nell'utente
            await base44.auth.updateMe(quizData);
            console.log('Quiz data saved to user profile');
            localStorage.removeItem('quizData'); // Remove after saving to avoid repeated updates
          } catch (error) {
            console.error('Error saving quiz data:', error);
          }
        }

      } catch (error) {
        console.error('Authentication error:', error);
        setIsLoading(false);

        // Se non autenticato, salva flag e reindirizza al login
        localStorage.setItem('redirectToTrialSetup', 'true');
        const trialSetupUrl = window.location.origin + createPageUrl('TrialSetup');
        await base44.auth.loginWithRedirect(trialSetupUrl);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // If loading, render a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--brand-primary)]"></div>
          <p className="mt-4 text-gray-700 font-semibold text-lg">Caricamento...</p>
        </div>
      </div>
    );
  }

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    if (value.length <= 19) {
      setCardData({ ...cardData, number: value });
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    } else if (value.length === 2 && !cardData.expiry.includes('/')) {
      value = value + '/';
    }
    if (value.length <= 5) {
      setCardData({ ...cardData, expiry: value });
    }
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardData({ ...cardData, cvc: value });
    }
  };

  const handleBillingInfoChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleCompleteSetup = async () => {
    if (!isFormValid) {
      alert("Per favore, compila tutti i campi obbligatori correttamente.");
      return;
    }

    setIsSaving(true);

    try {
      const [exp_month_str, exp_year_str] = cardData.expiry.split('/');
      const exp_month = parseInt(exp_month_str, 10);
      const exp_year = parseInt('20' + exp_year_str, 10);
      
      const fullPhoneNumber = selectedCountry.dial_code + ' ' + phoneNumber;

      const payload = {
        cardData: {
          number: cardData.number.replace(/\s/g, ''),
          exp_month: exp_month,
          exp_year: exp_year,
          cvc: cardData.cvc,
        },
        orderBumpSelected: orderBumpSelected,
        billingInfo: {
          name: billingInfo.name,
          email: billingInfo.email,
          companyName: showBillingFields && billingInfo.billingType === 'company' ? billingInfo.companyName : null,
          taxId: showBillingFields ? billingInfo.taxId : null,
          pecSdi: showBillingFields && billingInfo.billingType === 'company' ? billingInfo.pecSdi : null,
          billingType: billingInfo.billingType,
          address: billingInfo.address,
          city: billingInfo.city,
          zip: billingInfo.zip,
          country: billingInfo.country
        },
        phoneNumber: fullPhoneNumber,
        termsAccepted: termsAccepted,
        privacyAccepted: privacyAccepted,
        marketingConsent: marketingConsent
      };

      const functionUrl = `${window.location.origin}/functions/stripeCreateTrialSubscription`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || result.details || 'Setup failed');
      }

      navigate(createPageUrl('Dashboard'), { replace: true });

    } catch (error) {
      console.error('Setup error:', error);
      alert('Errore durante l\'attivazione: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = cardData.number.replace(/\s/g, '').length === 16 &&
    cardData.expiry.length === 5 &&
    cardData.cvc.length === 3 &&
    billingInfo.name.length > 0 &&
    billingInfo.email.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email) &&
    phoneNumber.length > 0 &&
    billingInfo.address.length > 0 &&
    billingInfo.city.length > 0 &&
    billingInfo.zip.length > 0 &&
    billingInfo.country.length > 0 &&
    termsAccepted &&
    privacyAccepted &&
    (!showBillingFields || (
      billingInfo.taxId.length > 0 &&
      (billingInfo.billingType !== 'company' || billingInfo.companyName.length > 0)
    ));

  let isCtaDisabled = !isFormValid || isSaving;

  let total = 0;
  if (orderBumpSelected) {
    total = ORDER_BUMP_PRICE;
  }

  return (
    <div className="min-h-screen animated-gradient-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
        }

        .animated-gradient-bg {
          background: #f9fafb;
          background-image:
            radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          animation: gradientShift 45s ease-in-out infinite;
          background-attachment: fixed;
        }

        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg,
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 251, 0.75) 100%
          );
          box-shadow:
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="water-glass-effect rounded-full px-6 py-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6"
          />
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen pt-28 pb-12 px-4">
        <Card className="max-w-2xl w-full water-glass-effect border-gray-200/30 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
              Prova Gratuita {TRIAL_DAYS} Giorni
            </CardTitle>
            <p className="text-gray-600 text-base">
              Accesso completo a tutte le funzionalità Premium
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            <div className="bg-[var(--brand-primary-light)] rounded-xl p-5 border border-[var(--brand-primary)]/20">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Piano nutrizionale personalizzato completo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Piano allenamento adattivo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Analisi AI dei pasti con foto</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">Supporto prioritario</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--brand-primary)]"/>
                <h3 className="text-xl font-bold text-gray-800">Dettagli Principali</h3>
              </div>
              <div>
                <Label htmlFor="billingName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Nome e Cognome
                </Label>
                <Input
                  id="billingName" name="name" type="text" placeholder="Mario Rossi"
                  value={billingInfo.name} onChange={handleBillingInfoChange}
                  className="h-12 text-base"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Email
                </Label>
                <Input
                  id="email" name="email" type="email" placeholder="mario.rossi@example.com"
                  value={billingInfo.email} onChange={handleBillingInfoChange}
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Numero di Telefono
                </Label>
                <div className="flex items-center gap-2">
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverOpen}
                        className="w-[130px] justify-start h-12"
                      >
                        {selectedCountry ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{countryCodeToFlag(selectedCountry.code)}</span>
                            <span>{selectedCountry.dial_code}</span>
                          </div>
                        ) : (
                          "Prefisso"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Cerca paese..." />
                        <CommandList>
                          <CommandEmpty>Nessun paese trovato.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.name} ${country.dial_code}`}
                                onSelect={() => {
                                  setSelectedCountry(country);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="mr-2 text-lg">{countryCodeToFlag(country.code)}</span>
                                <span>{country.name}</span>
                                <span className="ml-auto text-gray-500">{country.dial_code}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="phoneNumber" name="tel-national" type="tel" placeholder="333 1234567"
                    value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-base"
                    autoComplete="tel-national"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2 block">Indirizzo di Fatturazione</Label>
                <Input id="address" name="address" type="text" placeholder="Via Roma, 123"
                  value={billingInfo.address} onChange={handleBillingInfoChange}
                  className="h-12 text-base" autoComplete="address-line1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700 mb-2 block">Città</Label>
                  <Input id="city" name="city" type="text" placeholder="Milano"
                    value={billingInfo.city} onChange={handleBillingInfoChange}
                    className="h-12 text-base" autoComplete="address-level2" />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-sm font-semibold text-gray-700 mb-2 block">CAP</Label>
                  <Input id="zip" name="zip" type="text" placeholder="20121"
                    value={billingInfo.zip} onChange={handleBillingInfoChange}
                    className="h-12 text-base" autoComplete="postal-code" />
                </div>
              </div>
              <div>
                <Label htmlFor="country" className="text-sm font-semibold text-gray-700 mb-2 block">Paese</Label>
                <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryPopoverOpen}
                      className="w-full justify-between h-12 text-base font-normal"
                    >
                      {billingInfo.country
                        ? countries.find((country) => country.code === billingInfo.country)?.name
                        : "Seleziona paese..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca paese..." />
                      <CommandList>
                        <CommandEmpty>Nessun paese trovato.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={`${country.name} ${country.code}`}
                              onSelect={() => {
                                handleBillingInfoChange({ target: { name: 'country', value: country.code }});
                                setCountryPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  billingInfo.country === country.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span>{country.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="pt-4 space-y-4">
                <div
                  className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-600 hover:text-[var(--brand-primary)] transition-colors"
                  onClick={() => setShowBillingFields(!showBillingFields)}
                >
                  <Briefcase className="w-5 h-5" />
                  <span>{showBillingFields ? 'Nascondi dati fiscali' : '💼 Hai bisogno della fattura? Inserisci qui i dati fiscali'}</span>
                </div>

                {showBillingFields && (
                  <div className="p-4 bg-gray-50/50 border border-gray-200/50 rounded-xl space-y-4">
                    <RadioGroup
                      defaultValue="private"
                      onValueChange={(value) => handleBillingInfoChange({ target: { name: 'billingType', value } })}
                      className="flex gap-4"
                      value={billingInfo.billingType}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="r-private" />
                        <Label htmlFor="r-private">Privato</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="r-company" />
                        <Label htmlFor="r-company">Azienda</Label>
                      </div>
                    </RadioGroup>

                    {billingInfo.billingType === 'company' && (
                      <div>
                        <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Nome Azienda
                        </Label>
                        <Input
                          id="companyName" name="companyName" type="text" placeholder="MyWellness S.R.L."
                          value={billingInfo.companyName} onChange={handleBillingInfoChange}
                          className="h-12 text-base"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="taxId" className="text-sm font-semibold text-gray-700 mb-2 block">
                        {billingInfo.billingType === 'private' ? 'Codice Fiscale' : 'Partita IVA'}
                      </Label>
                      <Input
                        id="taxId" name="taxId" type="text"
                        placeholder={billingInfo.billingType === 'private' ? 'RSSMRA80A01H501U' : '01234567890'}
                        value={billingInfo.taxId} onChange={handleBillingInfoChange}
                        className="h-12 text-base"
                      />
                    </div>

                    {billingInfo.billingType === 'company' && (
                      <div>
                        <Label htmlFor="pecSdi" className="text-sm font-semibold text-gray-700 mb-2 block">
                          PEC o Codice SDI <span className="text-gray-400 font-normal">(Opzionale)</span>
                        </Label>
                        <Input
                          id="pecSdi" name="pecSdi" type="text" placeholder="tuamail@pec.it o XXXXXXX"
                          value={billingInfo.pecSdi} onChange={handleBillingInfoChange}
                          className="h-12 text-base"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-[var(--brand-primary)]"/>
                <h3 className="text-xl font-bold text-gray-800">Dati Carta</h3>
              </div>
              
              <div>
                <Label htmlFor="cardNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Numero Carta
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input id="cardNumber" type="tel" placeholder="1234 5678 9012 3456"
                    value={cardData.number} onChange={handleCardNumberChange}
                    className="h-12 text-base pl-10" autoComplete="cc-number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-sm font-semibold text-gray-700 mb-2 block">Scadenza</Label>
                  <Input id="expiry" type="text" placeholder="MM/YY"
                    value={cardData.expiry} onChange={handleExpiryChange}
                    className="h-12 text-base" autoComplete="cc-exp" />
                </div>
                <div>
                  <Label htmlFor="cvc" className="text-sm font-semibold text-gray-700 mb-2 block">CVC</Label>
                  <Input id="cvc" type="text" placeholder="123"
                    value={cardData.cvc} onChange={handleCvcChange}
                    className="h-12 text-base" autoComplete="cc-csc" />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="save-card" checked={saveCard} onCheckedChange={setSaveCard} />
                <Label htmlFor="save-card" className="text-sm font-normal text-gray-600 cursor-pointer">
                  Salva questa carta per pagamenti futuri
                </Label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200/50">
              <Label htmlFor="orderBump" className="block cursor-pointer">
                <div className="bg-green-50/50 border-2 border-dashed border-green-400 rounded-xl p-5 space-y-3 transition-all duration-300 hover:bg-green-100/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-grow">
                      <p className="text-lg font-bold text-gray-900">
                        Si, lo voglio!
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Aggiungi "Mastery AI Wellness": video corso completo
                      </p>
                    </div>
                    <Checkbox id="orderBump" checked={orderBumpSelected} onCheckedChange={setOrderBumpSelected}
                      className="w-8 h-8 flex-shrink-0 border-gray-400 data-[state=checked]:bg-[var(--brand-primary)]" />
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 line-through text-sm mr-2">€49.99</span>
                    <span className="text-2xl font-bold text-green-600">€{ORDER_BUMP_PRICE.toFixed(2)}</span>
                  </div>
                </div>
              </Label>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                <Label htmlFor="terms" className="text-xs text-gray-600">
                  Accetto i <a href={createPageUrl('Terms')} target="_blank" className="underline hover:text-[var(--brand-primary)]">Termini e Condizioni</a> del servizio.*
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} />
                <Label htmlFor="privacy" className="text-xs text-gray-600">
                  Dichiaro di aver letto la <a href={createPageUrl('Privacy')} target="_blank" className="underline hover:text-[var(--brand-primary)]">Privacy Policy</a> e acconsento al trattamento dei dati.*
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox id="marketing" checked={marketingConsent} onCheckedChange={setMarketingConsent} />
                <Label htmlFor="marketing" className="text-xs text-gray-600">
                  Acconsento a ricevere comunicazioni di marketing e newsletter.
                </Label>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
              <Shield className="w-4 h-4" />
              <span>Pagamento sicuro e crittografato</span>
            </div>

            <div className="bg-gray-50/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Oggi (Prova {TRIAL_DAYS} Giorni)</span>
                <span className="font-semibold">€{total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Dopo {TRIAL_DAYS} giorni: €39/mese (puoi cancellare in qualsiasi momento)
              </p>
            </div>

            <Button
              onClick={handleCompleteSetup}
              disabled={isCtaDisabled}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Attivazione...
                </div>
              ) : (
                `Inizia Prova Gratuita (€${total.toFixed(2)} oggi)`
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Nessun addebito durante i {TRIAL_DAYS} giorni di prova. Cancella in qualsiasi momento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
