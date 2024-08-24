import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { authApi, userApi } from '@/lib/api';
import { Key, Copy, Trash2, Plus } from 'lucide-react';

export default function ApiKeys() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: userApi.listApiKeys,
    enabled: !!user,
  });

  const createKeyMutation = useMutation({
    mutationFn: authApi.generateApiKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setNewlyCreatedKey(data.key);
      setShowNewKeyModal(false);
      setNewKeyName('');
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: authApi.revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>API Keys - SaaS API Boilerplate</title>
      </Head>

      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
              <p className="text-gray-600 mt-1">Manage your API keys for authentication</p>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Create New Key</span>
            </button>
          </div>

          {/* New Key Success Message */}
          {newlyCreatedKey && (
            <div className="card bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">API Key Created Successfully!</h3>
              <p className="text-sm text-green-700 mb-3">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white px-4 py-2 rounded border border-green-300 text-sm font-mono">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="mt-3 text-sm text-green-700 hover:text-green-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* API Keys List */}
          <div className="card">
            {keysLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : apiKeys && apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Key size={18} className="text-gray-500" />
                          <h3 className="font-semibold">{key.name || 'Unnamed Key'}</h3>
                          {key.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              Revoked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {key.key.substring(0, 20)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.key)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Copy API key"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                          {key.lastUsedAt && (
                            <p>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      {key.isActive && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to revoke this API key?')) {
                              revokeKeyMutation.mutate(key.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Revoke key"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Key size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys Yet</h3>
                <p className="text-gray-600 mb-4">Create your first API key to get started</p>
                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="btn btn-primary"
                >
                  Create API Key
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Key Modal */}
        {showNewKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Create New API Key</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createKeyMutation.mutate(newKeyName || undefined);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name (optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyName('');
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={createKeyMutation.isPending}
                  >
                    {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
