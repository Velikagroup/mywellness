import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Clock, Search, Mail, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');

  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0
  });

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const fetchedLogs = await base44.entities.EmailLog.list('-created_date', 200);
      setLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);
      
      // Calcola statistiche
      const total = fetchedLogs.length;
      const sent = fetchedLogs.filter(l => l.status === 'sent').length;
      const failed = fetchedLogs.filter(l => l.status === 'failed').length;
      const pending = fetchedLogs.filter(l => l.status === 'pending').length;
      
      setStats({
        total,
        sent,
        failed,
        pending,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchEmail) {
      filtered = filtered.filter(log => 
        log.user_email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    if (filterTemplate !== 'all') {
      filtered = filtered.filter(log => log.template_id === filterTemplate);
    }

    setFilteredLogs(filtered);
  }, [searchEmail, filterStatus, filterTemplate, logs]);

  const uniqueTemplates = [...new Set(logs.map(log => log.template_id))];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      sent: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };

    return (
      <Badge className={variants[status] || ''}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.toUpperCase()}</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Log Email</h1>
          <p className="text-gray-600">Tracciamento completo di tutte le email inviate dall'app</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-white/55 backdrop-blur-md border-gray-200/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Totali</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50/55 backdrop-blur-md border-green-200/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-700">Inviate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700">{stats.sent}</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50/55 backdrop-blur-md border-red-200/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-red-700">Fallite</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-700">{stats.failed}</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50/55 backdrop-blur-md border-yellow-200/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-yellow-700">In Attesa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/55 backdrop-blur-md border-blue-200/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-700">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700">{stats.successRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cerca per email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="sent">Inviate</SelectItem>
                  <SelectItem value="failed">Fallite</SelectItem>
                  <SelectItem value="pending">In Attesa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i template</SelectItem>
                  {uniqueTemplates.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Log Email ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Oggetto</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Lingua</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Errore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Caricamento...</TableCell>
                    </TableRow>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: it })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.user_email}</TableCell>
                        <TableCell className="text-xs font-mono">{log.template_id}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{log.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-xs">
                            {log.provider}
                          </Badge>
                        </TableCell>
                        <TableCell className="uppercase text-xs">{log.language}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <div className="flex items-start gap-2 max-w-xs">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-red-600">{log.error_message}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Nessun log trovato</TableCell>
                    </TableRow>
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