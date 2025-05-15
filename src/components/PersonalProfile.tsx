import React from 'react';
import { User, Scale, Target, Clock, Heart, Activity, TrendingUp, Calendar } from 'lucide-react';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTimeframe,
  calculateIdealWeight
} from '../utils/weightCalculations';

interface PersonalProfileProps {
  answers: {
    name: string;
    weight: string;
    height: string;
    targetWeight: string;
    age: string;
  };
  onContinue: () => void;
  isWoman: boolean;
}

const PersonalProfile: React.FC<PersonalProfileProps> = ({ answers, onContinue, isWoman }) => {
  const currentWeight = parseFloat(answers.weight || '0');
  const targetWeight = parseFloat(answers.targetWeight || '0');
  const heightInCm = parseFloat(answers.height || '0');
  const age = parseInt(answers.age || '0');

  const currentBMI = calculateBMI(currentWeight, heightInCm);
  const targetBMI = calculateBMI(targetWeight, heightInCm);
  const bmiCategory = getBMICategory(currentBMI);
  const bmr = calculateBMR(currentWeight, heightInCm, age, isWoman);
  const weightDiff = currentWeight - targetWeight;
  const timeframe = calculateTimeframe(weightDiff);
  const idealWeight = calculateIdealWeight(heightInCm);

  const getAgeRelatedMessage = () => {
    if (age > 40) {
      return "Atenção! Após os 40 anos, os riscos de pressão alta, doenças cardíacas e diabetes tipo 2 aumentam significativamente com um IMC não saudável. Cada ano que passa torna mais difícil reverter os danos à saúde.";
    } else if (age > 30) {
      return "Na sua idade, é crucial estabelecer hábitos saudáveis agora para prevenir problemas de saúde futuros. O metabolismo começa a desacelerar, tornando mais desafiador manter um peso saudável.";
    } else {
      return "Este é o momento ideal para estabelecer hábitos alimentares saudáveis. Seu metabolismo está no auge, e as mudanças positivas terão um impacto duradouro em sua saúde.";
    }
  };

  const ageInfo = getAgeRelatedMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          <div className="text-center mt-2 text-blue-600 font-medium">
            Seu Perfil Personalizado
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Seu Caminho para a Saúde
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Índice de Massa Corporal (IMC)
                </h2>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Ideal – 21.5</span>
                  <span className="text-gray-800 font-semibold">Seu – 31.2</span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gradient-to-r from-[#22c55e] via-[#22c55e] to-[#f87171] rounded-full">
                  </div>
                  <div 
                    className="absolute top-0 transform -translate-x-1/2"
                    style={{ 
                      left: `${Math.min(Math.max((currentBMI / 40) * 100, 0), 100)}%`,
                      marginTop: '-4px'
                    }}
                  >
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Abaixo do peso</span>
                  <span>Normal</span>
                  <span>Sobrepeso</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Meta: 02/06/2025</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    IMC esperado: <span className="text-green-600 font-medium">23.9</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-500" />
                  Análise Metabólica
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="text-gray-600 font-medium mb-2">Cenário Atual</div>
                    <div className="bg-red-50 rounded-lg p-4 text-gray-700">
                      <p className="text-sm">Seu metabolismo está operando em baixa eficiência devido a:</p>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
                        <li>Acúmulo de toxinas por má alimentação</li>
                        <li>Ritmo metabólico 45% mais lento que o ideal</li>
                        <li>Baixa capacidade de queima de gordura</li>
                        <li>Sistema digestivo sobrecarregado</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-medium mb-2">Projeção para 02/06/2025</div>
                    <div className="bg-green-50 rounded-lg p-4 text-gray-700">
                      <p className="text-sm">Com nosso programa, seu metabolismo estará:</p>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
                        <li>Funcionando em eficiência máxima</li>
                        <li>Taxa metabólica 85% mais acelerada</li>
                        <li>Sistema digestivo otimizado</li>
                        <li>Queima de gordura natural 24h por dia</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-500" />
                  Meta de {answers.name}
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-600">Peso Atual</div>
                      <div className="text-lg font-medium">{answers.weight} kg</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Peso Ideal</div>
                      <div className="text-lg font-medium text-green-600">{idealWeight} kg</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-gray-600 font-medium">Meta de Peso</div>
                    <div className="text-xl font-bold text-blue-600">{answers.targetWeight} kg</div>
                    <div className="mt-2 text-sm text-gray-500">
                      Você alcançará em {timeframe.days} dias
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-gray-600 font-medium">Data para Novo Peso</div>
                    <div className="text-xl font-bold text-purple-600">02/06/2025</div>
                    <div className="mt-2 text-sm text-gray-500">
                      Sua transformação está mais próxima do que você imagina
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-yellow-500" />
                  Seu Potencial
                </h2>
                <div className="space-y-4">
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-gray-700 font-medium mb-3">
                      Com nosso programa, você alcançará:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-900 font-medium">Prevenção de Doenças</span>
                          <p className="text-sm text-gray-600">Redução de 80% no risco de doenças graves como gordura no fígado, diabetes e AVC</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-900 font-medium">Metabolismo Renovado</span>
                          <p className="text-sm text-gray-600">Recupere o metabolismo da sua juventude, queimando gordura naturalmente</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-900 font-medium">Energia e Disposição</span>
                          <p className="text-sm text-gray-600">Aumente sua energia diária e disposição para todas as atividades</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-900 font-medium">Anti-inflamatório Natural</span>
                          <p className="text-sm text-gray-600">Elimine a inflamação do corpo e recupere sua saúde celular</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-900 font-medium">Alívio das Dores</span>
                          <p className="text-sm text-gray-600">Diga adeus às dores crônicas e desconfortos diários</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-900 font-medium">Sono Restaurador</span>
                          <p className="text-sm text-gray-600">Desfrute de um sono perfeito e completo todas as noites</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6" />
              {ageInfo}
            </h3>
            <div className="mt-4">
              <p className="font-medium">
                Comece sua transformação hoje e garanta uma vida mais saudável e feliz!
              </p>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl 
                     hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold
                     shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Ver Meu Plano Personalizado
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;