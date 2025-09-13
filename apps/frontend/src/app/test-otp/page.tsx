'use client';

import React, { useState } from 'react';
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal';
import { authApi } from '@/lib/api';

export default function TestOtpPage() {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('signup');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: 'testuser@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Test Company',
    role: 'vendor'
  });

  const handleTestSignup = async () => {
    setIsLoading(true);
    setResult('');
    setOtpError('');

    try {
      const response = await authApi.register(formData);
      
      if (response.data?.requiresOtp) {
        setOtpEmail(formData.email);
        setOtpPurpose('signup');
        setOtpExpiresIn(response.data.expiresIn || 300);
        setShowOtpModal(true);
        setResult('✅ Signup OTP sent! Check the backend logs for the OTP code.');
      } else if (response.data?.access_token) {
        setResult('✅ Direct signup success: ' + JSON.stringify(response.data.user));
      } else {
        setResult('❌ Signup failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setResult('❌ Signup error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    setResult('');
    setOtpError('');

    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password
      });
      
      if (response.data?.requiresOtp) {
        setOtpEmail(formData.email);
        setOtpPurpose('login');
        setOtpExpiresIn(response.data.expiresIn || 300);
        setShowOtpModal(true);
        setResult('✅ Login OTP sent! Check the backend logs for the OTP code.');
      } else if (response.data?.access_token) {
        setResult('✅ Direct login success: ' + JSON.stringify(response.data.user));
      } else {
        setResult('❌ Login failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setResult('❌ Login error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    setIsOtpLoading(true);
    setOtpError('');
    
    try {
      const response = await authApi.verifyOtp(otpEmail, otp, otpPurpose);
      
      if (response.data?.access_token) {
        setResult(`✅ ${otpPurpose} completed successfully! User: ${JSON.stringify(response.data.user)}`);
        setShowOtpModal(false);
      } else if (response.error) {
        setOtpError(response.error);
      } else {
        setOtpError('OTP verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setOtpError(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleOtpResend = async () => {
    try {
      const response = await authApi.sendOtp(otpEmail, otpPurpose);
      
      if (response.data) {
        setOtpExpiresIn(response.data.expiresIn || 300);
        setResult(`✅ New OTP sent! Check the backend logs for the new OTP code.`);
        return;
      } else if (response.error) {
        setOtpError(response.error);
      } else {
        setOtpError('Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('OTP resend error:', error);
      setOtpError(error.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
    setOtpError('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 OTP System Test</h1>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">📋 Test Instructions</h2>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Click "Test Signup" to initiate registration with OTP</li>
          <li>Check the backend logs (terminal) for the 6-digit OTP code</li>
          <li>Enter the OTP in the modal to complete signup</li>
          <li>Use the same email to test "Test Login" with OTP</li>
          <li>Test the "Resend OTP" functionality</li>
        </ol>
      </div>

      {/* Form Data */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">📝 Test User Data</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="space-y-4 mb-6">
        <button
          onClick={handleTestSignup}
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? '⏳ Testing Signup...' : '🚀 Test Signup with OTP'}
        </button>
        
        <button
          onClick={handleTestLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? '⏳ Testing Login...' : '🔑 Test Login with OTP'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">📋 Result</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {/* Backend Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="font-semibold text-yellow-900 mb-2">🖥️ Backend Logs</h2>
        <p className="text-sm text-yellow-800 mb-2">
          To see the OTP codes in development mode, check your terminal where the backend is running. Look for logs like:
        </p>
        <code className="text-xs bg-yellow-100 p-2 rounded block text-yellow-900">
          🔐 OTP for testuser@example.com (signup): 123456
        </code>
      </div>

      {/* OTP Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={handleOtpModalClose}
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
        email={otpEmail}
        purpose={otpPurpose}
        isLoading={isOtpLoading}
        error={otpError}
        expiresIn={otpExpiresIn}
        resendCooldown={60}
      />
    </div>
  );
} 