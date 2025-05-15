import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { QuizQuestion } from './types';
import { questions } from './questions';
import LoadingScreen from './components/LoadingScreen';
import DiagnosisReport from './components/DiagnosisReport';
import BMIProfile from './components/BMIProfile';
import Congratulations from './components/Congratulations';
import PersonalProfile from './components/PersonalProfile';
import SubscriptionForm from './components/SubscriptionForm';
import SalesPage from './components/SalesPage';
import FullPageLoading from './components/FullPageLoading';
import { getFingerprint } from './lib/fingerprint';
import { supabase, sendQuizToN8N } from './lib/supabase';
import { godMode, defaultAnswers } from './dev-config';
import { GTMProvider } from './components/GTM/GTMProvider';
import { quizEvents } from './lib/gtm';

function App() {
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(!godMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(godMode ? defaultAnswers : {});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');
  const [showBMIProfile, setShowBMIProfile] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showPersonalProfile, setShowPersonalProfile] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [showFullPageLoading, setShowFullPageLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heightUnit, setHeightUnit] = useState('CM');
  const [fakeCounter, setFakeCounter] = useState(Math.floor(Math.random() * (15000 - 12000) + 12000));

  const cleanWhatsappNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    return cleaned;
  };

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await getFingerprint();
        console.log('Generated fingerprint:', fp);
        localStorage.setItem('fingerprint', fp);
        setFingerprint(fp);
      } catch (error) {
        console.error('Error generating fingerprint:', error);
      }
    };

    const getIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log('Retrieved IP address:', data.ip);
        setIpAddress(data.ip);
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };

    // Rastreia o PageView apenas uma vez quando o componente é montado
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }

    initFingerprint();
    getIpAddress();
  }, []);

  useEffect(() => {
    if (godMode && currentStep < questions.length) {
      const currentQuestion = questions[currentStep];
      const defaultValue = defaultAnswers[currentQuestion.id];
      if (defaultValue) {
        setTextInput(defaultValue);
      }
    }
  }, [currentStep]);

  useEffect(() => {
    // Efeito para o contador fake de pessoas
    const interval = setInterval(() => {
      setFakeCounter(prev => {
        const variation = Math.floor(Math.random() * 5) + 1;
        const shouldIncrease = Math.random() > 0.3; // 70% chance de aumentar
        return shouldIncrease ? prev + variation : prev - variation;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep === 0) {
      // Remove setting answers.name with tempName
      // setAnswers(prev => ({ ...prev, name: tempName }));
    }
  }, [currentStep]);

  const submitToSupabase = async (data: Record<string, any>) => {
    if (isSubmitting) return;
    if (!fingerprint || !ipAddress) {
      console.error('Fingerprint or IP address not available', { fingerprint, ipAddress });
      return;
    }

    setIsSubmitting(true);

    try {
      // Limpa o número do WhatsApp antes de enviar
      const cleanedWhatsapp = data.whatsapp ? cleanWhatsappNumber(data.whatsapp) : data.whatsapp;

      const payload = {
        fingerprint,
        ip_address: ipAddress,
        lead_name: data.name,
        email: data.email,
        whatsapp: cleanedWhatsapp,
        weight_loss_goal: data.weightLossGoal,
        age: parseInt(data.age),
        height_cm: parseInt(data.height),
        current_weight_kg: parseFloat(data.weight),
        target_weight_kg: parseFloat(data.targetWeight),
        gender: data.gender,
        activity_level: data.activity,
        daily_time_commitment: data.time,
        diet_quality: data.diet,
        previous_attempts: data.previousAttempts,
        metabolism_type: data.metabolism,
        diet_attempts_count: data.dietAttempts,
        diet_results: data.dietResults,
        yoyo_effect: data.yoyoEffect,
        habits: data.habits
      };

      console.log('Submitting data to Supabase:', payload);

      // First, try to find any existing leads with this fingerprint
      const { data: existingLeads, error: selectError } = await supabase
        .from('leads')
        .select('id')
        .eq('fingerprint', fingerprint);

      if (selectError) {
        console.error('Error checking for existing leads:', selectError);
        throw selectError;
      }

      let result;
      // If we found any existing leads, update the first one
      if (existingLeads && existingLeads.length > 0) {
        console.log('Updating existing lead:', existingLeads[0].id);
        result = await supabase
          .from('leads')
          .update(payload)
          .eq('id', existingLeads[0].id)
          .select()
          .single();
      } else {
        // If no existing leads found, create a new one
        console.log('Inserting new lead');
        result = await supabase
          .from('leads')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      console.log('Operation successful:', result);
    } catch (error) {
      console.error('Error submitting to Supabase:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTimeframe = (weightDiff: number) => {
    // Usando a proporção: 10kg -> 21 dias
    const days = Math.ceil((Math.abs(weightDiff) * 21) / 10);
    return {
      days: days,
      type: 'days',
      dailyLoss: weightDiff / days,
      message: `${days} dias`
    };
  };

  const calculateWeightLossPercentage = () => {
    const currentWeight = parseFloat(answers.weight || '0');
    const targetWeight = parseFloat(textInput);
    if (currentWeight && targetWeight) {
      const weightLoss = currentWeight - targetWeight;
      const percentage = (weightLoss / currentWeight) * 100;
      const timeframe = calculateTimeframe(weightLoss);
      const extraWeightLoss = weightLoss * 1.1;
      return {
        percentage: Math.abs(percentage),
        isReasonable: percentage > 0 && percentage <= 20,
        weightLoss,
        extraWeightLoss,
        timeframe
      };
    }
    return null;
  };

  const calculateBMI = () => {
    const weight = parseFloat(answers.weight || '0');
    const height = parseFloat(answers.height || '0');
    if (weight && height) {
      const bmi = weight / ((height / 100) * (height / 100));
      let category = '';
      let message = '';

      if (bmi < 18.5) {
        category = 'abaixo do peso';
        message = 'Você precisa de um plano personalizado para ganhar peso de forma saudável.';
      } else if (bmi < 25) {
        category = 'normal';
        message = 'Você está em ótima forma! Continue assim!';
      } else if (bmi < 30) {
        category = 'sobrepeso';
        message = 'Com nosso programa, você pode alcançar seu peso ideal!';
      } else {
        category = 'obesidade';
        message = 'Vamos trabalhar juntos para alcançar um peso mais saudável!';
      }

      return {
        value: bmi,
        category,
        message
      };
    }
    return null;
  };

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...answers, [questions[currentStep].id]: answer };
    setAnswers(newAnswers);
    
    // Rastrear resposta do quiz
    quizEvents.answer(questions[currentStep].id, answer);
    
    await submitToSupabase(newAnswers);
    
    if (currentStep === 0) {
      quizEvents.start(); // Rastrear início do quiz
      setCurrentStep(1);
      setTextInput('');
      setError('');
      return;
    }

    if (questions[currentStep].id === 'weight') {
      setShowBMIProfile(true);
      return;
    }

    if (questions[currentStep].id === 'targetWeight') {
      setShowCongratulations(true);
      return;
    }

    if (questions[currentStep].id === 'time') {
      setShowPersonalProfile(true);
      return;
    }

    if (currentStep === questions.length - 1) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowDiagnosis(true);
        quizEvents.complete(100); // Rastrear conclusão do quiz
      }, 3000);
    } else {
      setCurrentStep(prev => prev + 1);
      if (godMode && currentStep + 1 < questions.length) {
        const nextQuestion = questions[currentStep + 1];
        const defaultValue = defaultAnswers[nextQuestion.id];
        if (defaultValue) {
          setTextInput(defaultValue);
        }
      } else {
        setTextInput('');
      }
      setError('');
    }
  };

  const handleContinueFromBMI = () => {
    setShowBMIProfile(false);
    setCurrentStep(prev => prev + 1);
    setTextInput('');
    setError('');
  };

  const handleContinueFromCongratulations = () => {
    setShowCongratulations(false);
    setCurrentStep(prev => prev + 1);
    setTextInput('');
    setError('');
  };

  const handleContinueFromPersonalProfile = () => {
    setShowPersonalProfile(false);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowDiagnosis(true);
    }, 3000);
  };

  const handleShowSubscriptionForm = () => {
    setShowDiagnosis(false);
    setShowFullPageLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowFullPageLoading(false);
    setShowSubscriptionForm(true);
  };

  const handleSubmitSubscription = async (data: { email: string; whatsapp: string; fingerprint: string }) => {
    try {
      // Rastrear captura de lead
      quizEvents.leadCapture('email');
      quizEvents.leadCapture('whatsapp');

      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('fingerprint', data.fingerprint)
        .single();

      if (error) {
        console.error('Erro ao buscar lead:', error);
        throw new Error('Erro ao verificar seus dados. Por favor, tente novamente.');
      }

      // Limpa o número do WhatsApp
      const cleanedWhatsapp = cleanWhatsappNumber(data.whatsapp);

      // Enviar dados para o n8n
      await sendQuizToN8N({
        ...lead,
        email: data.email,
        whatsapp: cleanedWhatsapp
      });

      setAnswers({
        ...answers,
        email: data.email,
        whatsapp: cleanedWhatsapp,
        lead_name: lead.name,
        weight: String(lead.current_weight_kg),
        targetWeight: String(lead.target_weight_kg),
        gender: lead.gender
      });

      setShowSubscriptionForm(false);
      setShowSalesPage(true);
      
      // Rastrear conversão
      quizEvents.conversion('subscription_form_complete');
    } catch (error) {
      console.error('Erro ao processar submissão:', error);
      throw error;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setError('Este campo é obrigatório');
      return;
    }

    if (questions[currentStep].id === 'age') {
      const age = parseInt(textInput);
      if (isNaN(age) || age < 1 || age > 120) {
        setError('Por favor, digite uma idade válida');
        return;
      }
    }

    if (questions[currentStep].id === 'height') {
      const height = parseInt(textInput);
      if (isNaN(height) || height <= 0) {
        setError('Por favor, digite uma altura válida');
        return;
      }

      if (heightUnit === 'FT') {
        const heightInCm = Math.round(height * 30.48); // Convert ft to cm
        setTextInput(heightInCm.toString());
      }
    }

    if (questions[currentStep].id === 'weight' || questions[currentStep].id === 'targetWeight') {
      const weight = parseFloat(textInput);
      if (isNaN(weight) || weight < 30 || weight > 300) {
        setError('Por favor, digite um peso válido em kg (entre 30 e 300)');
        return;
      }
    }

    handleAnswer(textInput);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setTextInput(answers[questions[currentStep - 1].id] || '');
      setError('');
    }
  };

  // God Mode: Skip to sales page
  const handleSkipToSales = () => {
    setShowSalesPage(true);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;
  const bmiData = calculateBMI();
  const weightLossData = questions[currentStep].id === 'targetWeight' ? calculateWeightLossPercentage() : null;

  // Função para pegar emoji baseado na pergunta
  const getQuestionEmoji = (questionId: string) => {
    const emojis: Record<string, string> = {
      name: '👋',
      weightLossGoal: '🎯',
      age: '🎂',
      height: '📏',
      weight: '⚖️',
      targetWeight: '✨',
      gender: '👤',
      activity: '🏃‍♀️',
      time: '⏰',
      diet: '🥗',
      previousAttempts: '💪',
      metabolism: '🔄',
      dietAttempts: '📊',
      dietResults: '📈',
      yoyoEffect: '🎢',
      habits: '🌟'
    };
    return emojis[questionId] || '✨';
  };

  // Função para pegar emoji baseado na opção
  const getOptionEmoji = (questionId: string, option: string) => {
    const optionEmojis: Record<string, Record<string, string>> = {
      gender: {
        'Masculino': '👨',
        'Feminino': '👩'
      },
      activity: {
        'Sedentário': '🛋️',
        'Levemente ativo': '🚶',
        'Moderadamente ativo': '🏃',
        'Muito ativo': '💪',
        'Extremamente ativo': '🏋️'
      },
      time: {
        '30 minutos': '⏱️',
        '1 hora': '⏰',
        '2 horas': '��',
        'Mais de 2 horas': '⌚'
      },
      diet: {
        'Ruim': '😕',
        'Regular': '😐',
        'Boa': '🙂',
        'Excelente': '😊'
      },
      previousAttempts: {
        'Nunca tentei': '🆕',
        'Poucas vezes': '📊',
        'Várias vezes': '📈',
        'Muitas vezes': '📉'
      },
      metabolism: {
        'Lento': '🐌',
        'Normal': '👌',
        'Rápido': '🏃'
      },
      dietAttempts: {
        'Nenhuma': '0️⃣',
        '1-2 vezes': '1️⃣',
        '3-5 vezes': '3️⃣',
        'Mais de 5 vezes': '5️⃣'
      },
      dietResults: {
        'Nunca funcionou': '😔',
        'Funcionou pouco': '😕',
        'Funcionou temporariamente': '',
        'Funcionou bem': '😊'
      },
      yoyoEffect: {
        'Sim': '🎢',
        'Não': '📊',
        'Não sei': '🤔'
      },
      habits: {
        'Preciso melhorar muito': '😔',
        'Preciso melhorar um pouco': '🤔',
        'Estou no caminho certo': '👍',
        'Meus hábitos são bons': '🌟'
      }
    };

    return optionEmojis[questionId]?.[option] || '';
  };

  if (showSalesPage) {
    const currentWeight = parseFloat(answers.weight || '0');
    const targetWeight = parseFloat(answers.targetWeight || '0');
    const weightDiff = currentWeight - targetWeight;
    const timeframe = calculateTimeframe(weightDiff);
    const isWoman = answers.gender === 'Feminino';

    return (
      <SalesPage
        userName={answers.lead_name}
        weightLossGoal={weightDiff}
        timeframe={timeframe.message}
        isWoman={isWoman}
        currentWeight={currentWeight}
      />
    );
  }

  if (showFullPageLoading) {
    return <FullPageLoading userName={answers.lead_name} onComplete={handleLoadingComplete} />;
  }

  if (showSubscriptionForm) {
    return (
      <SubscriptionForm 
        userName={answers.lead_name} 
        onSubmit={handleSubmitSubscription}
        defaultEmail={answers.email}
        defaultWhatsapp={answers.whatsapp}
      />
    );
  }

  if (isAnalyzing) {
    return <LoadingScreen userName={answers.lead_name} />;
  }

  if (showDiagnosis) {
    return <DiagnosisReport answers={answers} onShowSubscriptionForm={handleShowSubscriptionForm} />;
  }

  if (showCongratulations) {
    return (
      <Congratulations 
        onContinue={handleContinueFromCongratulations} 
        userName={answers.lead_name}
        weightLossData={weightLossData}
      />
    );
  }

  if (showPersonalProfile) {
    const isWoman = answers.gender === 'Feminino';
    return (
      <PersonalProfile
        answers={answers}
        onContinue={handleContinueFromPersonalProfile}
        isWoman={isWoman}
      />
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <GTMProvider>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* God Mode Controls */}
        {godMode && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={handleSkipToSales}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 
                       transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <span>Skip to Sales</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="max-w-sm mx-auto px-6 py-12">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-12">
            <img 
              src="/img/logos/NutriZap.jpg" 
              alt="NutriZap Logo" 
              className="h-14 object-contain mb-8"
            />
            
            {/* Progress Bar */}
            <div className="w-full space-y-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center text-sm text-[#6B7280] font-medium tracking-wide">
                {currentStep + 1} de {questions.length}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-16 space-y-12">
            {showBMIProfile && bmiData ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-[#1F2937] text-center leading-tight">
                  {answers.lead_name}, vamos analisar seu IMC
                </h2>
                <BMIProfile 
                  bmi={bmiData.value} 
                  weight={parseFloat(answers.weight || '0')}
                  userName={answers.lead_name}
                  age={parseInt(answers.age || '0')}
                  heightInCm={parseFloat(answers.height || '0')}
                />
                <button
                  onClick={handleContinueFromBMI}
                  className="w-full bg-[#2563EB] text-white py-5 rounded-full hover:bg-[#1E40AF] 
                           transition-all duration-200 hover:scale-[1.02] font-semibold text-lg shadow-lg mt-8"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="space-y-10 animate-fadeIn">
                {/* Question Section */}
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-4xl animate-bounce">
                      {getQuestionEmoji(currentQuestion.id)}
                    </div>
                    <h2 className="text-3xl font-bold text-[#1F2937] leading-tight animate-slideIn">
                      {currentStep === 0 
                        ? 'Qual é seu objetivo de perda de peso?'
                        : currentStep > 1 
                          ? `${answers.lead_name}, ${currentQuestion.question.toLowerCase()}`
                          : currentQuestion.question}
                    </h2>
                  </div>
                  {currentQuestion.description && (
                    <p className="text-lg text-[#6B7280] leading-relaxed animate-fadeIn">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>

                {/* Input Section */}
                <div className="mt-10 space-y-8 animate-slideUp">
                  {currentQuestion.id === 'height' ? (
                    <div className="space-y-8">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => setHeightUnit('FT')}
                          className={`px-10 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                            heightUnit === 'FT' 
                              ? 'bg-[#2563EB] text-white shadow-lg scale-105' 
                              : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:scale-105'
                          }`}
                        >
                          FT
                        </button>
                        <button
                          onClick={() => setHeightUnit('CM')}
                          className={`px-10 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                            heightUnit === 'CM' 
                              ? 'bg-[#2563EB] text-white shadow-lg scale-105' 
                              : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:scale-105'
                          }`}
                        >
                          CM
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-center gap-4">
                          <div className="relative group">
                            <input
                              type="number"
                              value={textInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 999)) {
                                  setTextInput(value);
                                  setError('');
                                }
                              }}
                              className="w-48 text-8xl font-bold text-center text-[#1F2937] bg-transparent border-none focus:outline-none focus:ring-0 transition-all duration-300 group-hover:text-[#2563EB]"
                              placeholder="0"
                            />
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D1D5DB] rounded-full overflow-hidden">
                              <div className="h-full w-0 bg-[#2563EB] group-hover:w-full transition-all duration-500"></div>
                            </div>
                          </div>
                          <span className="text-2xl text-[#6B7280] font-medium">{heightUnit.toLowerCase()}</span>
                        </div>
                        <p className="text-sm text-[#6B7280] text-center font-medium">Ex: {heightUnit === 'CM' ? '176' : '5.8'}</p>
                      </div>
                      {error && (
                        <p className="text-[#DC2626] text-sm text-center mt-4 font-medium">{error}</p>
                      )}
                      <button
                        onClick={handleTextSubmit}
                        className="w-full bg-[#2563EB] text-white py-5 rounded-full hover:bg-[#1E40AF] 
                                  transition-all duration-300 hover:scale-[1.02] font-semibold text-lg shadow-lg
                                  focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20"
                      >
                        Continue
                      </button>
                    </div>
                  ) : currentQuestion.type === 'text' ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        {(currentQuestion.id === 'weight' || currentQuestion.id === 'targetWeight' || currentQuestion.id === 'age') ? (
                          <div className="flex items-baseline justify-center gap-4">
                            <div className="relative group">
                              <input
                                type="number"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="0"
                                className="w-48 text-8xl font-bold text-center text-[#1F2937] bg-transparent border-none focus:outline-none focus:ring-0 transition-all duration-300 group-hover:text-[#2563EB]"
                              />
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D1D5DB] rounded-full overflow-hidden">
                                <div className="h-full w-0 bg-[#2563EB] group-hover:w-full transition-all duration-500"></div>
                              </div>
                            </div>
                            <span className="text-2xl text-[#6B7280] font-medium">
                              {currentQuestion.id === 'age' ? 'anos' : 'kg'}
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={currentQuestion.placeholder}
                            className="w-full px-8 py-5 text-lg rounded-2xl border-2 border-[#E5E7EB] 
                                     focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/20 
                                     transition-all duration-300 text-center text-[#1F2937] font-medium
                                     hover:border-[#2563EB]/50"
                            enterKeyHint="send"
                          />
                        )}
                        {currentQuestion.id === 'name' && (
                          <p className="text-sm text-[#6B7280] text-center font-medium">Ex: Maria</p>
                        )}
                        {currentQuestion.id === 'age' && (
                          <p className="text-sm text-[#6B7280] text-center font-medium">Ex: 32</p>
                        )}
                        {currentQuestion.id === 'weight' && (
                          <p className="text-sm text-[#6B7280] text-center font-medium">Ex: 68.5</p>
                        )}
                        {currentQuestion.id === 'targetWeight' && (
                          <p className="text-sm text-[#6B7280] text-center font-medium">Ex: 60</p>
                        )}
                        {currentQuestion.id === 'email' && (
                          <p className="text-sm text-[#6B7280] text-center font-medium">Ex: maria@email.com</p>
                        )}
                        {currentQuestion.id === 'whatsapp' && (
                          <p className="text-sm text-[#6B7280] text-center font-medium">Ex: (11) 98765-4321</p>
                        )}
                      </div>
                      {error && (
                        <p className="text-[#DC2626] text-sm text-center font-medium">{error}</p>
                      )}
                      {weightLossData && (
                        <div className="mt-8 p-8 bg-gradient-to-br from-[#2563EB]/5 to-[#22C55E]/5 
                                      rounded-3xl border border-[#2563EB]/10 shadow-lg">
                          <div className="space-y-5">
                            <h3 className="text-2xl font-bold text-[#1F2937]">
                              {weightLossData.isReasonable ? 
                                '🎉 Parabéns pela sua meta!' : 
                                '💪 É isso! Excelente meta!'}
                            </h3>
                            <p className="text-lg text-[#1F2937] leading-relaxed">
                              {weightLossData.isReasonable ? (
                                <>
                                  Com nosso plano personalizado, você não só vai alcançar sua meta de {textInput}kg, 
                                  mas pode perder até {weightLossData.weightLoss.toFixed(1)}kg em {weightLossData.timeframe.message}! 
                                  E o melhor: você poderá comer o que gosta e ainda assim emagrecer.
                                </>
                              ) : (
                                <>
                                  Essa meta é ta perfeita! E totalmente alcançável com nosso plano personalizado individualizado! 
                                  Podemos te ajudar a perder até {weightLossData.weightLoss.toFixed(1)}kg em {weightLossData.timeframe.message}! 
                                  E sim, você poderá comer o que gosta e ainda assim emagrecer.
                                </>
                              )}
                            </p>
                            <p className="text-sm text-[#2563EB] font-semibold">
                              ✨ Seu sucesso é garantido com nosso método comprovado!
                            </p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleTextSubmit}
                        className="w-full bg-[#2563EB] text-white py-5 rounded-full hover:bg-[#1E40AF] 
                                 transition-all duration-300 hover:scale-[1.02] font-semibold text-lg shadow-lg
                                 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20"
                      >
                        Continue
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {currentQuestion.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(option)}
                          className="w-full text-left px-8 py-5 rounded-2xl border-2 border-[#E5E7EB] 
                                   hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-all duration-300 
                                   hover:scale-[1.02] flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getOptionEmoji(currentQuestion.id, option)}</span>
                            <span className="text-lg text-[#1F2937] font-medium group-hover:text-[#2563EB]">{option}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#2563EB] transition-transform duration-300 group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contador de pessoas */}
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 animate-fadeIn">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-[#2563EB]/10">
                    <p className="text-xs text-[#6B7280] flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]"></span>
                      </span>
                      <span className="font-medium">{fakeCounter.toLocaleString('pt-BR')}</span>
                      <span>pessoas respondendo</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GTMProvider>
  );
}

export default App;