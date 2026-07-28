import React from 'react';

/**
 * A beautiful, premium loading spinner with customizable sizing.
 */
const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    primary: 'border-indigo-600/30 border-t-indigo-600',
    white: 'border-white/30 border-t-white',
    sky: 'border-sky-500/30 border-t-sky-500'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
