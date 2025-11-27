import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  Send,
  MousePointer,
  MailOpen,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function EmailLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    deliveryRate: 0
  });

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const emailLogs = await base44.entities.EmailLog.list('-created_date', 200);
      setLogs(emailLogs);
      
      // Calcola statistiche
      const total = emailLogs.length;
      const sent = emailLogs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
      const failed = emailLogs.filter(l => l.status === 'failed' || l.status === 'bounced').length;
      const pending = emailLogs.filter(l => l.status === 'pending' || l.status === 'retry_scheduled').length;
      
      setStats({
        total,
        sent,
        failed,
        pending,
        deliveryRate: total > 0 ? Math.round((sent / total) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getStatusBadge = (status) => {
    const config = {
      sent: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Inviata' },
      delivered: { icon: MailOpen, color: 'bg-blue-100 text-blue-700', label: 'Consegnata' },
      opened: { icon: Eye, color: 'bg-purple-100 text-purple-700', label: 'Aperta' },
      clicked: { icon: MousePointer, color: 'bg-indigo-100 text-indigo-700', label: 'Click' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Fallita' },
      bounced: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-700', label: 'Bounce' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'In Attesa' },
      retry_scheduled: { icon: RefreshCw, color: 'bg-amber-100 text-amber-700', label: 'Retry' }
    };
    
    const { icon: Icon, color, label } = config[status] || config.pending;
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.template_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/80 border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Totale</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inviate</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fallite</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Attesa</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.deliveryRate >= 90 ? 'bg-green-100' : stats.deliveryRate >= 70 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {stats.deliveryRate >= 90 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Rate</p>
                <p className={`text-2xl font-bold ${stats.deliveryRate >= 90 ? 'text-green-600' : stats.deliveryRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.deliveryRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 border-gray-200/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Log Email ({filteredLogs.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cerca email, template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">Tutti gli stati</option>
                <option value="sent">Inviate</option>
                <option value="delivered">Consegnate</option>
                <option value="failed">Fallite</option>
                <option value="bounced">Bounce</option>
                <option value="pending">In Attesa</option>
              </select>
              <Button
                onClick={loadLogs}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Aggiorna
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Oggetto</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Retry</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      Nessun log trovato
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(log.created_date)}
                      </TableCell>
                      <TableCell className="font-medium">{log.user_email}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.template_id}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.subject}>
                        {log.subject}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.retry_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {log.retry_count} retry
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettaglio Email Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Destinatario</p>
                  <p className="font-medium">{selectedLog.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stato</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Template</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedLog.template_id}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">{selectedLog.provider || 'sendgrid'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data Creazione</p>
                  <p className="font-medium">{formatDate(selectedLog.created_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data Invio</p>
                  <p className="font-medium">{formatDate(selectedLog.sent_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Oggetto</p>
                <p className="font-medium bg-gray-50 p-3 rounded-lg">{selectedLog.subject}</p>
              </div>

              {selectedLog.trigger_source && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Trigger Source</p>
                  <code className="text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg block">
                    {selectedLog.trigger_source}
                  </code>
                </div>
              )}

              {selectedLog.sendgrid_message_id && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">SendGrid Message ID</p>
                  <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block break-all">
                    {selectedLog.sendgrid_message_id}
                  </code>
                </div>
              )}

              {selectedLog.error_message && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-700 mb-1">Errore</p>
                  <p className="text-sm text-red-600">{selectedLog.error_message}</p>
                </div>
              )}

              {selectedLog.retry_count > 0 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    ⚠️ Questa email ha richiesto {selectedLog.retry_count} tentativi prima dell'invio
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedLog(null)}>
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}