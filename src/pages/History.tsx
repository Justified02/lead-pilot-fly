import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, Search, Filter, Mail, RefreshCw, Loader2, CheckCircle, XCircle, History as HistoryIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

interface LeadHistory {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email: string;
  linkedin: string;
  snippet: string;
  generated_email: string | null;
  email_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadHistory[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingEmailFor, setGeneratingEmailFor] = useState<string | null>(null);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  const leadsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchLeadHistory();
    }
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching lead history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lead history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead =>
        statusFilter === 'sent' ? lead.email_sent : !lead.email_sent
      );
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const generateEmail = async (lead: LeadHistory) => {
    setGeneratingEmailFor(lead.id);
    try {
      const response = await fetch('https://divverse-community.app.n8n.cloud/webhook-test/email-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          title: lead.title,
          company: lead.company,
          snippet: lead.snippet
        }),
      });

      if (!response.ok) throw new Error('Failed to generate email');

      const data = await response.json();
      
      const { error } = await supabase
        .from('lead_history')
        .update({ generated_email: data.email })
        .eq('id', lead.id);

      if (error) throw error;

      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, generated_email: data.email } : l
      ));

      toast({
        title: 'Success',
        description: 'Email generated successfully',
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate email',
        variant: 'destructive',
      });
    } finally {
      setGeneratingEmailFor(null);
    }
  };

  const sendEmail = async (lead: LeadHistory) => {
    if (!lead.generated_email) {
      toast({
        title: 'No Email Generated',
        description: 'Please generate an email first',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmailFor(lead.id);
    try {
      const response = await fetch('https://divverse-community.app.n8n.cloud/webhook-test/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject: `Partnership Opportunity with ${lead.company}`,
          body: lead.generated_email,
          lead_name: lead.name
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      const { error } = await supabase
        .from('lead_history')
        .update({ 
          email_sent: true, 
          sent_at: new Date().toISOString() 
        })
        .eq('id', lead.id);

      if (error) throw error;

      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { 
          ...l, 
          email_sent: true, 
          sent_at: new Date().toISOString() 
        } : l
      ));

      toast({
        title: 'Success',
        description: 'Email sent successfully',
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSendingEmailFor(null);
    }
  };

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + leadsPerPage);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <HistoryIcon className="h-8 w-8" />
              Lead History
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage your previously generated leads
            </p>
          </div>
          <Button onClick={fetchLeadHistory} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  <SelectItem value="sent">Email Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''} Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Generate some leads to see them here'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.title}</TableCell>
                          <TableCell>
                            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                              {lead.email}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.email_sent ? "default" : "secondary"}>
                              {lead.email_sent ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Sent</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Pending</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(lead.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lead.linkedin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(lead.linkedin, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>{lead.name}</DialogTitle>
                                    <DialogDescription>
                                      {lead.title} at {lead.company}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold">Details</h4>
                                      <p className="text-sm text-muted-foreground">{lead.snippet}</p>
                                    </div>
                                    
                                    {lead.generated_email && (
                                      <div>
                                        <h4 className="font-semibold">Generated Email</h4>
                                        <div className="bg-muted p-4 rounded-lg">
                                          <pre className="whitespace-pre-wrap text-sm">
                                            {lead.generated_email}
                                          </pre>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex gap-2">
                                      {!lead.generated_email && (
                                        <Button
                                          onClick={() => generateEmail(lead)}
                                          disabled={generatingEmailFor === lead.id}
                                        >
                                          {generatingEmailFor === lead.id ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          ) : (
                                            <Mail className="h-4 w-4 mr-2" />
                                          )}
                                          Generate Email
                                        </Button>
                                      )}
                                      
                                      {lead.generated_email && !lead.email_sent && (
                                        <Button
                                          onClick={() => sendEmail(lead)}
                                          disabled={sendingEmailFor === lead.id}
                                        >
                                          {sendingEmailFor === lead.id ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          ) : (
                                            <Mail className="h-4 w-4 mr-2" />
                                          )}
                                          Send Email
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + leadsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}