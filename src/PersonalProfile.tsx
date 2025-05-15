import React from 'react';
import { User, Scale, Target } from 'lucide-react';

interface PersonalProfileProps {
  answers: Record<string, string>;
  onContinue: () => void;
  isWoman: boolean;
}

const PersonalProfile: React.FC<PersonalProfileProps> = ({ answers, onContinue, isWoman }) => {
  const calculateBMI = () => {
    const weight = parseFloat(answers.weight || '0');
    const height = parseFloat(answers.height || '0') / 100;
    if (weight && height) {
      return weight / (height * height);
    }
    return 0;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);
  const age = parseInt(answers.age || '0');

  const getAgeRelatedMessage = () => {
    if (age > 40) {
      return "Atenção! Após os 40 anos, os riscos de pressão alta, doenças cardíacas e diabetes tipo 2 aumentam significativamente com um IMC não saudável. Cada ano que passa torna mais difícil reverter os danos à saúde.";
    } else if (age > 30) {
      return "Na sua idade, é crucial estabelecer hábitos saudáveis agora para prevenir problemas de saúde futuros. O metabolismo começa a desacelerar, tornando mais desafiador manter um peso saudável.";
    } else {
      return "Este é o momento ideal para estabelecer hábitos alimentares saudáveis. Seu metabolismo está no auge, e as mudanças positivas terão um impacto duradouro em sua saúde.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          <div className="text-center mt-2 text-blue-600 font-medium">
            Hábitos
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Seu perfil pessoal
          </h1>

          <div className="mb-8 bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Índice de Massa Corporal (IMC)
            </h2>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Ideal – 21.5</span>
              <span className="text-gray-800 font-medium">Seu – {bmi.toFixed(1)}</span>
            </div>
            <div className="relative h-4 bg-gradient-to-r from-[#4CAF50] via-[#FFC107] to-[#F44336] rounded-full mb-2">
              <div 
                className="absolute top-0 transform -translate-x-1/2"
                style={{ left: `${(bmi / 40) * 100}%`, marginTop: '-8px' }}
              >
                <div 
                  className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]"
                  style={{ borderTopColor: bmi >= 25 ? '#F44336' : '#000' }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Abaixo do peso</span>
              <span>Normal</span>
              <span>Sobrepeso</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-gray-600">Nome</div>
                  <div className="text-lg font-medium">{answers.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Scale className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-gray-600">Tipo corporal</div>
                  <div className="text-lg font-medium">{bmiCategory}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Target className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-gray-600">Meta</div>
                  <div className="text-lg font-medium">
                    Perder {(parseFloat(answers.weight) - parseFloat(answers.targetWeight)).toFixed(1)} kg
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-64 h-64 overflow-hidden">
                <img
                  src={isWoman 
                    ? "https://clickaris.com/wp-content/uploads/2025/04/mulher.png"
                    : "https://clickaris.com/wp-content/uploads/2025/04/homem.png"
                  }
                  alt={isWoman ? "Mulher em roupas fitness" : "Homem em roupas fitness"}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Avaliação Personalizada
            </h3>
            <p className="text-gray-700 mb-4">
              {getAgeRelatedMessage()}
            </p>
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">
                Principais riscos identificados para seu perfil:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                {bmi >= 25 && (
                  <>
                    <li>Risco aumentado de doenças cardiovasculares</li>
                    <li>Maior probabilidade de desenvolver diabetes tipo 2</li>
                    <li>Sobrecarga nas articulações</li>
                  </>
                )}
                {age > 40 && (
                  <>
                
                    <li>Metabolismo mais lento</li>
                    <li>Maior dificuldade na perda de peso</li>
                    <li>Recuperação mais lenta após exercícios</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">
              Sua Janela de Oportunidade
            </h3>
            <p className="mb-4">
              {age > 40
                ? "Não espere mais! Cada ano que passa torna mais desafiador alcançar seus objetivos de saúde."
                : "Aproveite seu metabolismo atual! Este é o momento ideal para estabelecer hábitos saudáveis."}
            </p>
            <p className="font-medium">
              Acesse agora seu plano personalizado e comece sua transformação!
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full mt-8 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 
                     transition-colors duration-200 font-semibold"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;