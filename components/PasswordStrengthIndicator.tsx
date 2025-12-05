import React from 'react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const calculateStrength = () => {
    let score = 0;
    if (password.length === 0) return 0;
    
    // Award points for various criteria
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Symbols

    // Convert score to a 0-4 scale for the UI
    if (score <= 2) return 1; // Weak
    if (score <= 3) return 2; // Medium
    if (score <= 4) return 3; // Good
    return 4; // Strong
  };

  const strength = calculateStrength();
  
  const strengthInfo = {
    0: { label: '', color: 'bg-zinc-700', textColor: '' },
    1: { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' },
    2: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    3: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' },
    4: { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-500' },
  };

  if (!password) {
    return null;
  }
  
  const currentStrength = strengthInfo[strength as keyof typeof strengthInfo];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              strength > index ? currentStrength.color : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-xs font-medium ${currentStrength.textColor}`}>
          {currentStrength.label}
        </p>
      )}
    </div>
  );
};