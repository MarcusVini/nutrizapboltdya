import React from 'react';
import { User, Target, Clock, LineChart, Activity, Scale, Brain, Heart, Coffee, History, AlertCircle } from 'lucide-react';
import { QuizQuestion } from './types';

export const questions: QuizQuestion[] = [
  {
    id: 'weightLossGoal',
    question: 'Qual é seu objetivo de perda de peso?',
    options: [
      'Perder 1-10 kg definitivamente',
      'Perder 11-20 kg definitivamente',
      'Perder mais de 20 kg definitivamente',
      'Manter o peso e ficar em forma',
      'Ainda não decidi'
    ],
    icon: <Target className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'lead_name',
    question: 'Qual é o seu nome?',
    type: 'text',
    placeholder: 'Digite seu primeiro nome',
    icon: <User className="w-6 h-6 text-blue-500" />
  },
  {
    id: 'age',
    question: 'Qual é a sua idade?',
    type: 'text',
    placeholder: 'Digite sua idade',
    icon: <Clock className="w-6 h-6 text-blue-500" />
  },
  {
    id: 'height',
    question: 'Qual é a sua altura?',
    type: 'text',
    placeholder: 'Digite sua altura em cm (exemplo: 170)',
    icon: <LineChart className="w-6 h-6 text-blue-500" />
  },
  {
    id: 'weight',
    question: 'Qual é o seu peso atual (kg)?',
    type: 'text',
    placeholder: 'Digite seu peso em kg',
    icon: <Scale className="w-6 h-6 text-blue-500" />
  },
  {
    id: 'targetWeight',
    question: 'Qual é o seu peso desejado (kg)?',
    type: 'text',
    placeholder: 'Digite seu peso desejado em kg',
    icon: <Target className="w-6 h-6 text-blue-500" />
  },
  {
    id: 'gender',
    question: 'Com qual gênero você se identifica?',
    options: ['Feminino', 'Masculino'],
    icon: <User className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'activity',
    question: 'Como é sua rotina de atividades físicas?',
    options: ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Atleta'],
    icon: <Activity className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'time',
    question: 'Quanto tempo você consegue dedicar por dia?',
    options: ['30 minutos', '1 hora', '1-2 horas', 'Mais de 2 horas'],
    icon: <Clock className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'diet',
    question: 'Como você avalia sua alimentação?',
    options: ['Muito ruim', 'Regular', 'Boa', 'Excelente'],
    icon: <Coffee className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'previousAttempts',
    question: 'Você já tentou emagrecer antes?',
    options: ['Nunca tentei', '1-2 vezes', '3-5 vezes', 'Mais de 5 vezes'],
    icon: <History className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'metabolism',
    question: 'Como o seu corpo funciona?',
    options: ['Metabolismo lento', 'Metabolismo normal', 'Metabolismo acelerado'],
    icon: <Brain className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'dietAttempts',
    question: 'Quantas vezes você já tentou fazer uma dieta nova?',
    options: ['Nunca tentei', '1-2 vezes', '3-5 vezes', 'Mais de 5 vezes'],
    icon: <History className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'dietResults',
    question: 'Alguma dieta te trouxe resultados?',
    options: ['Sim, resultados duradouros', 'Sim, mas não mantive', 'Não obtive resultados'],
    icon: <Target className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'yoyoEffect',
    question: 'Você já sofreu com o "efeito Sanfona"?',
    options: ['Sim, frequentemente', 'Sim, algumas vezes', 'Não'],
    icon: <AlertCircle className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'habits',
    question: 'Você tem algum dos seguintes hábitos?',
    options: ['Fumo', 'Consumo álcool regularmente', 'Sono irregular', 'Sedentarismo', 'Nenhum dos anteriores'],
    icon: <Heart className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  },
  {
    id: 'dietTime',
    question: 'Quanto tempo do seu dia você pode dedicar para cuidar da sua alimentação?',
    options: ['30 minutos', '1 hora', '1-2 horas', 'Mais de 2 horas'],
    icon: <Clock className="w-6 h-6 text-blue-500" />,
    type: 'choice'
  }
];