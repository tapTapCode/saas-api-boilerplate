import Head from 'next/head';
import Link from 'next/link';
import { Check, Zap, Shield, BarChart } from 'lucide-react';

export default function Home() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['1,000 requests/month', '10 req/min', 'Basic support', 'Community access'],
      priceId: 'free',
    },
    {
      name: 'Starter',
      price: '$29',
      features: ['10,000 requests/month', '50 req/min', 'Email support', 'API documentation'],
      priceId: 'price_starter',
      popular: true,
    },
    {
      name: 'Professional',
      price: '$99',
      features: ['100,000 requests/month', '200 req/min', 'Priority support', 'Custom integrations'],
      priceId: 'price_professional',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['1M+ requests/month', '1000 req/min', '24/7 support', 'Dedicated account manager'],
      priceId: 'price_enterprise',
    },
  ];

  return (
    <>
      <Head>
        <title>SaaS API Boilerplate - Multi-tenant API Platform</title>
        <meta name="description" content="Production-ready SaaS API with subscription management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-xl font-bold">SaaS API Boilerplate</span>
              </div>
              <div className="space-x-4">
                <Link href="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Build Your SaaS API in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Production-ready multi-tenant API platform with authentication, subscription management,
            and usage tracking. Focus on your business logic, not infrastructure.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="/docs" className="btn btn-outline text-lg px-8 py-3">
              View Documentation
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast & Scalable</h3>
              <p className="text-gray-600">
                Built with NestJS and PostgreSQL for high performance and scalability.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure by Default</h3>
              <p className="text-gray-600">
                JWT and API key authentication with role-based access control.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
              <p className="text-gray-600">
                Track API usage, monitor performance, and analyze user behavior.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-12">Choose the plan that fits your needs</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card relative ${
                  plan.popular ? 'border-2 border-primary-500' : ''
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-gray-600">/mo</span>}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="text-green-500 mr-2 flex-shrink-0 mt-1" size={18} />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center ${
                    plan.popular ? 'btn btn-primary' : 'btn btn-outline'
                  } w-full`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
            <p>© 2024 SaaS API Boilerplate. Built by Jumar Juaton.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
