import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

interface LoadingProfileProps {
  onComplete: () => void;
}

const loadingMessages = [
  "Analisando seu perfil...",
  "Calculando seu IMC...",
  "Avaliando seus hábitos...",
  "Preparando suas recomendações..."
];

function LoadingProfile({ onComplete }: LoadingProfileProps) {
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev: number) => (prev + 1) % loadingMessages.length);
    }, 1000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          onComplete();
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin mb-8">
          <Brain className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Estamos quase lá!
        </h2>
        <p className="text-gray-600 mb-4">
          {loadingMessages[messageIndex]}
        </p>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {progress}%
        </p>
      </div>
    </div>
  );
}

export default LoadingProfile; 