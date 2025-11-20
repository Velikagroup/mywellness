import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Users,
  Search,
  Download,
  Upload,
  Eye,
  TrendingUp,
  DollarSign,
  UserCheck,
  Filter,
  ArrowRight,
  CheckCircle,
  XCircle,
  User,
  Activity,
  CreditCard,
  MapPin,
  AlertCircle
} from 'lucide-react';
import ClientDetailModal from '../components/admin/ClientDetailModal';

export default function AdminClients() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Import mapping state
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [detectedSeparator, setDetectedSeparator] = useState(',');
  const [parseDebugInfo, setParseDebugInfo] = useState(null);
  
  const [stats, setStats] = useState({
    totalClients: 0,
    maleCount: 0,
    femaleCount: 0,
    malePercentage: 0,
    femalePercentage: 0,
    repurchaseRate: 0,
    avgLifetimeValue: 0
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  // Campi raggruppati logicamente
  const fieldGroups = {
    base: {
      title: "📋 Informazioni Base",
      icon: User,
      fields: [
        { value: 'email', label: '📧 Email', required: true },
        { value: 'full_name', label: '👤 Nome Completo' },
        { value: 'phone_number', label: '📱 Telefono' },
        { value: 'gender', label: '⚧ Genere (male/female)' },
        { value: 'age', label: '🎂 Età' },
        { value: 'language', label: '🌍 Lingua (it/en/es/fr/de/pt)' }
      ]
    },
    physical: {
      title: "💪 Dati Fisici",
      icon: Activity,
      fields: [
        { value: 'current_weight', label: '⚖️ Peso Attuale (kg)' },
        { value: 'target_weight', label: '🎯 Peso Obiettivo (kg)' },
        { value: 'height', label: '📏 Altezza (cm)' }
      ]
    },
    subscription: {
      title: "💼 Abbonamento",
      icon: CreditCard,
      fields: [
        { value: 'subscription_plan', label: '📦 Piano (base/pro/premium)' },
        { value: 'subscription_status', label: '📊 Stato (trial/active/expired/cancelled)' }
      ]
    },
    billing: {
      title: "🏢 Fatturazione",
      icon: MapPin,
      fields: [
        { value: 'billing_address', label: '📍 Indirizzo' },
        { value: 'billing_city', label: '🏙️ Città' },
        { value: 'billing_zip', label: '📮 CAP' },
        { value: 'billing_country', label: '🌐 Paese' },
        { value: 'company_name', label: '🏢 Nome Azienda' },
        { value: 'tax_id', label: '💳 Partita IVA/Codice Fiscale' }
      ]
    }
  };

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
      await loadClients();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  const loadClients = async () => {
    try {
      const response = await base44.functions.invoke('adminListAllUsers');
      const allClients = response.data?.users || [];
      console.log('📊 Loaded clients:', allClients.length, allClients);
      setClients(allClients);
      setFilteredClients(allClients);
      calculateStats(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Errore caricamento clienti: ' + error.message);
    }
  };

  const calculateStats = (clientsList) => {
    const totalClients = clientsList.length;
    const maleCount = clientsList.filter(c => c.gender === 'male').length;
    const femaleCount = clientsList.filter(c => c.gender === 'female').length;
    
    const clientsWithPurchases = clientsList.filter(c => c.last_payment_amount && c.last_payment_amount > 0);
    const totalRevenue = clientsList.reduce((sum, c) => sum + (c.last_payment_amount || 0), 0);
    const avgLifetimeValue = totalClients > 0 ? totalRevenue / totalClients : 0;
    
    const repeatCustomers = clientsWithPurchases.filter(c => {
      return c.subscription_status === 'active' && c.last_payment_date;
    }).length;
    const repurchaseRate = clientsWithPurchases.length > 0 ? (repeatCustomers / clientsWithPurchases.length) * 100 : 0;

    setStats({
      totalClients,
      maleCount,
      femaleCount,
      malePercentage: totalClients > 0 ? (maleCount / totalClients) * 100 : 0,
      femalePercentage: totalClients > 0 ? (femaleCount / totalClients) * 100 : 0,
      repurchaseRate,
      avgLifetimeValue
    });
  };

  useEffect(() => {
    let filtered = clients;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.subscription_status === filterStatus);
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(c => c.subscription_plan === filterPlan);
    }

    setFilteredClients(filtered);
  }, [searchQuery, filterStatus, filterPlan, clients]);

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleExportClients = () => {
    try {
      const csvRows = [];
      
      const headers = [
        'Nome Completo',
        'Email',
        'Telefono',
        'Genere',
        'Età',
        'Piano',
        'Stato Abbonamento',
        'Data Iscrizione',
        'Scadenza Abbonamento',
        'Spesa Totale (€)',
        'Ultimo Pagamento',
        'Lingua',
        'Sorgente Traffico',
        'Peso Attuale (kg)',
        'Peso Obiettivo (kg)',
        'Altezza (cm)',
        'BMR (kcal)',
        'Massa Grassa (%)',
        'Landing Offer',
        'Città',
        'Paese',
        'Quiz Completato'
      ];
      csvRows.push(headers.join(','));

      clients.forEach(c => {
        const row = [
          `"${(c.full_name || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.phone_number || '').replace(/"/g, '""')}"`,
          c.gender === 'male' ? 'Uomo' : c.gender === 'female' ? 'Donna' : '',
          c.age || '',
          c.subscription_plan || '',
          c.subscription_status || '',
          c.created_date ? new Date(c.created_date).toLocaleDateString('it-IT') : '',
          c.subscription_period_end ? new Date(c.subscription_period_end).toLocaleDateString('it-IT') : '',
          (c.last_payment_amount || 0).toFixed(2),
          c.last_payment_date ? new Date(c.last_payment_date).toLocaleDateString('it-IT') : '',
          c.language || 'it',
          c.traffic_source || '',
          c.current_weight || '',
          c.target_weight || '',
          c.height || '',
          c.bmr || '',
          c.body_fat_percentage || '',
          c.purchased_landing_offer ? 'Sì' : 'No',
          `"${(c.billing_city || '').replace(/"/g, '""')}"`,
          c.billing_country || '',
          c.quiz_completed ? 'Sì' : 'No'
        ];
        csvRows.push(row.join(','));
      });

      const BOM = '\uFEFF';
      const csvContent = BOM + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clienti_mywellness_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      alert(`✅ Esportati ${clients.length} clienti con successo!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Errore durante l\'esportazione: ' + error.message);
    }
  };

  const handleImportClients = () => {
    fileInputRef.current?.click();
  };

  // Funzione per rilevare il separatore
  const detectSeparator = (text) => {
    const firstLine = text.split(/\r?\n/)[0];
    const separators = [',', ';', '\t', '|'];
    
    let maxCount = 0;
    let detectedSep = ',';
    
    for (const sep of separators) {
      const escapedSep = sep === '\t' ? '\t' : ('\\' + sep);
      const regex = sep === '\t' ? /\t/g : new RegExp(escapedSep, 'g');
      const count = (firstLine.match(regex) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detectedSep = sep;
      }
    }
    
    console.log('🔍 Separatore rilevato:', detectedSep === '\t' ? 'TAB' : detectedSep, '- Occorrenze:', maxCount);
    return detectedSep;
  };

  // PARSER CSV COMPLETAMENTE RISCRITTO - Gestisce newline dentro celle quotate
  const parseCSV = (text, separator = ',') => {
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    
    console.log('📄 Inizio parsing - Lunghezza testo:', cleanText.length, 'caratteri');
    
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Quote doppia dentro cella quotata = quote letterale
          currentCell += '"';
          i++; // Skip prossimo carattere
        } else {
          // Toggle stato quotes
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        // Fine cella
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        // Fine riga (solo se NON dentro quotes)
        currentRow.push(currentCell.trim());
        
        // Aggiungi riga solo se ha almeno UNA cella con contenuto
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        
        currentRow = [];
        currentCell = '';
        
        // Skip \n se era \r\n
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else if (char !== '\r') {
        // Aggiungi carattere alla cella (skip solo \r standalone)
        currentCell += char;
      }
    }
    
    // Aggiungi ultima cella e riga
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
    }
    
    console.log('🎯 PARSING COMPLETATO:');
    console.log('  📊 Righe totali:', rows.length);
    console.log('  📋 Header:', rows[0]);
    console.log('  🔢 Colonne attese:', rows[0]?.length);
    console.log('  📝 Prima riga dati:', rows[1]);
    console.log('  📝 Seconda riga dati:', rows[2]);
    
    // Validazione: controlla righe con numero colonne diverso
    if (rows.length > 0) {
      const expectedCols = rows[0].length;
      const invalidRows = rows.slice(1).filter(row => row.length !== expectedCols);
      if (invalidRows.length > 0) {
        console.warn(`⚠️ ATTENZIONE: ${invalidRows.length} righe hanno numero di colonne diverso da ${expectedCols}`);
        console.warn('  📌 Esempi righe problematiche:', invalidRows.slice(0, 3).map(r => `${r.length} colonne`));
      }
    }
    
    return rows;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('❌ Per favore seleziona un file CSV');
      return;
    }

    try {
      console.log('📁 File selezionato:', file.name, '- Dimensione:', (file.size / 1024).toFixed(1), 'KB');
      
      const text = await file.text();
      
      console.log('📄 File caricato - Lunghezza:', text.length, 'caratteri');
      
      // Rileva il separatore automaticamente
      const separator = detectSeparator(text);
      setDetectedSeparator(separator);
      
      const parsedData = parseCSV(text, separator);
      
      if (parsedData.length < 2) {
        alert('❌ File CSV vuoto o non valido');
        return;
      }

      const headers = parsedData[0];
      const dataRows = parsedData.slice(1);
      
      // Debug info
      const debugInfo = {
        fileName: file.name,
        fileSize: file.size,
        totalParsedLines: parsedData.length,
        headerColumns: headers.length,
        dataRowsCount: dataRows.length,
        separator: separator === '\t' ? 'TAB' : separator,
        firstHeader: headers[0],
        lastHeader: headers[headers.length - 1]
      };
      
      console.log('✅ RIEPILOGO FINALE:', debugInfo);
      setParseDebugInfo(debugInfo);

      setCsvHeaders(headers);
      setCsvData(dataRows);
      
      // Auto-mappatura intelligente
      const autoMapping = {};
      headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('email') || lowerHeader === 'e-mail') {
          autoMapping[index] = 'email';
        } else if ((lowerHeader.includes('nome') && !lowerHeader.includes('cognome')) || lowerHeader === 'name' || lowerHeader === 'firstname') {
          autoMapping[index] = 'full_name';
        } else if (lowerHeader.includes('telefono') || lowerHeader.includes('phone') || lowerHeader.includes('cellulare')) {
          autoMapping[index] = 'phone_number';
        } else if (lowerHeader.includes('genere') || lowerHeader === 'gender' || lowerHeader === 'sesso' || lowerHeader === 'sex') {
          autoMapping[index] = 'gender';
        } else if (lowerHeader === 'età' || lowerHeader === 'age' || lowerHeader === 'eta') {
          autoMapping[index] = 'age';
        } else if (lowerHeader.includes('piano') || lowerHeader === 'plan') {
          autoMapping[index] = 'subscription_plan';
        } else if (lowerHeader.includes('stato') || lowerHeader === 'status') {
          autoMapping[index] = 'subscription_status';
        } else if (lowerHeader.includes('lingua') || lowerHeader === 'language' || lowerHeader === 'lang') {
          autoMapping[index] = 'language';
        } else if (lowerHeader.includes('peso attuale') || lowerHeader === 'current_weight' || lowerHeader === 'weight') {
          autoMapping[index] = 'current_weight';
        } else if (lowerHeader.includes('peso obiettivo') || lowerHeader.includes('target weight')) {
          autoMapping[index] = 'target_weight';
        } else if (lowerHeader.includes('altezza') || lowerHeader === 'height') {
          autoMapping[index] = 'height';
        } else if (lowerHeader.includes('città') || lowerHeader === 'city' || lowerHeader === 'citta') {
          autoMapping[index] = 'billing_city';
        } else if (lowerHeader.includes('paese') || lowerHeader === 'country') {
          autoMapping[index] = 'billing_country';
        } else if (lowerHeader.includes('indirizzo') || lowerHeader === 'address') {
          autoMapping[index] = 'billing_address';
        } else if (lowerHeader === 'cap' || lowerHeader === 'zip' || lowerHeader.includes('postal')) {
          autoMapping[index] = 'billing_zip';
        } else if (lowerHeader.includes('azienda') || lowerHeader.includes('company')) {
          autoMapping[index] = 'company_name';
        } else if (lowerHeader.includes('iva') || lowerHeader.includes('tax') || lowerHeader.includes('fiscale') || lowerHeader === 'vat') {
          autoMapping[index] = 'tax_id';
        } else {
          autoMapping[index] = '';
        }
      });

      setColumnMapping(autoMapping);
      setShowMappingDialog(true);
      
    } catch (error) {
      console.error('File parse error:', error);
      alert('❌ Errore durante la lettura del file: ' + error.message);
    }

    event.target.value = '';
  };

  const handleMappingChange = (columnIndex, fieldValue) => {
    setColumnMapping(prev => ({
      ...prev,
      [columnIndex]: fieldValue
    }));
  };

  const handleConfirmImport = async () => {
    const emailMapped = Object.values(columnMapping).includes('email');
    if (!emailMapped) {
      alert('❌ Devi mappare almeno la colonna Email per procedere con l\'importazione');
      return;
    }

    const confirmMsg = `Procedere con l'importazione di ${csvData.length} utenti?\n\nSaranno ignorati gli utenti con email già esistente.`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    setIsImporting(true);
    setShowMappingDialog(false);

    try {
      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (const row of csvData) {
        const userData = {};
        
        Object.keys(columnMapping).forEach(colIndex => {
          const fieldName = columnMapping[colIndex];
          if (fieldName && row[colIndex]) {
            let value = row[colIndex].trim();
            
            if (fieldName === 'age' || fieldName === 'current_weight' || fieldName === 'target_weight' || fieldName === 'height') {
              value = parseFloat(value) || null;
            } else if (fieldName === 'gender') {
              value = value.toLowerCase();
              if (value === 'uomo' || value === 'm' || value === 'maschio' || value === 'male') value = 'male';
              else if (value === 'donna' || value === 'f' || value === 'femmina' || value === 'female') value = 'female';
            } else if (fieldName === 'subscription_plan') {
              value = value.toLowerCase();
            } else if (fieldName === 'subscription_status') {
              value = value.toLowerCase();
            } else if (fieldName === 'language') {
              value = value.toLowerCase().substring(0, 2);
            }
            
            if (value) {
              userData[fieldName] = value;
            }
          }
        });

        if (!userData.email) {
          skipped++;
          continue;
        }

        try {
          const existing = await base44.entities.User.filter({ email: userData.email });
          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }

          userData.role = 'user';
          if (!userData.subscription_plan) userData.subscription_plan = 'base';
          if (!userData.subscription_status) userData.subscription_status = 'trial';
          if (!userData.language) userData.language = 'it';

          await base44.entities.User.create(userData);
          imported++;
          
        } catch (error) {
          console.error(`Error importing ${userData.email}:`, error);
          errors.push(userData.email);
          skipped++;
        }
      }

      let message = `✅ Importazione completata!\n\n• ${imported} utenti importati\n• ${skipped} utenti saltati`;
      if (errors.length > 0) {
        message += `\n\nErrori su: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}`;
      }
      
      alert(message);
      await loadClients();
      
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Errore durante l\'importazione: ' + error.message);
    }

    setIsImporting(false);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Clienti</h1>
            <p className="text-gray-600">Database completo degli utenti MyWellness</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={handleImportClients}
              disabled={isImporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-primary)]"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importa CSV
                </>
              )}
            </Button>
            <Button
              onClick={handleExportClients}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Esporta CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Totale Clienti</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uomini / Donne</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">{stats.malePercentage.toFixed(0)}%</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-lg font-bold text-pink-600">{stats.femalePercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tasso Riacquisto</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.repurchaseRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">LTV Medio</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.avgLifetimeValue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Cerca per nome o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] h-12"
              >
                <option value="all">Tutti gli Stati</option>
                <option value="trial">Trial</option>
                <option value="active">Attivi</option>
                <option value="expired">Scaduti</option>
                <option value="cancelled">Cancellati</option>
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] h-12"
              >
                <option value="all">Tutti i Piani</option>
                <option value="base">Base</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista Clienti ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(client.full_name || client.email || 'U')[0].toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{client.full_name || 'Nome non disponibile'}</h3>
                        {client.gender && (
                          <span className="text-lg">{client.gender === 'male' ? '♂️' : '♀️'}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {client.subscription_status && (
                          <Badge className={
                            client.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            client.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                            client.subscription_status === 'expired' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {client.subscription_status}
                          </Badge>
                        )}
                        {client.subscription_plan && (
                          <Badge className="bg-purple-100 text-purple-700">
                            {client.subscription_plan}
                          </Badge>
                        )}
                        {client.language && (
                          <Badge variant="outline">
                            {client.language === 'it' ? '🇮🇹' : client.language === 'en' ? '🇬🇧' : client.language.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Spesa Totale</p>
                    <p className="text-xl font-bold text-[var(--brand-primary)]">
                      €{(client.last_payment_amount || 0).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Dettagli
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredClients.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Nessun cliente trovato
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Mapping Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 flex-wrap">
              🎯 Mappatura Colonne CSV
              <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-1">
                {csvData.length} righe dati • {csvHeaders.length} colonne
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 text-sm px-3 py-1">
                Separatore: {detectedSeparator === '\t' ? 'TAB' : detectedSeparator === ',' ? 'Virgola' : detectedSeparator === ';' ? 'Punto e virgola' : detectedSeparator}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-6 pr-2">
            {/* Debug Info Box */}
            {parseDebugInfo && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900 mb-2">🔍 Info Parsing File</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-amber-800">
                      <p>📁 File: <strong>{parseDebugInfo.fileName}</strong></p>
                      <p>📏 Dimensione: <strong>{(parseDebugInfo.fileSize / 1024).toFixed(1)} KB</strong></p>
                      <p>📊 Righe totali parsate: <strong>{parseDebugInfo.totalParsedLines}</strong></p>
                      <p>📋 Righe dati (senza header): <strong>{parseDebugInfo.dataRowsCount}</strong></p>
                      <p>🔢 Colonne: <strong>{parseDebugInfo.headerColumns}</strong></p>
                      <p>🔧 Separatore: <strong>{parseDebugInfo.separator}</strong></p>
                    </div>
                    <p className="text-xs text-amber-700 mt-2 italic">
                      Controlla la console del browser (F12) per log dettagliati del parsing
                    </p>
                  </div>
                </div>
              </div>
            )}
          
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 mb-2 text-lg">📋 Come Funziona</p>
                  <p className="text-blue-800 leading-relaxed">
                    Per ogni colonna del tuo CSV, seleziona il campo MyWellness corrispondente. 
                    Usa <strong>"❌ Non importare"</strong> per le colonne che non ti servono. 
                    <strong className="text-red-600 ml-1">L'email è obbligatoria per procedere.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* OGNI COLONNA IN UN BOX SEPARATO */}
            <div className="space-y-4">
              {csvHeaders.map((header, index) => (
                <Card key={index} className="border-2 border-gray-200 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-12 gap-6 items-center">
                      {/* Colonna CSV */}
                      <div className="col-span-3">
                        <Label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wide">
                          Colonna CSV #{index + 1}
                        </Label>
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300 rounded-xl p-4">
                          <p className="font-bold text-gray-900 text-lg break-words">
                            {header || `Colonna ${index + 1}`}
                          </p>
                        </div>
                      </div>

                      {/* Freccia */}
                      <div className="col-span-1 flex justify-center">
                        <div className="w-12 h-12 bg-[var(--brand-primary)] rounded-full flex items-center justify-center">
                          <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Campo MyWellness */}
                      <div className="col-span-4">
                        <Label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wide">
                          Assegna a Campo MyWellness
                        </Label>
                        <select
                          value={columnMapping[index] || ''}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                          className="w-full px-4 py-3 text-base font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] bg-white"
                        >
                          <option value="">❌ Non importare questa colonna</option>
                          
                          <optgroup label="📋 INFORMAZIONI BASE">
                            <option value="email">📧 Email (OBBLIGATORIA)</option>
                            <option value="full_name">👤 Nome Completo</option>
                            <option value="phone_number">📱 Telefono</option>
                            <option value="gender">⚧ Genere (male/female)</option>
                            <option value="age">🎂 Età</option>
                            <option value="language">🌍 Lingua (it/en/es/fr/de/pt)</option>
                          </optgroup>
                          
                          <optgroup label="💪 DATI FISICI">
                            <option value="current_weight">⚖️ Peso Attuale (kg)</option>
                            <option value="target_weight">🎯 Peso Obiettivo (kg)</option>
                            <option value="height">📏 Altezza (cm)</option>
                          </optgroup>
                          
                          <optgroup label="💼 ABBONAMENTO">
                            <option value="subscription_plan">📦 Piano (base/pro/premium)</option>
                            <option value="subscription_status">📊 Stato Abbonamento</option>
                          </optgroup>
                          
                          <optgroup label="🏢 FATTURAZIONE">
                            <option value="billing_address">📍 Indirizzo</option>
                            <option value="billing_city">🏙️ Città</option>
                            <option value="billing_zip">📮 CAP</option>
                            <option value="billing_country">🌐 Paese</option>
                            <option value="company_name">🏢 Nome Azienda</option>
                            <option value="tax_id">💳 P.IVA/Codice Fiscale</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Preview Dati */}
                      <div className="col-span-4">
                        <Label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wide">
                          📊 Preview Prime 3 Righe
                        </Label>
                        <div className="space-y-2">
                          {csvData.slice(0, 3).map((row, rowIdx) => (
                            <div key={rowIdx} className="bg-white border-2 border-gray-200 rounded-lg p-3">
                              <span className="text-sm font-mono text-gray-800 break-all">
                                {row[index] ? (
                                  row[index].length > 50 ? row[index].substring(0, 50) + '...' : row[index]
                                ) : <span className="text-gray-400 italic">(vuoto)</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200 mt-6 bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center gap-4">
              {Object.values(columnMapping).includes('email') ? (
                <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl px-6 py-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                  <div>
                    <p className="font-bold text-lg text-green-900">Email Mappato ✓</p>
                    <p className="text-sm text-green-700">Pronto per importare</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl px-6 py-3">
                  <XCircle className="w-7 h-7 text-red-600" />
                  <div>
                    <p className="font-bold text-lg text-red-900">Email Non Mappato!</p>
                    <p className="text-sm text-red-700">Campo obbligatorio mancante</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowMappingDialog(false)}
                variant="outline"
                className="px-8 py-6 text-base"
              >
                Annulla
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={!Object.values(columnMapping).includes('email')}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-8 py-6 text-base font-bold"
              >
                <Upload className="w-5 h-5 mr-2" />
                Conferma Importazione ({csvData.length} Utenti)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClient(null);
          }}
          onUpdate={loadClients}
        />
      )}
    </div>
  );
}