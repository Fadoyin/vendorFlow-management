'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentsApi } from '@/lib/api';
import { cardElementOptions, getStripeErrorMessage } from '@/lib/stripe';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

function StripePaymentForm({ onSuccess, onClose }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get setup intent from backend
      const setupIntentResponse = await paymentsApi.createSetupIntent();
      
      if (setupIntentResponse.error) {
        throw new Error(setupIntentResponse.error);
      }

      const { client_secret } = setupIntentResponse.data;

      // Confirm setup intent with card element
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
            },
          },
        }
      );

      if (stripeError) {
        throw stripeError;
      }

      if (setupIntent?.payment_method) {
        // Add payment method to backend
        const addMethodResponse = await paymentsApi.addPaymentMethod({
          payment_method_id: setupIntent.payment_method.id,
        });

        if (addMethodResponse.error) {
          throw new Error(addMethodResponse.error);
        }

        onSuccess();
      }
    } catch (err: any) {
      setError(getStripeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Smith"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </div>
          ) : (
            'Add Payment Method'
          )}
        </button>
      </div>
    </form>
  );
}

interface StripePaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StripePaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
}: StripePaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Payment Method</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add a new payment method to your account
          </p>
        </div>
        
        <div className="p-6">
          <Elements stripe={stripePromise}>
            <StripePaymentForm onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        </div>
      </div>
    </div>
  );
} 