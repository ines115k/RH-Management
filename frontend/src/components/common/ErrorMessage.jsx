import React from 'react';

const ErrorMessage = ({ message }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center max-w-md mx-auto mt-8">
      <p className="font-semibold">⚠️ Erreur</p>
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default ErrorMessage;