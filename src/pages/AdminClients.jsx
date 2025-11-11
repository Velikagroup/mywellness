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
  XCircle
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

  // Campi disponibili per la mappatura
  const availableFields = [
    { value: '', label: '❌ Non importare' },
    { value: 'email', label: '📧 Email (obbligatoria)', required: true },
    { value: 'full_name', label: '👤 Nome Completo' },
    { value: 'phone_number', label: '📱 Telefono' },
    { value: 'gender', label: '⚧ Genere (male/female)' },
    { value: 'age', label: '🎂 Età' },
    { value: 'subscription_plan', label: '💼 Piano (base/pro/premium)' },
    { value: 'subscription_status', label: '📊 Stato Abbonamento' },
    { value: 'language', label: '🌍 Lingua (it/en/es/fr/de/pt)' },
    { value: 'current_weight', label: '⚖️ Peso Attuale (kg)' },
    { value: 'target_weight', label: '🎯 Peso Obiettivo (kg)' },
    { value: 'height', label: '📏 Altezza (cm)' },
    { value: 'billing_city', label: '🏙️ Città' },
    { value: 'billing_country', label: '🌐 Paese' },
    { value: 'billing_address', label: '📍 Indirizzo' },
    { value: 'billing_zip', label: '📮 CAP' },
    { value: 'company_name', label: '🏢 Nome Azienda' },
    { value: 'tax_id', label: '💳 Partita IVA/Codice Fiscale' }
  ];

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
      const allClients = await base44.entities.User.list(['-created_date']);
      setClients(allClients);
      setFilteredClients(allClients);
      calculateStats(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
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

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const result = [];
    
    for (let line of lines) {
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('❌ Per favore seleziona un file CSV');
      return;
    }

    try {
      const text = await file.text();
      
      // Rimuovi BOM se presente
      const cleanText = text.replace(/^\uFEFF/, '');
      
      const parsedData = parseCSV(cleanText);
      
      if (parsedData.length < 2) {
        alert('❌ File CSV vuoto o non valido');
        return;
      }

      const headers = parsedData[0].map(h => h.replace(/"/g, '').trim());
      const dataRows = parsedData.slice(1).filter(row => row.some(cell => cell.trim()));

      setCsvHeaders(headers);
      setCsvData(dataRows);
      
      // Auto-mappatura intelligente
      const autoMapping = {};
      headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
          autoMapping[index] = 'email';
        } else if (lowerHeader.includes('nome') || lowerHeader.includes('name')) {
          autoMapping[index] = 'full_name';
        } else if (lowerHeader.includes('telefono') || lowerHeader.includes('phone') || lowerHeader.includes('tel')) {
          autoMapping[index] = 'phone_number';
        } else if (lowerHeader.includes('genere') || lowerHeader.includes('gender') || lowerHeader.includes('sesso')) {
          autoMapping[index] = 'gender';
        } else if (lowerHeader.includes('età') || lowerHeader.includes('age')) {
          autoMapping[index] = 'age';
        } else if (lowerHeader.includes('piano') || lowerHeader.includes('plan')) {
          autoMapping[index] = 'subscription_plan';
        } else if (lowerHeader.includes('stato') || lowerHeader.includes('status')) {
          autoMapping[index] = 'subscription_status';
        } else if (lowerHeader.includes('lingua') || lowerHeader.includes('language')) {
          autoMapping[index] = 'language';
        } else if (lowerHeader.includes('peso') && lowerHeader.includes('attuale')) {
          autoMapping[index] = 'current_weight';
        } else if (lowerHeader.includes('peso') && (lowerHeader.includes('obiettivo') || lowerHeader.includes('target'))) {
          autoMapping[index] = 'target_weight';
        } else if (lowerHeader.includes('altezza') || lowerHeader.includes('height')) {
          autoMapping[index] = 'height';
        } else if (lowerHeader.includes('città') || lowerHeader.includes('city')) {
          autoMapping[index] = 'billing_city';
        } else if (lowerHeader.includes('paese') || lowerHeader.includes('country')) {
          autoMapping[index] = 'billing_country';
        } else if (lowerHeader.includes('indirizzo') || lowerHeader.includes('address')) {
          autoMapping[index] = 'billing_address';
        } else if (lowerHeader.includes('cap') || lowerHeader.includes('zip') || lowerHeader.includes('postal')) {
          autoMapping[index] = 'billing_zip';
        } else if (lowerHeader.includes('azienda') || lowerHeader.includes('company')) {
          autoMapping[index] = 'company_name';
        } else if (lowerHeader.includes('iva') || lowerHeader.includes('tax') || lowerHeader.includes('fiscale')) {
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
    // Verifica che email sia mappato
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
        
        // Mappa i dati in base alla configurazione
        Object.keys(columnMapping).forEach(colIndex => {
          const fieldName = columnMapping[colIndex];
          if (fieldName && row[colIndex]) {
            let value = row[colIndex].trim();
            
            // Conversioni tipo
            if (fieldName === 'age' || fieldName === 'current_weight' || fieldName === 'target_weight' || fieldName === 'height') {
              value = parseFloat(value) || null;
            } else if (fieldName === 'gender') {
              value = value.toLowerCase();
              if (value === 'uomo' || value === 'm' || value === 'maschio') value = 'male';
              if (value === 'donna' || value === 'f' || value === 'femmina') value = 'female';
            } else if (fieldName === 'subscription_plan') {
              value = value.toLowerCase();
            } else if (fieldName === 'subscription_status') {
              value = value.toLowerCase();
            } else if (fieldName === 'language') {
              value = value.toLowerCase().substring(0, 2);
            }
            
            userData[fieldName] = value;
          }
        });

        if (!userData.email) {
          skipped++;
          continue;
        }

        try {
          // Verifica se esiste già
          const existing = await base44.entities.User.filter({ email: userData.email });
          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }

          // Aggiungi campi default
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

        {/* Stats Cards */}
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

        {/* Filters & Search */}
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

        {/* Clients Table */}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">🎯 Mappatura Colonne CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <strong>📋 Istruzioni:</strong> Associa ogni colonna del tuo CSV a un campo di MyWellness. 
                Puoi selezionare "Non importare" per le colonne che non ti servono. 
                <strong className="text-red-600"> L'email è obbligatoria.</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                📊 Preview dati: {csvData.length} righe trovate
              </p>
            </div>

            <div className="space-y-4">
              {csvHeaders.map((header, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                        Colonna CSV:
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {header || `Colonna ${index + 1}`}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                        Campo MyWellness:
                      </Label>
                      <select
                        value={columnMapping[index] || ''}
                        onChange={(e) => handleMappingChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      >
                        {availableFields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview dati */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Preview prime 3 righe:</p>
                    <div className="flex gap-2">
                      {csvData.slice(0, 3).map((row, rowIndex) => (
                        <Badge key={rowIndex} variant="outline" className="text-xs">
                          {row[index] || '(vuoto)'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {Object.values(columnMapping).includes('email') ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Email mappato ✓</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Email non mappato - obbligatorio!</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowMappingDialog(false)}
                  variant="outline"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={!Object.values(columnMapping).includes('email')}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Conferma Importazione ({csvData.length} utenti)
                </Button>
              </div>
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