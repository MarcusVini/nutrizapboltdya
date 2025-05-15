import React from 'react';
import {
  calculateIdealWeight,
  getBMICategory,
  calculateTimeframe,
  calculateWeightLossPercentage
} from '../utils/weightCalculations';
import { IDEAL_BMI } from '../utils/weightCalculations';

interface BMIProfileProps {
  bmi: number;
  weight: number;
  userName: string;
  age: number;
  heightInCm: number;
}

interface WeightRange {
  min: number;
  ideal: number;
  max: number;
}

interface Risk {
  icon: string;
  title: string;
  description: string;
}

interface TimeframeResult {
  weeks: number;
  targetDate: Date;
}

interface WeightGoal {
  currentWeight: number;
  targetWeight: number;
  difference: number;
  isGain: boolean;
}

interface TimeframeData {
  days: number;
  type: 'days' | 'weeks' | 'months';
  dailyLoss: number;
  message: string;
}

const BMIProfile: React.FC<BMIProfileProps> = ({ bmi, weight, userName, age, heightInCm }) => {
  // Validação dos dados de entrada
  if (!weight || weight <= 0 || weight > 300) {
    console.error('Peso inválido:', weight);
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Por favor, insira um peso válido entre 30 e 300 kg.</p>
      </div>
    );
  }

  if (!age || age <= 0 || age > 120) {
    console.error('Idade inválida:', age);
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Por favor, insira uma idade válida entre 1 e 120 anos.</p>
      </div>
    );
  }

  const idealWeight = calculateIdealWeight(heightInCm);
  const weightDiff = Math.abs(weight - idealWeight);
  const timeframe = calculateTimeframe(weightDiff, bmi);
  
  // Formatação do peso ideal para exibição
  const formattedIdealWeight = idealWeight > 0 ? `${idealWeight.toFixed(1)} kg` : 'Calculando...';

  const getAgeRiskMessage = () => {
    const bmiRiskFactor = bmi >= 30 ? 2 : bmi >= 25 ? 1.5 : 1;
    const baseRisk = age < 30 ? 2 : age < 40 ? 4 : age < 50 ? 8 : 12;
    const totalRisk = Math.round(baseRisk * bmiRiskFactor);

    if (age < 30) {
      return `${userName}, aos ${age} anos, seu corpo ainda tem grande capacidade de recuperação${bmi >= 25 ? ', mas seu IMC elevado já representa riscos' : ''}. A cada ano que passa, seu metabolismo desacelera ${totalRisk}%, tornando a perda de peso mais difícil.`;
    } else if (age < 40) {
      return `${userName}, aos ${age} anos, seu metabolismo já está ${totalRisk}% mais lento do que aos 25${bmi >= 25 ? ' e seu IMC elevado aumenta os riscos' : ''}. Cada ano de espera torna a perda de peso ${totalRisk}% mais desafiadora.`;
    } else if (age < 50) {
      return `${userName}, aos ${age} anos, os riscos à saúde aumentam ${totalRisk}% ao ano${bmi >= 25 ? ' e seu IMC elevado agrava essa situação' : ''}. O acúmulo de gordura visceral pode estar afetando seus órgãos internos silenciosamente.`;
    } else {
      return `${userName}, aos ${age} anos, sua saúde exige atenção imediata${bmi >= 25 ? ' especialmente com seu IMC atual' : ''}. O excesso de peso nessa idade multiplica em ${totalRisk}x os riscos de doenças graves. Não há tempo a perder!`;
    }
  };

  const getMetabolicMessage = () => {
    const weightToLose = weight > idealWeight ? weightDiff : 0;
    const weightToGain = weight < idealWeight ? weightDiff : 0;

    if (weightToLose > 0) {
      return (
        <div className="space-y-2">
          <p className="text-pink-600 font-semibold">
            Meta: Perder {weightToLose.toFixed(1)} kg
          </p>
          <p className="text-gray-700">
            Com nosso programa personalizado, você pode alcançar essa meta de forma saudável e sustentável! 
            Nossos especialistas desenvolveram um método que já ajudou milhares de pessoas a atingirem seus objetivos.
          </p>
          <p className="text-gray-600 mt-2">
            ✨ Você sabia? Perder apenas 5-10% do peso já traz benefícios significativos para sua saúde!
          </p>
        </div>
      );
    } else if (weightToGain > 0) {
      return (
        <div className="space-y-2">
          <p className="text-pink-600 font-semibold">
            Meta: Ganhar {weightToGain.toFixed(1)} kg de forma saudável
          </p>
          <p className="text-gray-700">
            Com nosso programa personalizado, você pode ganhar peso de maneira saudável e equilibrada! 
            Nossos especialistas irão te ajudar a desenvolver massa magra e melhorar sua saúde geral.
          </p>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <p className="text-green-600 font-semibold">
            Parabéns! Você está no peso ideal!
          </p>
          <p className="text-gray-700">
            Agora é hora de manter esse peso e melhorar ainda mais sua composição corporal com um plano nutricional personalizado.
          </p>
        </div>
      );
    }
  };

  // Removendo o cálculo redundante da altura e usando heightInCm diretamente
  const weightRange: WeightRange = {
    min: 18.5 * ((heightInCm / 100) * (heightInCm / 100)),
    ideal: IDEAL_BMI * ((heightInCm / 100) * (heightInCm / 100)),
    max: 24.9 * ((heightInCm / 100) * (heightInCm / 100))
  };

  const calculateWeightGoal = (): WeightGoal => {
    const idealWeight = calculateIdealWeight(heightInCm);
    const difference = Math.abs(weight - idealWeight);
    const isGain = weight < idealWeight;

    return {
      currentWeight: weight,
      targetWeight: idealWeight,
      difference,
      isGain
    };
  };

  const getTimeframe = (weightDifference: number, currentBMI: number): TimeframeResult => {
    const timeframeData = calculateTimeframe(weightDifference, currentBMI);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + timeframeData.days);

    return {
      weeks: Math.ceil(timeframeData.days / 7),
      targetDate
    };
  };

  // Calculando a data alvo dinamicamente baseada no timeframe
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + timeframe.days);
  const formattedTargetDate = targetDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getWeightMessage = (bmi: number, weight: number, userName: string) => {
    const idealWeight = calculateIdealWeight(heightInCm);
    const weightDiff = Math.abs(weight - idealWeight);
    const percentageDiff = (weightDiff / idealWeight) * 100;
    
    if (weight > idealWeight) {
      let title = '';
      if (percentageDiff > 40) {
        title = 'Vamos começar sua jornada de transformação!';
      } else if (percentageDiff > 20) {
        title = 'Você já está no caminho certo!';
      } else if (percentageDiff > 10) {
        title = 'Você está progredindo bem!';
      } else {
        title = 'Você está muito perto do seu objetivo!';
      }

      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-pink-600">
            {title}
          </h3>
          <p className="text-gray-700">
            {userName}, para atingir seu peso ideal você precisa perder {weightDiff.toFixed(1)}kg. 
            Com nosso programa personalizado, você alcançará sua meta até {formattedTargetDate}.
          </p>
          <p className="text-gray-600">
            Nosso programa se adapta ao seu metabolismo e estilo de vida, garantindo uma perda de peso 
            saudável e definitiva. Resultados garantidos ou seu dinheiro de volta!
          </p>
        </div>
      );
    } else if (weight < idealWeight) {
      let title = '';
      if (percentageDiff > 20) {
        title = 'Vamos começar sua jornada de ganho de peso saudável!';
      } else if (percentageDiff > 10) {
        title = 'Você está no caminho do ganho de peso saudável!';
      } else {
        title = 'Você está próximo do seu peso ideal!';
      }

      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-pink-600">
            {title}
          </h3>
          <p className="text-gray-700">
            {userName}, para atingir seu peso ideal você precisa ganhar {weightDiff.toFixed(1)}kg. 
            Com nosso programa personalizado, você alcançará sua meta até {formattedTargetDate}.
          </p>
          <p className="text-gray-600">
            Nosso programa se adapta ao seu metabolismo e estilo de vida, garantindo um ganho de peso 
            saudável e definitivo. Resultados garantidos ou seu dinheiro de volta!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">
          Parabéns! Você está no seu peso ideal!
        </h3>
        <p className="text-gray-700">
          {userName}, agora é importante manter seu peso e melhorar sua composição corporal 
          com uma alimentação balanceada.
        </p>
        <p className="text-gray-600">
          Nosso programa personalizado vai te ajudar a manter seu peso ideal e otimizar 
          sua saúde. Resultados garantidos ou seu dinheiro de volta!
        </p>
      </div>
    );
  };

  const getLifestyleMessage = () => {
    if (bmi < 25) {
      return `Mesmo com um IMC normal, uma alimentação personalizada pode melhorar significativamente sua saúde:
• Aumento de 40% na energia diária
• Melhor qualidade do sono
• Sistema imunológico mais forte
• Redução do risco de doenças futuras`;
    }
    return `Com um plano alimentar personalizado, você vai:
• Perder peso de forma saudável e duradoura
• Aumentar sua energia em 40%
• Melhorar sua qualidade de sono
• Fortalecer seu sistema imunológico
• Reduzir riscos de saúde`;
  };

  const getRisks = () => {
    const baseRisks: Risk[] = [
      {
        icon: '❤️',
        title: 'Doenças cardiovasculares',
        description: `Risco aumentado em ${bmi >= 30 ? '300%' : bmi >= 25 ? '150%' : '50%'}`
      },
      {
        icon: '🩺',
        title: 'Diabetes tipo 2',
        description: `Risco aumentado em ${bmi >= 30 ? '400%' : bmi >= 25 ? '200%' : '50%'}`
      },
      {
        icon: '🦵',
        title: 'Problemas articulares',
        description: `${Math.max(0, (weight - weightRange.ideal)).toFixed(1)}kg de sobrecarga`
      },
      {
        icon: '😴',
        title: 'Distúrbios do sono',
        description: `Redução de ${bmi >= 30 ? '50%' : bmi >= 25 ? '35%' : '15%'} na qualidade`
      }
    ];

    if (age > 40) {
      baseRisks.push({
        icon: '🫀',
        title: 'Pressão arterial elevada',
        description: 'Risco aumentado em 250%'
      });
    }

    if (bmi >= 30) {
      baseRisks.push({
        icon: '🧬',
        title: 'Inflamação crônica',
        description: 'Afeta todo o organismo'
      });
    }

    return baseRisks;
  };

  // Atualizando a mensagem sobre metabolismo lento
  const getMetabolicSlowdown = () => {
    const baseSlowdown = age > 40 ? 0.4 : 0.3;
    const bmiMultiplier = bmi >= 30 ? 1.5 : bmi >= 25 ? 1.2 : 1;
    return Math.round(baseSlowdown * bmiMultiplier * 100);
  };

  return (
    <div className="space-y-6">
      {/* IMC Header */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-5xl font-bold text-red-600 leading-none mb-2">{bmi.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Seu IMC atual</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-600 mb-1" style={{ maxWidth: '160px', wordWrap: 'break-word' }}>{getBMICategory(bmi)}</div>
              <div className="text-sm text-gray-600 whitespace-normal">Classificação</div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Barra de IMC */}
            <div className="relative">
              <div className="h-3 flex rounded-full overflow-hidden">
                <div className="w-[15%] bg-blue-400" /> {/* Abaixo do peso */}
                <div className="w-[25%] bg-green-400" /> {/* Peso normal */}
                <div className="w-[20%] bg-yellow-400" /> {/* Sobrepeso */}
                <div className="flex-1 bg-red-400" /> {/* Obesidade */}
              </div>
              {/* Marcador de posição atual */}
              <div 
                className="absolute top-0 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-gray-800 transform -translate-x-1/2 -translate-y-1/4"
                style={{ left: `${Math.min((bmi / 40) * 100, 100)}%` }}
              />
              {/* Marcadores de IMC */}
              <div className="flex justify-between text-xs mt-2 text-gray-600">
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>

            {/* Peso e Meta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-600">Seu peso atual:</div>
                  <div className="text-xl font-bold">{weight.toFixed(1)} kg</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Peso ideal:</div>
                  <div className="text-xl font-bold text-green-600">{formattedIdealWeight}</div>
                </div>
              </div>
              {getWeightMessage(bmi, weight, userName)}
            </div>

            {/* Mensagem de Qualidade de Vida */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                ✨ Benefícios de um plano alimentar personalizado:
              </h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {getLifestyleMessage()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem Principal */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
        <h2 className="text-xl font-bold text-gray-800 mb-3 leading-snug">
          {getAgeRiskMessage()}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {getMetabolicMessage()}
        </p>
      </div>

      {/* Riscos à Saúde */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
          <span>🚨</span> Riscos imediatos à sua saúde:
        </h3>
        <div className="grid gap-3">
          {getRisks().map((risk, index) => (
            <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 hover:border-red-200 transition-colors">
              <div className="text-2xl flex-shrink-0">{risk.icon}</div>
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{risk.title}</div>
                <div className="text-red-600 text-sm">{risk.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por que isso acontece */}
      <div className="bg-blue-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span>🔬</span> Por que isso está acontecendo?
        </h3>
        <div className="space-y-3 text-gray-700">
          <p>Com um IMC de {bmi.toFixed(1)}, seu corpo está em constante estado de estresse metabólico:</p>
          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>Suas células estão {Math.round(bmi >= 30 ? 45 : 35)}% menos sensíveis à insulina</li>
            <li>Seu corpo produz {bmi >= 30 ? '3x' : '2x'} mais citocinas inflamatórias</li>
            <li>Seu metabolismo está até {getMetabolicSlowdown()}% mais lento</li>
            <li>Você queima {Math.round(bmi >= 30 ? 45 : 25)}% menos gordura durante o sono</li>
          </ul>
        </div>
      </div>

      {/* Solução */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
          <span>✅</span> A solução comprovada:
        </h3>
        <div className="bg-white p-4 rounded-lg border border-green-100">
          <p className="font-medium text-gray-800 mb-3">Plano alimentar personalizado para seu metabolismo atual:</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-xl">🔬</span>
              <span className="text-sm text-gray-700">Desenvolvido por nutricionistas especializados</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span className="text-sm text-gray-700">Ajustado ao seu IMC de {bmi.toFixed(1)} e idade</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">🥗</span>
              <span className="text-sm text-gray-700">Cardápio flexível e adaptável</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <span className="text-sm text-gray-700">Acelera seu metabolismo em 30 dias</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white">
        <h3 className="text-xl font-bold mb-4">
          🎯 {userName}, este é seu momento:
        </h3>
        <ul className="space-y-3 mb-4">
          <li className="flex items-center gap-3">
            <span>✨</span>
            <span className="text-sm">Plano personalizado para seu IMC</span>
          </li>
          <li className="flex items-center gap-3">
            <span>👥</span>
            <span className="text-sm">Método que já transformou +185.000 vidas</span>
          </li>
          <li className="flex items-center gap-3">
            <span>✅</span>
            <span className="text-sm">Garantia total de resultados</span>
          </li>
        </ul>
        <div className="p-3 bg-white/10 rounded-lg">
          <p className="text-sm font-medium text-blue-100">
            ⏰ O tempo está passando. A cada dia, seu metabolismo fica 0.1% mais lento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BMIProfile;