import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, pricingApi } from '../services/api';
import { TokenSymbol, ALL_TOKENS } from '@perper/shared';

type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'sepa_debit' | 'sofort' | 'ideal' | 'giropay' | 'paypal' | 'bank';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { value: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
  { value: 'google_pay', label: 'Google Pay', icon: 'G' },
  { value: 'sepa_debit', label: 'SEPA Direct Debit', icon: '🏦' },
  { value: 'sofort', label: 'SOFORT', icon: '🇩🇪' },
  { value: 'ideal', label: 'iDEAL', icon: '🇳🇱' },
  { value: 'giropay', label: 'Giropay', icon: '🇩🇪' },
  { value: 'paypal', label: 'PayPal', icon: 'P' },
  { value: 'bank', label: 'Bank Transfer (IBAN)', icon: '🏦' }
];

const QUICK_AMOUNTS = [10, 50, 100, 500];

export default function Buy() {
  const queryClient = useQueryClient();
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>(TokenSymbol.PERP);
  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [showBankInstructions, setShowBankInstructions] = useState(false);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [error, setError] = useState('');

  const { data: pricesData } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const response = await pricingApi.getCurrentPrices();
      return response.data;
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const tokenAmount = customAmount ? parseFloat(customAmount) : amount;

      if (paymentMethod === 'bank') {
        // Bank transfer flow
        const response = await purchaseApi.createBankTransfer({
          token: selectedToken,
          amount: tokenAmount
        });
        return { type: 'bank', data: response.data };
      } else if (paymentMethod === 'paypal') {
        // PayPal flow
        const response = await purchaseApi.createIntent({
          token: selectedToken,
          amount: tokenAmount,
          method: 'paypal'
        });
        return { type: 'paypal', data: response.data };
      } else {
        // Stripe flow
        const response = await purchaseApi.createIntent({
          token: selectedToken,
          amount: tokenAmount,
          method: paymentMethod
        });
        return { type: 'stripe', data: response.data };
      }
    },
    onSuccess: (result) => {
      if (result.type === 'bank') {
        setBankDetails(result.data.bankDetails);
        setShowBankInstructions(true);
      } else if (result.type === 'paypal') {
        // Redirect to PayPal
        window.location.href = result.data.approvalUrl;
      } else if (result.type === 'stripe') {
        // In a real implementation, you would load Stripe.js and show payment form
        // For now, just show a message
        alert('Stripe payment would be processed here. Client secret: ' + result.data.clientSecret);
      }
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Purchase failed');
    }
  });

  const currentPrice = pricesData?.prices?.[selectedToken] || 0;
  const tokenAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const totalCost = tokenAmount * currentPrice;

  const handlePurchase = () => {
    setError('');
    purchaseMutation.mutate();
  };

  if (showBankInstructions && bankDetails) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bank Transfer Instructions</h1>

        <div className="card space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Purchase created successfully! Please complete the bank transfer to receive your tokens.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Transfer Details</h2>

            <div>
              <p className="text-sm text-gray-600">Beneficiary</p>
              <p className="font-mono font-medium">{bankDetails.beneficiary}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">IBAN</p>
              <p className="font-mono font-medium">{bankDetails.iban}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">BIC/SWIFT</p>
              <p className="font-mono font-medium">{bankDetails.bic}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-mono font-medium text-xl">
                €{bankDetails.amount.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Reference (IMPORTANT - Include this in your transfer)</p>
              <p className="font-mono font-medium text-lg text-perper-gold">
                {bankDetails.reference}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Please include the reference code in your bank transfer.
              Your tokens will be credited after the transfer is confirmed (usually 1-3 business days).
            </p>
          </div>

          <button
            onClick={() => {
              setShowBankInstructions(false);
              setBankDetails(null);
            }}
            className="w-full btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Buy Tokens</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Form */}
        <div className="lg:col-span-2 card space-y-6">
          {/* Select Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Token
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ALL_TOKENS.map((token) => (
                <button
                  key={token}
                  onClick={() => setSelectedToken(token)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedToken === token
                      ? 'border-perper-gold bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{token}</div>
                  <div className="text-sm text-gray-600">
                    €{currentPrice.toFixed(2)} each
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Amount
            </label>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 rounded-lg border-2 transition-colors ${
                    amount === amt && !customAmount
                      ? 'border-perper-gold bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Custom Amount
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="input-field"
              placeholder="Enter amount"
              min="1"
              step="0.01"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    paymentMethod === method.value
                      ? 'border-perper-gold bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending || tokenAmount <= 0}
            className="w-full btn-primary py-3 text-lg"
          >
            {purchaseMutation.isPending ? 'Processing...' : `Buy ${tokenAmount} ${selectedToken} for €${totalCost.toFixed(2)}`}
          </button>
        </div>

        {/* Order Summary */}
        <div className="card h-fit sticky top-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Token:</span>
              <span className="font-medium">{selectedToken}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{tokenAmount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Price per token:</span>
              <span className="font-medium">€{currentPrice.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl text-perper-gold">
                €{totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">Secure Payment</p>
            <p>All transactions are encrypted and secure. Tokens will be credited to your wallet immediately after payment confirmation.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>
          <strong>Note:</strong> This is a closed, centralized token system. Token purchases are non-refundable except where required by law.
          Bank transfers may take 1-3 business days to process.
        </p>
      </div>
    </div>
  );
}
