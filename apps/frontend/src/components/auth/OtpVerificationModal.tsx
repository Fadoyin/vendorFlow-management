'use client';

import React, { useState, useEffect, useRef } from 'react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
  purpose: 'signup' | 'login';
  isLoading?: boolean;
  error?: string;
  expiresIn?: number;
  resendCooldown?: number;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  onResend,
  email,
  purpose,
  isLoading = false,
  error,
  expiresIn = 300,
  resendCooldown = 60,
}) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [localError, setLocalError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setLocalError('');
      setTimeLeft(expiresIn);
      setResendTimeLeft(resendCooldown);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen, expiresIn, resendCooldown]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (timeLeft > 0 && isOpen) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isOpen]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendTimeLeft > 0 && isOpen) {
      const timer = setTimeout(() => setResendTimeLeft(resendTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimeLeft, isOpen]);

  if (!isOpen) return null;

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = otp.split('');
    newOtp[index] = value;
    const updatedOtp = newOtp.join('');
    setOtp(updatedOtp);
    setLocalError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (updatedOtp.length === 6) {
      handleVerify(updatedOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pastedData);
    
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpValue: string = otp) => {
    if (otpValue.length !== 6) {
      setLocalError('Please enter a 6-digit OTP');
      return;
    }

    try {
      await onVerify(otpValue);
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handleResend = async () => {
    if (resendTimeLeft > 0) return;
    
    setIsResending(true);
    setLocalError('');
    
    try {
      await onResend();
      setResendTimeLeft(resendCooldown);
      setTimeLeft(expiresIn);
      setOtp('');
    } catch (err) {
      // Error handling is done by parent component
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayError = error || localError;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-blue-600">🔐</span>
            Verify Your Email
          </h2>
        </div>

        <div className="space-y-6">
          {/* Information section */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
              <span className="text-blue-600 text-xl">📧</span>
            </div>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit verification code to
            </p>
            <p className="font-semibold">{maskedEmail}</p>
            <p className="text-xs text-gray-500">
              {purpose === 'signup' 
                ? 'Enter the code to complete your registration'
                : 'Enter the code to complete your login'
              }
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index] || ''}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-600">
                  Code expires in {formatTime(timeLeft)}
                </p>
              ) : (
                <p className="text-sm text-red-600">
                  Code has expired. Please request a new one.
                </p>
              )}
            </div>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{displayError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleVerify()}
              disabled={otp.length !== 6 || isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600">Didn't receive the code? </span>
              <button
                onClick={handleResend}
                disabled={resendTimeLeft > 0 || isResending}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-1">🔄</span>
                    Sending...
                  </span>
                ) : resendTimeLeft > 0 ? (
                  `Resend in ${resendTimeLeft}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Check your spam folder if you don't see the email.</p>
            <p>The code is valid for {Math.floor(expiresIn / 60)} minutes.</p>
          </div>

          {/* Close Button */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 