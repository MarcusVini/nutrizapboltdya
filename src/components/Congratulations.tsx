import React from 'react';
import { PartyPopper, Check, Clock, Target } from 'lucide-react';

interface TimeframeData {
  message: string;
}

interface WeightLossData {
  extraWeightLoss: number;
  timeframe: TimeframeData;
  isReasonable: boolean;
}

interface CongratulationsProps {
  onContinue: () => void;
  userName: string;
  weightLossData: WeightLossData;
}

const Congratulations: React.FC<CongratulationsProps> = ({ onContinue, userName, weightLossData }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {/* Header com animação */}
          <div className="text-center mb-8">
            <div className="mb-6 animate-bounce">
              <PartyPopper className="w-16 h-16 text-[#FF6B6B] mx-auto" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Incrível, {userName}! 🎉
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] mx-auto rounded-full mb-6"></div>
          </div>

          {/* Mensagem Principal */}
          <div className="space-y-6 mb-8">
            <p className="text-xl text-gray-700 text-center leading-relaxed">
              {weightLossData?.isReasonable ? (
                <>
                  Sua meta é perfeitamente alcançável! Com nosso método exclusivo, você pode perder até{' '}
                  <span className="font-bold text-[#FF6B6B]">{weightLossData.extraWeightLoss.toFixed(1)}kg</span>{' '}
                  em apenas <span className="font-bold text-[#FF6B6B]">{weightLossData.timeframe.message}</span>!{' '}
                  Nosso método foi desenvolvido para te ajudar a atingir seu peso desejado de forma saudável e consistente.
                </>
              ) : (
                <>
                  Entendemos sua ambição! Vamos trabalhar juntos para perder{' '}
                  <span className="font-bold text-[#FF6B6B]">{weightLossData.extraWeightLoss.toFixed(1)}kg</span>{' '}
                  em <span className="font-bold text-[#FF6B6B]">{weightLossData.timeframe.message}</span>{' '}
                  de forma saudável e duradoura! Nosso método foi desenvolvido para maximizar seus resultados com segurança.
                </>
              )}
            </p>
          </div>

          {/* Cards de Benefícios */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#FFF5F5] p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Check className="w-5 h-5 text-[#FF6B6B]" />
                <h3 className="font-semibold text-[#FF6B6B]">Método Comprovado</h3>
              </div>
              <p className="text-sm text-gray-600">
                Mais de 185.000 pessoas já transformaram suas vidas com nosso programa personalizado.
              </p>
            </div>
            <div className="bg-[#FFF5F5] p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-[#FF6B6B]" />
                <h3 className="font-semibold text-[#FF6B6B]">Resultados Rápidos</h3>
              </div>
              <p className="text-sm text-gray-600">
                Você verá os primeiros resultados em apenas 7 dias seguindo nosso plano.
              </p>
            </div>
          </div>

          {/* Lista de Benefícios */}
          <div className="bg-gradient-to-r from-[#FFF5F5] to-[#FFE5E5] rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FF6B6B]" />
              O que você vai conquistar:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B6B] font-bold mt-1">✓</span>
                <span className="text-gray-700">Perda de peso saudável e consistente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B6B] font-bold mt-1">✓</span>
                <span className="text-gray-700">Mais energia e disposição no dia a dia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B6B] font-bold mt-1">✓</span>
                <span className="text-gray-700">Melhor qualidade de sono</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B6B] font-bold mt-1">✓</span>
                <span className="text-gray-700">Redução da ansiedade por comida</span>
              </li>
            </ul>
          </div>

          {/* Mensagem de Garantia */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 mb-2">
              Você terá acesso a um plano 100% personalizado e poderá comer o que gosta!
            </p>
            <p className="text-sm font-medium text-[#FF6B6B]">
              Garantia total de resultados ou seu dinheiro de volta!
            </p>
          </div>

          {/* Botão de Continuar */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white px-8 py-4 rounded-xl 
                     hover:from-[#FF5252] hover:to-[#FF6B6B] transition-all duration-200 font-semibold
                     shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Começar Minha Transformação
          </button>
        </div>
      </div>
    </div>
  );
};

export default Congratulations;