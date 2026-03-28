import { useEffect, useState } from 'react';
import { RateList } from '../components/exchange-rates/RateList';
import { RateOverrideModal } from '../components/exchange-rates/RateOverrideModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { exchangeRatesApi } from '../services/api';
import type { ExchangeRateItem } from '../types/exchange-rate';

export function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRateItem[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('EGP');
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ from: string; to: string } | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await exchangeRatesApi.list();
      setRates(data.rates);
      setBaseCurrency(data.baseCurrency);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rates');
      console.error('Error loading rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await exchangeRatesApi.fetch();
      // Reload rates after fetch
      await loadRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh rates');
      console.error('Error refreshing rates:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOverride = (fromCurrency: string, toCurrency: string) => {
    setModalData({ from: fromCurrency, to: toCurrency });
    setIsModalOpen(true);
  };

  const handleRemoveOverride = async (fromCurrency: string, toCurrency: string) => {
    try {
      setError(null);
      await exchangeRatesApi.removeOverride(fromCurrency, toCurrency);
      await loadRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove override');
    }
  };

  const handleSubmitOverride = async (data: { fromCurrency: string; toCurrency: string; rate: string }) => {
    try {
      setIsSubmittingModal(true);
      setError(null);
      await exchangeRatesApi.setOverride(data.fromCurrency, data.toCurrency, data.rate);
      await loadRates();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exchange Rates</h1>
        <p className="text-gray-600">View and manage exchange rates for your currencies</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-12 bg-gray-300 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-300 rounded"></div>
            <div className="h-12 bg-gray-300 rounded"></div>
            <div className="h-12 bg-gray-300 rounded"></div>
          </div>
        </div>
      ) : (
        <ErrorBoundary>
          <RateList
            rates={rates}
            baseCurrency={baseCurrency}
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
            onOverride={handleOverride}
            onRemoveOverride={handleRemoveOverride}
          />
        </ErrorBoundary>
      )}

      {refreshing && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          Refreshing rates...
        </div>
      )}

      <RateOverrideModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalData(null);
        }}
        onSubmit={handleSubmitOverride}
        fromCurrency={modalData?.from}
        toCurrency={modalData?.to}
        isLoading={isSubmittingModal}
      />
    </div>
  );
}
