
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const COUNTRIES = [
  // Europa
  { code: 'IT', name: 'Italia', defaultTax: 22, defaultName: 'IVA' },
  { code: 'ES', name: 'Spagna', defaultTax: 21, defaultName: 'IVA' },
  { code: 'ES-CN', name: 'Isole Canarie (Spagna)', defaultTax: 7, defaultName: 'IGIC' },
  { code: 'GB', name: 'Regno Unito', defaultTax: 20, defaultName: 'VAT' },
  { code: 'FR', name: 'Francia', defaultTax: 20, defaultName: 'TVA' },
  { code: 'DE', name: 'Germania', defaultTax: 19, defaultName: 'MwSt' },
  { code: 'CH', name: 'Svizzera', defaultTax: 7.7, defaultName: 'IVA' },
  { code: 'AT', name: 'Austria', defaultTax: 20, defaultName: 'USt' },
  { code: 'BE', name: 'Belgio', defaultTax: 21, defaultName: 'BTW/TVA' },
  { code: 'NL', name: 'Paesi Bassi', defaultTax: 21, defaultName: 'BTW' },
  { code: 'PT', name: 'Portogallo', defaultTax: 23, defaultName: 'IVA' },
  { code: 'GR', name: 'Grecia', defaultTax: 24, defaultName: 'ΦΠΑ' },
  { code: 'IE', name: 'Irlanda', defaultTax: 23, defaultName: 'VAT' },
  { code: 'PL', name: 'Polonia', defaultTax: 23, defaultName: 'VAT' },
  { code: 'SE', name: 'Svezia', defaultTax: 25, defaultName: 'Moms' },
  { code: 'DK', name: 'Danimarca', defaultTax: 25, defaultName: 'Moms' },
  { code: 'FI', name: 'Finlandia', defaultTax: 24, defaultName: 'ALV' },
  { code: 'NO', name: 'Norvegia', defaultTax: 25, defaultName: 'MVA' },
  { code: 'IS', name: 'Islanda', defaultTax: 24, defaultName: 'VSK' },
  { code: 'CZ', name: 'Repubblica Ceca', defaultTax: 21, defaultName: 'DPH' },
  { code: 'HU', name: 'Ungheria', defaultTax: 27, defaultName: 'ÁFA' },
  { code: 'RO', name: 'Romania', defaultTax: 19, defaultName: 'TVA' },
  { code: 'BG', name: 'Bulgaria', defaultTax: 20, defaultName: 'ДДС' },
  { code: 'HR', name: 'Croazia', defaultTax: 25, defaultName: 'PDV' },
  { code: 'SK', name: 'Slovacchia', defaultTax: 20, defaultName: 'DPH' },
  { code: 'SI', name: 'Slovenia', defaultTax: 22, defaultName: 'DDV' },
  { code: 'LT', name: 'Lituania', defaultTax: 21, defaultName: 'PVM' },
  { code: 'LV', name: 'Lettonia', defaultTax: 21, defaultName: 'PVN' },
  { code: 'EE', name: 'Estonia', defaultTax: 20, defaultName: 'KM' },
  { code: 'LU', name: 'Lussemburgo', defaultTax: 17, defaultName: 'TVA' },
  { code: 'MT', name: 'Malta', defaultTax: 18, defaultName: 'VAT' },
  { code: 'CY', name: 'Cipro', defaultTax: 19, defaultName: 'VAT' },
  { code: 'RS', name: 'Serbia', defaultTax: 20, defaultName: 'PDV' },
  { code: 'ME', name: 'Montenegro', defaultTax: 21, defaultName: 'PDV' },
  { code: 'MK', name: 'Macedonia del Nord', defaultTax: 18, defaultName: 'DDV' },
  { code: 'AL', name: 'Albania', defaultTax: 20, defaultName: 'TVSH' },
  { code: 'BA', name: 'Bosnia ed Erzegovina', defaultTax: 17, defaultName: 'PDV' },
  { code: 'XK', name: 'Kosovo', defaultTax: 18, defaultName: 'TVSH' },
  { code: 'MD', name: 'Moldavia', defaultTax: 20, defaultName: 'TVA' },
  { code: 'UA', name: 'Ucraina', defaultTax: 20, defaultName: 'ПДВ' },
  { code: 'BY', name: 'Bielorussia', defaultTax: 20, defaultName: 'НДС' },
  { code: 'RU', name: 'Russia', defaultTax: 20, defaultName: 'НДС' },
  { code: 'TR', name: 'Turchia', defaultTax: 18, defaultName: 'KDV' },
  { code: 'GE', name: 'Georgia', defaultTax: 18, defaultName: 'VAT' },
  { code: 'AM', name: 'Armenia', defaultTax: 20, defaultName: 'VAT' },
  { code: 'AZ', name: 'Azerbaigian', defaultTax: 18, defaultName: 'VAT' },
  
  // Nord America
  { code: 'US', name: 'Stati Uniti', defaultTax: 0, defaultName: 'Sales Tax' },
  { code: 'CA', name: 'Canada', defaultTax: 5, defaultName: 'GST' },
  { code: 'MX', name: 'Messico', defaultTax: 16, defaultName: 'IVA' },
  
  // Centro e Sud America
  { code: 'BR', name: 'Brasile', defaultTax: 17, defaultName: 'ICMS' },
  { code: 'AR', name: 'Argentina', defaultTax: 21, defaultName: 'IVA' },
  { code: 'CL', name: 'Cile', defaultTax: 19, defaultName: 'IVA' },
  { code: 'CO', name: 'Colombia', defaultTax: 19, defaultName: 'IVA' },
  { code: 'PE', name: 'Perù', defaultTax: 18, defaultName: 'IGV' },
  { code: 'VE', name: 'Venezuela', defaultTax: 16, defaultName: 'IVA' },
  { code: 'EC', name: 'Ecuador', defaultTax: 12, defaultName: 'IVA' },
  { code: 'UY', name: 'Uruguay', defaultTax: 22, defaultName: 'IVA' },
  { code: 'PY', name: 'Paraguay', defaultTax: 10, defaultName: 'IVA' },
  { code: 'BO', name: 'Bolivia', defaultTax: 13, defaultName: 'IVA' },
  { code: 'CR', name: 'Costa Rica', defaultTax: 13, defaultName: 'IVA' },
  { code: 'PA', name: 'Panama', defaultTax: 7, defaultName: 'ITBMS' },
  { code: 'GT', name: 'Guatemala', defaultTax: 12, defaultName: 'IVA' },
  { code: 'DO', name: 'Repubblica Dominicana', defaultTax: 18, defaultName: 'ITBIS' },
  { code: 'CU', name: 'Cuba', defaultTax: 0, defaultName: 'VAT' },
  { code: 'JM', name: 'Giamaica', defaultTax: 15, defaultName: 'GCT' },
  { code: 'TT', name: 'Trinidad e Tobago', defaultTax: 12.5, defaultName: 'VAT' },
  { code: 'BB', name: 'Barbados', defaultTax: 17.5, defaultName: 'VAT' },
  { code: 'BS', name: 'Bahamas', defaultTax: 12, defaultName: 'VAT' },
  { code: 'BM', name: 'Bermuda', defaultTax: 0, defaultName: 'VAT' },
  { code: 'KY', name: 'Isole Cayman', defaultTax: 0, defaultName: 'VAT' },
  
  // Asia
  { code: 'JP', name: 'Giappone', defaultTax: 10, defaultName: '消費税' },
  { code: 'KR', name: 'Corea del Sud', defaultTax: 10, defaultName: 'VAT' },
  { code: 'CN', name: 'Cina', defaultTax: 13, defaultName: 'VAT' },
  { code: 'HK', name: 'Hong Kong', defaultTax: 0, defaultName: 'VAT' },
  { code: 'TW', name: 'Taiwan', defaultTax: 5, defaultName: 'VAT' },
  { code: 'IN', name: 'India', defaultTax: 18, defaultName: 'GST' },
  { code: 'SG', name: 'Singapore', defaultTax: 8, defaultName: 'GST' },
  { code: 'MY', name: 'Malaysia', defaultTax: 6, defaultName: 'SST' },
  { code: 'TH', name: 'Thailandia', defaultTax: 7, defaultName: 'VAT' },
  { code: 'ID', name: 'Indonesia', defaultTax: 11, defaultName: 'PPN' },
  { code: 'PH', name: 'Filippine', defaultTax: 12, defaultName: 'VAT' },
  { code: 'VN', name: 'Vietnam', defaultTax: 10, defaultName: 'VAT' },
  { code: 'BD', name: 'Bangladesh', defaultTax: 15, defaultName: 'VAT' },
  { code: 'PK', name: 'Pakistan', defaultTax: 17, defaultName: 'GST' },
  { code: 'LK', name: 'Sri Lanka', defaultTax: 15, defaultName: 'VAT' },
  { code: 'NP', name: 'Nepal', defaultTax: 13, defaultName: 'VAT' },
  { code: 'MM', name: 'Myanmar', defaultTax: 5, defaultName: 'VAT' },
  { code: 'KH', name: 'Cambogia', defaultTax: 10, defaultName: 'VAT' },
  { code: 'LA', name: 'Laos', defaultTax: 10, defaultName: 'VAT' },
  { code: 'MO', name: 'Macao', defaultTax: 0, defaultName: 'VAT' },
  { code: 'BN', name: 'Brunei', defaultTax: 0, defaultName: 'GST' },
  { code: 'MV', name: 'Maldive', defaultTax: 6, defaultName: 'GST' },
  
  // Medio Oriente
  { code: 'AE', name: 'Emirati Arabi', defaultTax: 5, defaultName: 'VAT' },
  { code: 'SA', name: 'Arabia Saudita', defaultTax: 15, defaultName: 'VAT' },
  { code: 'IL', name: 'Israele', defaultTax: 17, defaultName: 'VAT' },
  { code: 'QA', name: 'Qatar', defaultTax: 0, defaultName: 'VAT' },
  { code: 'KW', name: 'Kuwait', defaultTax: 0, defaultName: 'VAT' },
  { code: 'BH', name: 'Bahrain', defaultTax: 10, defaultName: 'VAT' },
  { code: 'OM', name: 'Oman', defaultTax: 5, defaultName: 'VAT' },
  { code: 'JO', name: 'Giordania', defaultTax: 16, defaultName: 'GST' },
  { code: 'LB', name: 'Libano', defaultTax: 11, defaultName: 'VAT' },
  { code: 'IQ', name: 'Iraq', defaultTax: 0, defaultName: 'VAT' },
  { code: 'IR', name: 'Iran', defaultTax: 9, defaultName: 'VAT' },
  
  // Africa
  { code: 'ZA', name: 'Sudafrica', defaultTax: 15, defaultName: 'VAT' },
  { code: 'EG', name: 'Egitto', defaultTax: 14, defaultName: 'VAT' },
  { code: 'NG', name: 'Nigeria', defaultTax: 7.5, defaultName: 'VAT' },
  { code: 'KE', name: 'Kenya', defaultTax: 16, defaultName: 'VAT' },
  { code: 'MA', name: 'Marocco', defaultTax: 20, defaultName: 'TVA' },
  { code: 'TN', name: 'Tunisia', defaultTax: 19, defaultName: 'TVA' },
  { code: 'DZ', name: 'Algeria', defaultTax: 19, defaultName: 'TVA' },
  { code: 'GH', name: 'Ghana', defaultTax: 12.5, defaultName: 'VAT' },
  { code: 'ET', name: 'Etiopia', defaultTax: 15, defaultName: 'VAT' },
  { code: 'TZ', name: 'Tanzania', defaultTax: 18, defaultName: 'VAT' },
  { code: 'UG', name: 'Uganda', defaultTax: 18, defaultName: 'VAT' },
  { code: 'SN', name: 'Senegal', defaultTax: 18, defaultName: 'TVA' },
  { code: 'CI', name: 'Costa d\'Avorio', defaultTax: 18, defaultName: 'TVA' },
  { code: 'CM', name: 'Camerun', defaultTax: 19.25, defaultName: 'TVA' },
  { code: 'AO', name: 'Angola', defaultTax: 14, defaultName: 'IVA' },
  { code: 'MZ', name: 'Mozambico', defaultTax: 17, defaultName: 'IVA' },
  { code: 'ZW', name: 'Zimbabwe', defaultTax: 14.5, defaultName: 'VAT' },
  { code: 'BW', name: 'Botswana', defaultTax: 12, defaultName: 'VAT' },
  { code: 'MU', name: 'Mauritius', defaultTax: 15, defaultName: 'VAT' },
  { code: 'RE', name: 'Riunione (Francia)', defaultTax: 8.5, defaultName: 'TVA' },
  { code: 'SC', name: 'Seychelles', defaultTax: 15, defaultName: 'VAT' },
  
  // Oceania
  { code: 'AU', name: 'Australia', defaultTax: 10, defaultName: 'GST' },
  { code: 'NZ', name: 'Nuova Zelanda', defaultTax: 15, defaultName: 'GST' },
  { code: 'FJ', name: 'Fiji', defaultTax: 9, defaultName: 'VAT' },
  { code: 'PG', name: 'Papua Nuova Guinea', defaultTax: 10, defaultName: 'GST' },
  { code: 'NC', name: 'Nuova Caledonia', defaultTax: 11, defaultName: 'TGC' },
  { code: 'PF', name: 'Polinesia Francese', defaultTax: 16, defaultName: 'TVA' },
  { code: 'GU', name: 'Guam', defaultTax: 0, defaultName: 'Sales Tax' },
  { code: 'AS', name: 'Samoa Americane', defaultTax: 0, defaultName: 'Sales Tax' },
  { code: 'MP', name: 'Isole Marianne Settentrionali', defaultTax: 0, defaultName: 'Sales Tax' },
  
  // Territori speciali
  { code: 'GI', name: 'Gibilterra', defaultTax: 0, defaultName: 'VAT' },
  { code: 'IM', name: 'Isola di Man', defaultTax: 20, defaultName: 'VAT' },
  { code: 'JE', name: 'Jersey', defaultTax: 5, defaultName: 'GST' },
  { code: 'GG', name: 'Guernsey', defaultTax: 0, defaultName: 'VAT' },
  { code: 'FO', name: 'Isole Faroe', defaultTax: 25, defaultName: 'MVG' },
  { code: 'GL', name: 'Groenlandia', defaultTax: 0, defaultName: 'VAT' },
  { code: 'AX', name: 'Isole Åland', defaultTax: 24, defaultName: 'ALV' },
  { code: 'GP', name: 'Guadalupa (Francia)', defaultTax: 8.5, defaultName: 'TVA' },
  { code: 'MQ', name: 'Martinica (Francia)', defaultTax: 8.5, defaultName: 'TVA' },
  { code: 'GF', name: 'Guyana Francese', defaultTax: 8.5, defaultName: 'TVA' },
  { code: 'YT', name: 'Mayotte (Francia)', defaultTax: 8.5, defaultName: 'TVA' },
  { code: 'PM', name: 'Saint-Pierre e Miquelon', defaultTax: 0, defaultName: 'TVA' },
  { code: 'WF', name: 'Wallis e Futuna', defaultTax: 0, defaultName: 'TVA' },
  { code: 'BL', name: 'Saint-Barthélemy', defaultTax: 0, defaultName: 'TVA' },
  { code: 'MF', name: 'Saint-Martin (Francia)', defaultTax: 0, defaultName: 'TVA' },
  { code: 'AW', name: 'Aruba', defaultTax: 6, defaultName: 'BBO' },
  { code: 'CW', name: 'Curaçao', defaultTax: 6, defaultName: 'OB' },
  { code: 'SX', name: 'Sint Maarten', defaultTax: 5, defaultName: 'TBOS' },
  { code: 'BQ', name: 'Caraibi Olandesi', defaultTax: 0, defaultName: 'VAT' },
  { code: 'PR', name: 'Porto Rico', defaultTax: 11.5, defaultName: 'IVU' },
  { code: 'VI', name: 'Isole Vergini Americane', defaultTax: 0, defaultName: 'Sales Tax' },
];

export default function AdminSalesTax() {
  const [taxes, setTaxes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    try {
      const existingTaxes = await base44.entities.SalesTax.list();
      const taxMap = {};
      existingTaxes.forEach(tax => {
        taxMap[tax.country_code] = tax;
      });
      setTaxes(taxMap);
    } catch (error) {
      console.error('Error loading taxes:', error);
      toast.error('Errore nel caricamento delle tasse');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (countryCode) => {
    setSaving(true);
    try {
      const tax = taxes[countryCode];
      const country = COUNTRIES.find(c => c.code === countryCode);

      if (tax && tax.id) {
        // Update existing
        await base44.entities.SalesTax.update(tax.id, {
          tax_rate: tax.tax_rate,
          tax_name: tax.tax_name,
          is_active: tax.is_active
        });
      } else {
        // Create new
        const newTax = await base44.entities.SalesTax.create({
          country_code: countryCode,
          country_name: country.name,
          tax_rate: tax.tax_rate,
          tax_name: tax.tax_name,
          is_active: tax.is_active
        });
        setTaxes(prev => ({
          ...prev,
          [countryCode]: newTax
        }));
      }
      toast.success(`Tassa per ${country.name} salvata`);
    } catch (error) {
      console.error('Error saving tax:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const updates = [];
      for (const [code, tax] of Object.entries(taxes)) {
        // Only save if a tax rate has been explicitly set or if it's an existing record
        if (tax.tax_rate !== undefined || tax.id) { 
          const country = COUNTRIES.find(c => c.code === code);
          // Ensure country exists and tax_name/tax_rate are defined, use defaults if not
          const currentTaxRate = tax.tax_rate !== undefined ? tax.tax_rate : (country ? country.defaultTax : 0);
          const currentTaxName = tax.tax_name !== undefined ? tax.tax_name : (country ? country.defaultName : '');
          const currentIsActive = tax.is_active !== undefined ? tax.is_active : true;

          if (tax.id) {
            updates.push(base44.entities.SalesTax.update(tax.id, {
              tax_rate: currentTaxRate,
              tax_name: currentTaxName,
              is_active: currentIsActive
            }));
          } else if (country) { // Only create if a corresponding country exists
            updates.push(base44.entities.SalesTax.create({
              country_code: code,
              country_name: country.name,
              tax_rate: currentTaxRate,
              tax_name: currentTaxName,
              is_active: currentIsActive
            }));
          }
        }
      }
      await Promise.all(updates);
      toast.success('Tutte le tasse salvate');
      await loadTaxes(); // Reload to get newly created IDs
    } catch (error) {
      console.error('Error bulk saving:', error);
      toast.error('Errore nel salvataggio multiplo');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeDefaults = async () => {
    setSaving(true);
    try {
      const newTaxes = { ...taxes };
      for (const country of COUNTRIES) {
        if (!newTaxes[country.code] || newTaxes[country.code].tax_rate === undefined) { // Initialize if not present or tax_rate is undefined
          newTaxes[country.code] = {
            ...newTaxes[country.code], // Keep existing ID if any
            country_code: country.code,
            country_name: country.name,
            tax_rate: country.defaultTax,
            tax_name: country.defaultName,
            is_active: true // Default to active
          };
        }
      }
      setTaxes(newTaxes);
      toast.success('Valori predefiniti caricati');
    } catch (error) {
      console.error('Error initializing defaults:', error);
      toast.error('Errore');
    } finally {
      setSaving(false);
    }
  };

  const updateTax = (code, field, value) => {
    setTaxes(prev => {
      const currentTax = prev[code] || {};
      const country = COUNTRIES.find(c => c.code === code);
      return {
        ...prev,
        [code]: {
          ...currentTax,
          [field]: value,
          country_code: code,
          country_name: country?.name,
          // Ensure default values for other fields if they are not yet defined
          tax_rate: currentTax.tax_rate !== undefined ? currentTax.tax_rate : country?.defaultTax || 0,
          tax_name: currentTax.tax_name !== undefined ? currentTax.tax_name : country?.defaultName || '',
          is_active: currentTax.is_active !== undefined ? currentTax.is_active : true,
        }
      };
    });
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card className="water-glass-effect border-gray-200/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Gestione Imposte Vendita
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configura le percentuali di tasse per ogni paese
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInitializeDefaults}
                variant="outline"
                disabled={saving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Carica Predefiniti
              </Button>
              <Button
                onClick={handleBulkSave}
                disabled={saving}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
              >
                <Save className="w-4 h-4 mr-2" />
                Salva Tutto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Cerca paese..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white"
            />
          </div>

          {/* Countries List */}
          <div className="grid gap-4">
            {filteredCountries.map((country) => {
              // Ensure 'tax' object has default structure even if not in 'taxes' state
              const tax = taxes[country.code] || {
                country_code: country.code,
                country_name: country.name,
                tax_rate: country.defaultTax,
                tax_name: country.defaultName,
                is_active: true
              };

              // Use country defaults if tax object properties are undefined
              const currentTaxRate = tax.tax_rate !== undefined ? tax.tax_rate : country.defaultTax;
              const currentTaxName = tax.tax_name !== undefined ? tax.tax_name : country.defaultName;
              const currentIsActive = tax.is_active !== undefined ? tax.is_active : true;

              const baseAmount = 67;
              const rate = currentTaxRate / 100;
              const totalAmount = baseAmount; // Assuming €67 is the total price including tax for this example
              const baseExclTax = totalAmount / (1 + rate);
              const taxAmount = totalAmount - baseExclTax;

              return (
                <Card key={country.code} className="bg-white">
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-12 gap-4 items-center">
                      {/* Country */}
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{country.code === 'IT' ? '🇮🇹' : '🌍'}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{country.name}</p>
                            <p className="text-xs text-gray-500">{country.code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tax Rate */}
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-600">Percentuale (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={currentTaxRate}
                          onChange={(e) => updateTax(country.code, 'tax_rate', parseFloat(e.target.value) || 0)}
                          className="h-10 mt-1"
                        />
                      </div>

                      {/* Tax Name */}
                      <div className="md:col-span-3">
                        <Label className="text-xs text-gray-600">Nome Tassa</Label>
                        <Input
                          type="text"
                          value={currentTaxName}
                          onChange={(e) => updateTax(country.code, 'tax_name', e.target.value)}
                          placeholder="IVA, VAT, GST..."
                          className="h-10 mt-1"
                        />
                      </div>

                      {/* Example */}
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-600">Esempio (€67)</Label>
                        <div className="text-sm space-y-1 mt-1">
                          <div className="font-medium text-gray-700">
                            Tot: €{totalAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Base: €{baseExclTax.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {currentTaxName}: €{taxAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Active Toggle */}
                      <div className="md:col-span-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <Label className="text-xs text-gray-600">Attiva</Label>
                          <Checkbox
                            checked={currentIsActive}
                            onCheckedChange={(checked) => updateTax(country.code, 'is_active', checked)}
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="md:col-span-1 flex items-end justify-end">
                        <Button
                          onClick={() => handleSave(country.code)}
                          disabled={saving}
                          size="sm"
                          variant="outline"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCountries.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nessun paese trovato
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
