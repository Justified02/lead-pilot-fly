import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Zap, Users, TrendingUp, Target, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [totalLeads, setTotalLeads] = useState(0);

  // FIXED: Fetch actual leads count from Supabase
  useEffect(() => {
    const fetchLeadsCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from('lead_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (error) throw error;
        setTotalLeads(count || 0);
      } catch (error) {
        console.error('Error fetching leads count:', error);
      }
    };

    fetchLeadsCount();
  }, [user]);

  const stats = [
    {
      icon: Target,
      label: 'Leads Generated',
      value: totalLeads.toString(),
      description: 'Total leads found'
    },
    {
      icon: Users,
      label: 'Credits Used',
      value: '0',
      description: 'API calls made'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: '0%',
      description: 'Successful matches'
    }
  ];

  const quickActions = [
    {
      icon: Zap,
      title: 'Generate New Leads',
      description: 'Use AI to find your ideal prospects',
      href: '/dashboard/generate',
      primary: true
    },
    {
      icon: Users,
      title: 'View Profile',
      description: 'Manage your account settings',
      href: '/dashboard/profile',
      primary: false
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.user_metadata?.full_name || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Ready to find your next prospects? Let's get started.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm font-medium text-foreground">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span>{action.title}</span>
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={action.primary ? "default" : "outline"} className="w-full">
                    <Link to={action.href} className="flex items-center justify-center">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest lead generation activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
              <p className="text-muted-foreground mb-4">
                Start generating leads to see your activity here
              </p>
              <Button asChild>
                <Link to="/dashboard/generate">
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Your First Leads
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}