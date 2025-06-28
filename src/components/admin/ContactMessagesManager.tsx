import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Archive,
  Reply,
  Trash2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_notes?: string;
  replied_at?: string;
  replied_by?: string;
  created_at: string;
  updated_at: string;
}

const ContactMessagesManager = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i messaggi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'replied') {
        updates.replied_at = new Date().toISOString();
        updates.replied_by = 'Admin'; // You can replace this with actual admin user
      }

      const { error } = await supabase
        .from('contact_messages')
        .update(updates)
        .eq('id', messageId);

      if (error) throw error;

      await loadMessages();
      toast({
        title: 'Stato Aggiornato',
        description: 'Lo stato del messaggio è stato aggiornato con successo.',
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare lo stato del messaggio.',
        variant: 'destructive',
      });
    }
  };

  const updateAdminNotes = async (messageId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ admin_notes: notes })
        .eq('id', messageId);

      if (error) throw error;

      await loadMessages();
      setAdminNotes('');
      toast({
        title: 'Note Salvate',
        description: 'Le note amministrative sono state salvate.',
      });
    } catch (error) {
      console.error('Error updating admin notes:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le note.',
        variant: 'destructive',
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo messaggio?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      await loadMessages();
      setSelectedMessage(null);
      toast({
        title: 'Messaggio Eliminato',
        description: 'Il messaggio è stato eliminato con successo.',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il messaggio.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'Nuovo', variant: 'destructive' as const, icon: AlertCircle },
      read: { label: 'Letto', variant: 'secondary' as const, icon: Clock },
      replied: { label: 'Risposto', variant: 'default' as const, icon: CheckCircle },
      archived: { label: 'Archiviato', variant: 'outline' as const, icon: Archive }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Bassa', className: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normale', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Gestione Messaggi di Contatto</h2>
        <Button onClick={loadMessages} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Aggiorna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Cerca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, email o oggetto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="new">Nuovi</SelectItem>
                  <SelectItem value="read">Letti</SelectItem>
                  <SelectItem value="replied">Risposti</SelectItem>
                  <SelectItem value="archived">Archiviati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorità</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="low">Bassa</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div className="font-medium">{filteredMessages.length} messaggi</div>
                <div>{messages.filter(m => m.status === 'new').length} non letti</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Lista Messaggi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Caricamento messaggi...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nessun messaggio trovato</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{message.name}</span>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(message.status)}
                        {getPriorityBadge(message.priority)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <Mail className="h-3 w-3 inline mr-1" />
                      {message.email}
                      {message.phone && (
                        <>
                          <Phone className="h-3 w-3 inline ml-3 mr-1" />
                          {message.phone}
                        </>
                      )}
                    </div>
                    <div className="font-medium text-gray-800 mb-1">{message.subject}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{message.message}</div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Dettagli Messaggio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Message Info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedMessage.subject}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedMessage.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedMessage.email}
                        </span>
                        {selectedMessage.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedMessage.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedMessage.status)}
                      {getPriorityBadge(selectedMessage.priority)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    Ricevuto il {formatDate(selectedMessage.created_at)}
                    {selectedMessage.replied_at && (
                      <span className="block">
                        Risposto il {formatDate(selectedMessage.replied_at)} da {selectedMessage.replied_by}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                      variant="outline"
                      size="sm"
                      disabled={selectedMessage.status === 'read'}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Segna come Letto
                    </Button>
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                      variant="outline"
                      size="sm"
                      disabled={selectedMessage.status === 'replied'}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Segna come Risposto
                    </Button>
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                      variant="outline"
                      size="sm"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archivia
                    </Button>
                    <Button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Elimina
                    </Button>
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <Label>Note Amministrative</Label>
                    <Textarea
                      placeholder="Aggiungi note interne..."
                      value={adminNotes || selectedMessage.admin_notes || ''}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={() => updateAdminNotes(selectedMessage.id, adminNotes || '')}
                      size="sm"
                      disabled={!adminNotes && !selectedMessage.admin_notes}
                    >
                      Salva Note
                    </Button>
                  </div>

                  {/* Quick Reply */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Risposta Rapida</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Per rispondere a questo messaggio, puoi utilizzare il tuo client email:
                    </p>
                    <Button
                      onClick={() => {
                        const subject = `Re: ${selectedMessage.subject}`;
                        const body = `Ciao ${selectedMessage.name},\n\nGrazie per averci contattato.\n\n[Scrivi qui la tua risposta]\n\nCordiali saluti,\nFrancesco Fiori`;
                        window.location.href = `mailto:${selectedMessage.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Apri Email Client
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Seleziona un messaggio per visualizzare i dettagli</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactMessagesManager;
