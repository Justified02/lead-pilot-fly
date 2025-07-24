import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, Search, Mail, RefreshCw, Loader2, Copy, CheckCircle, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import EmailPreviewModal from './EmailPreviewModal';

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email: string;
  linkedin: string;
  snippet: string;
  image: string | null;
  company_domain: string;
  generated_email?: string;
  email_sent?: boolean;
}

interface LeadsTableProps {
  leads: Lead[];
  isLoading?: boolean;
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

export default function LeadsTable({ leads, isLoading, onLeadUpdate }: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [generatingEmailFor, setGeneratingEmailFor] = useState<string | null>(null);
  const [showToneDialog, setShowToneDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aValue = a[sortBy as keyof Lead] || '';
    const bValue = b[sortBy as keyof Lead] || '';
    return aValue.toString().localeCompare(bValue.toString());
  });

  const handleGenerateEmail = (lead: Lead) => {
    setSelectedLead(lead);
    setShowToneDialog(true);
  };

  const generateEmail = async (lead: Lead, tone: string) => {
    setGeneratingEmailFor(lead.id);
    setShowToneDialog(false);
    
    try {
      const response = await fetch('https://divverse-community.app.n8n.cloud/webhook-test/email-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          name: lead.name,
          title: lead.title,
          company: lead.company,
          location: lead.location,
          email: lead.email,
          linkedin: lead.linkedin,
          snippet: lead.snippet,
          image: lead.image,
          company_domain: lead.company_domain,
          tone: tone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      // FIXED: Proper parsing to match History tab logic - prioritize structured { subject, body } format
      const emailContent = data.subject && data.body 
        ? `Subject: ${data.subject}\n\n${data.body}`
        : data.email || data.email_content || '';
      
      if (onLeadUpdate) {
        onLeadUpdate(lead.id, { generated_email: emailContent });
      }

      // Open email preview modal
      setPreviewLead(lead);
      setShowEmailPreview(true);

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

  const handleViewEmail = (lead: Lead) => {
    setPreviewLead(lead);
    setShowEmailPreview(true);
  };

  const handleEmailUpdate = (leadId: string, emailContent: string) => {
    if (onLeadUpdate) {
      onLeadUpdate(leadId, { generated_email: emailContent });
    }
  };

  const handleEmailSent = (leadId: string) => {
    if (onLeadUpdate) {
      onLeadUpdate(leadId, { email_sent: true });
    }
  };


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Text copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Title', 'Company', 'Email', 'LinkedIn', 'Location'];
    const csvContent = [
      headers.join(','),
      ...sortedLeads.map(lead => [
        `"${lead.name}"`,
        `"${lead.title}"`,
        `"${lead.company}"`,
        `"${lead.email}"`,
        `"${lead.linkedin}"`,
        `"${lead.location}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading leads...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{leads.length} Leads Found</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={leads.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedLeads.map((lead) => (
            <Card key={lead.id} className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lead.image || ''} alt={lead.name} />
                    <AvatarFallback>
                      {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
                      <div className="flex gap-1">
                        {lead.email_sent && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        )}
                        {lead.generated_email && !lead.email_sent && (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">{lead.title}</p>
                    <p className="text-sm font-medium text-foreground mb-2">{lead.company}</p>
                    <p className="text-sm text-muted-foreground mb-3">{lead.location}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(lead.email)}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {lead.email}
                      </Button>
                      {lead.linkedin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(lead.linkedin, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {lead.snippet && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                        {lead.snippet}
                      </p>
                    )}

                    {lead.generated_email && (
                      <div className="mb-4">
                        <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                          <p className="text-xs font-medium">Email generated and ready</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewEmail(lead)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {!lead.generated_email && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateEmail(lead)}
                          disabled={generatingEmailFor === lead.id}
                          className="text-xs"
                        >
                          {generatingEmailFor === lead.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Mail className="h-3 w-3 mr-1" />
                          )}
                          Generate Email
                        </Button>
                      )}
                      
                      {lead.generated_email && (
                        <Button
                          size="sm"
                          onClick={() => handleViewEmail(lead)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Email
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? 'No leads match your search.' : 'No leads to display.'}
            </p>
          </div>
        )}
      </CardContent>

      {/* Tone Selection Dialog */}
      <Dialog open={showToneDialog} onOpenChange={setShowToneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Email Tone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Choose the tone for the email:</Label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="funny">Funny</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowToneDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedLead) {
                    generateEmail(selectedLead, selectedTone);
                  }
                }}
                disabled={!selectedLead}
              >
                Generate Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        lead={previewLead}
        emailContent={previewLead?.generated_email || ''}
        tone={selectedTone}
        onEmailUpdate={handleEmailUpdate}
        onEmailSent={handleEmailSent}
      />
    </Card>
  );
}