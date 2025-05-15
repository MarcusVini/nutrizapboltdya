import React, { useState, useEffect } from 'react';
import { CheckCircle2, Star, Loader2, Award, Shield, Brain, Activity, Utensils, Target } from 'lucide-react';

interface FullPageLoadingProps {
  userName: string;
  onComplete: () => void;
}

interface ProgressStep {
  title: string;
  subtitle: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
  icon: React.ReactNode;
}

const TOTAL_DURATION = 12000; // 12 seconds in milliseconds

const FullPageLoading: React.FC<FullPageLoadingProps> = ({ userName, onComplete }) => {
  // Prevent automatic scrolling
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [steps, setSteps] = useState<ProgressStep[]>([
    { 
      title: 'Analisando seu metabolismo', 
      subtitle: 'Calculando sua taxa metabólica basal e gasto calórico diário',
      progress: 0, 
      status: 'in-progress',
      icon: <Brain className="w-5 h-5" />
    },
    { 
      title: 'Definindo metas personalizadas', 
      subtitle: 'Estabelecendo objetivos realistas baseados no seu perfil',
      progress: 0, 
      status: 'pending',
      icon: <Target className="w-5 h-5" />
    },
    { 
      title: 'Criando plano nutricional', 
      subtitle: 'Adaptando cardápios às suas preferências e necessidades',
      progress: 0, 
      status: 'pending',
      icon: <Utensils className="w-5 h-5" />
    },
    { 
      title: 'Otimizando resultados', 
      subtitle: 'Ajustando estratégias para máxima eficiência',
      progress: 0, 
      status: 'pending',
      icon: <Activity className="w-5 h-5" />
    }
  ]);

  useEffect(() => {
    const stepDuration = TOTAL_DURATION / steps.length;
    const progressInterval = 50; // Update progress every 50ms
    const progressIncrement = 100 / (stepDuration / progressInterval);
    const intervals: NodeJS.Timeout[] = [];
    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((_, stepIndex) => {
      const stepStartTime = stepIndex * stepDuration;

      // Start the step
      const startTimeout = setTimeout(() => {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          if (stepIndex > 0) {
            newSteps[stepIndex - 1].status = 'completed';
            newSteps[stepIndex - 1].progress = 100;
          }
          newSteps[stepIndex].status = 'in-progress';
          return newSteps;
        });
      }, stepStartTime);

      timeouts.push(startTimeout);

      // Progress updates for the step
      const progressTimer = setInterval(() => {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          if (newSteps[stepIndex].status === 'in-progress' && newSteps[stepIndex].progress < 100) {
            newSteps[stepIndex].progress = Math.min(
              newSteps[stepIndex].progress + progressIncrement,
              100
            );
          }
          return newSteps;
        });
      }, progressInterval);

      intervals.push(progressTimer);

      // Cleanup interval after step duration
      const cleanupTimeout = setTimeout(() => {
        clearInterval(progressTimer);
      }, stepStartTime + stepDuration);

      timeouts.push(cleanupTimeout);
    });

    // Final cleanup and redirection after total duration
    const finalTimeout = setTimeout(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        newSteps[steps.length - 1].status = 'completed';
        newSteps[steps.length - 1].progress = 100;
        return newSteps;
      });
      
      // Call the onComplete callback after all steps are done
      onComplete();
    }, TOTAL_DURATION);

    timeouts.push(finalTimeout);

    // Cleanup function
    return () => {
      intervals.forEach(interval => clearInterval(interval));
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const certifications = [
    { name: 'AFAA', color: 'bg-blue-100 text-blue-700', description: 'Certificação Internacional em Fitness' },
    { name: 'ADAPT', color: 'bg-green-100 text-green-700', description: 'Especialização em Nutrição Funcional' },
    { name: 'NBC-HWC', color: 'bg-purple-100 text-purple-700', description: 'Coaching de Saúde e Bem-estar' },
    { name: 'NASM', color: 'bg-red-100 text-red-700', description: 'Treinamento Físico Avançado' }
  ];

  const experts = [
    {
      name: 'Dr. Glenn Fernandez',
      title: 'PhD em Psicologia e Coach de Saúde',
      credentials: '15+ anos de experiência',
      specialties: ['Mudança Comportamental', 'Psicologia do Emagrecimento'],
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&h=80'
    },
    {
      name: 'Dra. Renée Clayton',
      title: 'Nutricionista Especialista em Emagrecimento',
      credentials: 'Mestrado em Nutrição Clínica',
      specialties: ['Nutrição Funcional', 'Metabolismo'],
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80'
    },
    {
      name: 'Sandi Korshnak',
      title: 'Especialista em Transformação Corporal',
      credentials: 'Coach NASM Certificada',
      specialties: ['Reeducação Alimentar', 'Condicionamento Físico'],
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80'
    },
    {
      name: 'Dr. Robert Schneeberger',
      title: 'Pesquisador em Nutrição e Metabolismo',
      credentials: 'PhD pela Universidade Cornell',
      specialties: ['Cronobiologia', 'Otimização Metabólica'],
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Preparando seu programa personalizado
          </h2>
          <p className="text-gray-600 text-center mb-8 text-lg">
            {userName}, estamos criando um plano exclusivo baseado em dados científicos 
            para garantir seus resultados.
          </p>

          <div className="space-y-6 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'in-progress' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-gray-800 font-semibold">{step.title}</h3>
                      <p className="text-sm text-gray-500">{step.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {Math.round(step.progress)}%
                    </span>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : step.status === 'in-progress'
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                    }`}
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${cert.color}`}
              >
                <Award className="w-4 h-4" />
                <div>
                  <span className="font-semibold text-sm">{cert.name}</span>
                  <p className="text-xs opacity-75">{cert.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Time de Especialistas
            </h1>
            <p className="text-gray-600">
              Seu plano é desenvolvido por profissionais reconhecidos internacionalmente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {experts.map((expert, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                />
                <div>
                  <h3 className="font-bold text-gray-800">{expert.name}</h3>
                  <p className="text-purple-600 font-medium text-sm">{expert.title}</p>
                  <p className="text-gray-500 text-sm">{expert.credentials}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expert.specialties.map((specialty, idx) => (
                      <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Shield className="w-5 h-5" />
            <span>Seus dados estão protegidos com criptografia de ponta a ponta</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPageLoading;