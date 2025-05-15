import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

interface LoadingScreenProps {
  userName: string;
}

const loadingMessages = [
  "Analisando suas respostas...",
  "Calculando seu perfil metabólico...",
  "Gerando recomendações personalizadas...",
  "Finalizando seu diagnóstico..."
];

function LoadingScreen({ userName }: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin mb-8">
          <Brain className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {userName}, estamos quase lá!
        </h2>
        <p className="text-gray-600 mb-4">
          {loadingMessages[messageIndex]}
        </p>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;