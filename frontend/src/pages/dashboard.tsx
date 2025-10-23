import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { organizationApi, userApi } from '@/lib/api';
import { Activity, Key, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: apiKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: userApi.listApiKeys,
    enabled: !!user,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: () => organizationApi.getById(user!.organizationId!),
    enabled: !!user?.organizationId,
  });

  const { data: usageStats } = useQuery({
    queryKey: ['usage', user?.organizationId],
    queryFn: () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      return organizationApi.getUsageStats(user!.organizationId!, startDate, endDate);
    },
    enabled: !!user?.organizationId,
  });

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  const subscription = organization?.subscriptions?.[0];
  const activeKeys = apiKeys?.filter((k) => k.isActive).length || 0;

  return (
    <>
      <Head>
        <title>Dashboard - SaaS API Boilerplate</title>
      </Head>

      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name || user.email}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold mt-1">{usageStats?.totalRequests || 0}</p>
                </div>
                <Activity className="text-primary-600" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active API Keys</p>
                  <p className="text-2xl font-bold mt-1">{activeKeys}</p>
                </div>
                <Key className="text-primary-600" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold mt-1">{usageStats?.avgResponseTime || 0}ms</p>
                </div>
                <TrendingUp className="text-primary-600" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold mt-1">{organization?.users?.length || 1}</p>
                </div>
                <Users className="text-primary-600" size={32} />
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
            {subscription ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-lg">{subscription.plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Request Limit</span>
                  <span className="font-medium">{subscription.requestLimit.toLocaleString()}/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rate Limit</span>
                  <span className="font-medium">{subscription.rateLimit} req/min</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No active subscription</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/api-keys')}
                className="btn btn-outline text-left p-4"
              >
                <Key size={20} className="mb-2" />
                <p className="font-medium">Manage API Keys</p>
                <p className="text-sm text-gray-600 mt-1">Create and manage your API keys</p>
              </button>
              <button
                onClick={() => router.push('/usage')}
                className="btn btn-outline text-left p-4"
              >
                <Activity size={20} className="mb-2" />
                <p className="font-medium">View Usage</p>
                <p className="text-sm text-gray-600 mt-1">Monitor API usage and analytics</p>
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="btn btn-outline text-left p-4"
              >
                <Users size={20} className="mb-2" />
                <p className="font-medium">Settings</p>
                <p className="text-sm text-gray-600 mt-1">Manage subscription and billing</p>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
