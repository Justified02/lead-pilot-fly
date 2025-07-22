import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Send, Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  emailContent: string;
  tone: string;
  onEmailUpdate: (leadId: string, emailContent: string) => void;
  onEmailSent: (leadId: string) => void;
}

export default function EmailPreviewModal({
  isOpen,
  onOpenChange,
  lead,
  emailContent,
  tone,
  onEmailUpdate,
  onEmailSent,
}: EmailPreviewModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Parse email content when it changes
  useEffect(() => {
    if (emailContent) {
      // Try to parse subject and body from the email content
      const lines = emailContent.split('\n');
      let subjectLine = '';
      let bodyContent = '';
      
      // Look for subject line (common formats: "Subject: ...", "SUBJECT: ...", etc.)
      const subjectMatch = emailContent.match(/(?:subject|SUBJECT):\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].trim();
        // Remove subject line from body
        bodyContent = emailContent.replace(/(?:subject|SUBJECT):\s*.+?(?:\n|$)/i, '').trim();
      } else {
        // If no subject found, use first line as subject
        subjectLine = lines[0] || '';
        bodyContent = lines.slice(1).join('\n').trim();
      }
      
      setSubject(subjectLine);
      setBody(bodyContent);
    }
  }, [emailContent]);

  const handleRegenerate = async () => {
    if (!lead) return;
    
    setIsRegenerating(true);
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
        throw new Error('Failed to regenerate email');
      }

      const data = await response.json();
      const newEmailContent = data.email || data.email_content || data.subject + '\n\n' + data.body;
      
      onEmailUpdate(lead.id, newEmailContent);
      
      toast({
        title: 'Success',
        description: 'Email regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating email:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate email',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    if (!lead) return;
    
    const updatedContent = subject + '\n\n' + body;
    onEmailUpdate(lead.id, updatedContent);
    setIsEditing(false);
    
    toast({
      title: 'Saved',
      description: 'Email content updated',
    });
  };

  const handleSendEmail = async () => {
    if (!lead || !user?.email) {
      toast({
        title: 'Error',
        description: 'Missing lead or user information',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const emailToSend = subject + '\n\n' + body;
      
      const response = await fetch('https://divverse-community.app.n8n.cloud/webhook-test/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          email_content: emailToSend,
          lead_email: lead.email,
          lead_name: lead.name,
          user_email: user.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      onEmailSent(lead.id);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: `Email sent successfully to ${lead.name}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Email Preview - {lead?.name}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isRegenerating || isSending}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Info */}
          {lead && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium">{lead.name} • {lead.title}</p>
              <p className="text-sm text-muted-foreground">{lead.company} • {lead.email}</p>
            </div>
          )}

          {/* Email Content */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject Line
              </Label>
              {isEditing ? (
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="mt-2"
                />
              ) : (
                <div className="mt-2 p-3 bg-background border rounded-md">
                  <p className="text-sm">{subject || 'No subject line'}</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="body" className="text-sm font-medium">
                Email Body
              </Label>
              {isEditing ? (
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body..."
                  rows={12}
                  className="mt-2 resize-none"
                />
              ) : (
                <div className="mt-2 p-4 bg-background border rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {body || 'No email body'}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating || isSending || isEditing}
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>

            <div className="flex gap-2">
              {isEditing && (
                <Button onClick={handleSave} disabled={isRegenerating || isSending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
              
              <Button
                onClick={handleSendEmail}
                disabled={isSending || isRegenerating || isEditing || !subject.trim() || !body.trim()}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}