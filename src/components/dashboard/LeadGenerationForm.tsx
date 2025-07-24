import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface LeadGenerationFormProps {
  onLeadsGenerated: (leads: Lead[]) => void;
}

export default function LeadGenerationForm({ onLeadsGenerated }: LeadGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { prompt: prompt.trim(), user, isLoading });

    if (!prompt.trim()) {
      console.log('No prompt provided');
      return;
    }

    if (isLoading) {
      console.log('Already loading');
      return;
    }

    if (!user) {
      console.log('No user found');
      return;
    }

    setIsLoading(true);
    console.log('Starting lead generation request...');

    try {
      console.log('Sending lead generation request with:', { prompt: prompt.trim(), user_id: user.id });

      // Call the N8n webhook for lead generation
      const response = await fetch('https://divverse-community.app.n8n.cloud/webhook-test/83982534-1497-473b-966f-7ad8836ee1d1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          user_id: user.id
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Response data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      console.log('Data keys:', Object.keys(data || {}));
      console.log('Data has id:', data?.id);
      console.log('Data has name:', data?.name);

      let leads = null;

      // Handle different response formats
      if (Array.isArray(data)) {
        console.log('Data is array, using directly:', data.length, 'leads');
        leads = data;
      } else if (data && data.leads && Array.isArray(data.leads)) {
        console.log('Data has leads array property:', data.leads.length, 'leads');
        leads = data.leads;
      } else if (data && typeof data === 'object' && data.id && data.name) {
        // Single lead object - wrap in array
        console.log('Data is single lead object, wrapping in array');
        leads = [data];
      } else {
        console.error('Could not extract leads from response:', data);
      }

      console.log('Final extracted leads:', leads);

      if (leads && Array.isArray(leads) && leads.length > 0) {
        console.log('Processing leads:', leads.length);
        
        // Save leads to database with user_id and generate proper UUIDs
        const leadsToSave = leads.map((lead: any) => {
          const { id, ...leadWithoutId } = lead; // Remove the original id
          return {
            ...leadWithoutId,
            user_id: user.id,
            email_sent: false,
            sent_at: null
          };
        });

        console.log('Saving leads to database:', leadsToSave);

        const { data: savedLeads, error: dbError } = await supabase
          .from('lead_history')
          .insert(leadsToSave)
          .select();

        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }

        console.log('Leads saved successfully:', savedLeads);

        // FIXED: Use savedLeads with proper IDs for frontend display
        const leadsWithIds = savedLeads.map((savedLead: any, index: number) => ({
          ...leads[index],
          id: savedLead.id // Use the generated UUID from Supabase
        }));

        onLeadsGenerated(leadsWithIds);
        setPrompt('');
        
        toast({
          title: 'Success!',
          description: `Generated ${leads.length} leads successfully`,
        });
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from lead generation service');
      }
    } catch (error) {
      console.error('Error generating leads:', error);
      
      let errorMessage = 'Failed to generate leads. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('HTTP error')) {
          errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('Lead generation request completed');
    }
  };

  const examplePrompts = [
    "Find CTOs at AI startups in San Francisco",
    "Marketing directors at SaaS companies with 50-200 employees",
    "Founders of e-commerce companies in New York",
    "VPs of Sales at fintech companies"
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Lead Generation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium text-foreground">
              Describe your ideal prospects
            </label>
            <Textarea
              id="prompt"
              placeholder="e.g., Find CTOs at AI startups in San Francisco with 10-50 employees"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try these examples:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-left justify-start h-auto p-3 text-xs"
                  onClick={() => setPrompt(example)}
                  disabled={isLoading}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!prompt.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating leads...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Leads
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}