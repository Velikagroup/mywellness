import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Download,
  Upload,
  Eye,
  TrendingUp,
  DollarSign,
  UserCheck,
  Filter
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
      // Prepara i dati CSV con tutti i campi rilevanti
      const csvRows = [];
      
      // Header con tutte le colonne
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

      // Aggiungi i dati di ogni cliente
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

      // Crea il file CSV con BOM per Excel
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

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('❌ Per favore seleziona un file CSV');
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('❌ File CSV vuoto o non valido');
        setIsImporting(false);
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Parse data rows
      const users = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        // Mappa base: Nome, Email, Piano, Stato
        const userData = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          
          // Mappatura campi
          if (header.toLowerCase().includes('nome') || header.toLowerCase().includes('name')) {
            userData.full_name = value;
          } else if (header.toLowerCase().includes('email')) {
            userData.email = value;
          } else if (header.toLowerCase().includes('piano') || header.toLowerCase().includes('plan')) {
            userData.subscription_plan = value.toLowerCase();
          } else if (header.toLowerCase().includes('stato') || header.toLowerCase().includes('status')) {
            userData.subscription_status = value.toLowerCase();
          } else if (header.toLowerCase().includes('lingua') || header.toLowerCase().includes('language')) {
            userData.language = value.toLowerCase();
          } else if (header.toLowerCase().includes('telefono') || header.toLowerCase().includes('phone')) {
            userData.phone_number = value;
          }
        });

        if (userData.email) {
          users.push(userData);
        }
      }

      if (users.length === 0) {
        alert('❌ Nessun utente valido trovato nel CSV');
        setIsImporting(false);
        return;
      }

      const confirmMsg = `Trovati ${users.length} utenti nel CSV.\n\nNOTA: Verranno importati solo utenti con email non già esistenti.\n\nProcedere?`;
      
      if (!confirm(confirmMsg)) {
        setIsImporting(false);
        return;
      }

      // Importa utenti
      let imported = 0;
      let skipped = 0;
      
      for (const userData of users) {
        try {
          // Verifica se esiste già
          const existing = await base44.entities.User.filter({ email: userData.email });
          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }

          // Crea nuovo utente (solo dati base)
          await base44.entities.User.create({
            email: userData.email,
            full_name: userData.full_name || 'Utente Importato',
            subscription_plan: userData.subscription_plan || 'base',
            subscription_status: userData.subscription_status || 'trial',
            language: userData.language || 'it',
            phone_number: userData.phone_number || '',
            role: 'user'
          });
          
          imported++;
        } catch (error) {
          console.error(`Error importing ${userData.email}:`, error);
          skipped++;
        }
      }

      alert(`✅ Importazione completata!\n\n• ${imported} utenti importati\n• ${skipped} utenti saltati (già esistenti o errori)`);
      
      await loadClients();
      
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Errore durante l\'importazione: ' + error.message);
    }

    setIsImporting(false);
    event.target.value = '';
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