import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Heart, Coffee, Scale, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HealthQuestionnaire {
  id: string;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_heart_disease: boolean;
  has_thyroid_issues: boolean;
  other_conditions: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_pescatarian: boolean;
  has_gluten_allergy: boolean;
  has_lactose_intolerance: boolean;
  has_nut_allergy: boolean;
  other_allergies: string;
  sleep_hours: number;
  stress_level: string;
  water_intake_liters: number;
  alcohol_consumption: string;
  smoking_status: string;
  exercise_frequency: string;
  exercise_intensity: string;
  preferred_exercise_types: string[];
  meal_frequency: number;
  snacking_frequency: string;
  emotional_eating: boolean;
  night_eating: boolean;
}

const MemberArea: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState<HealthQuestionnaire | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      
      // Check if user has completed questionnaire
      const { data: questionnaireData } = await supabase
        .from('health_questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (questionnaireData) {
        setQuestionnaire(questionnaireData);
      } else {
        setShowQuestionnaire(true);
      }
      
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showQuestionnaire) {
    return <HealthQuestionnaireForm userId={user.id} onComplete={() => setShowQuestionnaire(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Plano Alimentar
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Progresso
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Configurações
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Meal Plan Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Coffee className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Plano Alimentar
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          21 Dias
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-900">
                    Ver detalhes
                  </a>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Scale className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Progresso
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          -2.5 kg
                        </div>
                        <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <span className="sr-only">Aumento de</span>
                          12%
                        </p>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-900">
                    Ver histórico
                  </a>
                </div>
              </div>
            </div>

            {/* Next Meal Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Próxima Refeição
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          Almoço
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-900">
                    Ver cardápio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface HealthQuestionnaireFormProps {
  userId: string;
  onComplete: () => void;
}

const HealthQuestionnaireForm: React.FC<HealthQuestionnaireFormProps> = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    has_diabetes: false,
    has_hypertension: false,
    has_heart_disease: false,
    has_thyroid_issues: false,
    other_conditions: '',
    is_vegetarian: false,
    is_vegan: false,
    is_pescatarian: false,
    has_gluten_allergy: false,
    has_lactose_intolerance: false,
    has_nut_allergy: false,
    other_allergies: '',
    sleep_hours: 7,
    stress_level: 'Moderado',
    water_intake_liters: 2,
    alcohol_consumption: 'Raramente',
    smoking_status: 'Não fumante',
    exercise_frequency: '3-4 vezes por semana',
    exercise_intensity: 'Moderada',
    preferred_exercise_types: [],
    meal_frequency: 4,
    snacking_frequency: 'Às vezes',
    emotional_eating: false,
    night_eating: false
  });

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('health_questionnaires')
        .insert([
          {
            user_id: userId,
            ...formData
          }
        ]);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving questionnaire:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Condições Médicas</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.has_diabetes}
                  onChange={(e) => setFormData({ ...formData, has_diabetes: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Diabetes</span>
              </label>
              {/* Add more medical conditions here */}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Restrições Alimentares</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.is_vegetarian}
                  onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Vegetariano</span>
              </label>
              {/* Add more dietary restrictions here */}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Estilo de Vida</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Horas de sono por noite
                </label>
                <input
                  type="number"
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData({ ...formData, sleep_hours: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {/* Add more lifestyle questions here */}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Questionário de Saúde
            </h1>
            <p className="mt-2 text-gray-600">
              Para criar seu plano personalizado, precisamos conhecer melhor sua saúde.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 text-center">
              Passo {currentStep} de 3
            </div>
          </div>

          {renderStep()}

          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ml-auto"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ml-auto"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberArea;