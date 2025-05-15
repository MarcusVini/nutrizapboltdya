import React from 'react';
import { Activity, Brain, Heart, Scale, Target, ChevronRight, ArrowRight, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiagnosisReportProps {
  answers: Record<string, string>;
  onShowSubscriptionForm: () => void;
}

function DiagnosisReport({ answers, onShowSubscriptionForm }: DiagnosisReportProps) {
  const currentWeight = parseFloat(answers.weight || '0');
  const targetWeight = parseFloat(answers.targetWeight || '0');
  const weightDiff = currentWeight - targetWeight;
  const age = parseInt(answers.age || '0');
  const isWoman = answers.gender === 'Feminino';

  const calculateTimeframe = (weightDiff: number) => {
    // Using the proportion: 10kg -> 21 days
    const days = Math.ceil((Math.abs(weightDiff) * 21) / 10);
    return {
      days: days,
      type: 'days',
      dailyLoss: weightDiff / days,
      message: `${days} dias`
    };
  };

  const timeframe = calculateTimeframe(weightDiff);
  const now = new Date();

  const generateChartData = () => {
    const points = 4;
    const interval = timeframe.days / (points - 1);
    
    return Array.from({ length: points }, (_, i) => {
      const date = i === 0 ? now : addDays(now, interval * i);
      const weight = currentWeight - (timeframe.dailyLoss * interval * i);
      
      let dateLabel = 'Hoje';
      if (i > 0) {
        if (timeframe.type === 'days' || timeframe.type === 'weeks') {
          dateLabel = format(date, 'd MMM', { locale: ptBR });
        } else {
          dateLabel = format(date, 'MMM', { locale: ptBR });
        }
      }

      return {
        date: dateLabel,
        weight,
        color: i === 0 ? '#F44336' :
               i === points - 1 ? '#00C27C' :
               i === 1 ? '#FF974D' : '#FEC226'
      };
    });
  };

  const chartData = generateChartData();

  const getMetabolismAnalysis = () => {
    const isSlowMetabolism = answers.metabolism === 'Metabolismo lento';
    return isSlowMetabolism
      ? "Seu metabolismo lento está dificultando a queima de calorias, mas com um plano nutricional personalizado, podemos acelerar seu metabolismo naturalmente."
      : "Mesmo com um metabolismo normal, é crucial otimizar sua alimentação para maximizar seus resultados.";
  };

  const getActivityAnalysis = () => {
    const isSedentary = answers.activity === 'Sedentário';
    return isSedentary
      ? "Seu estilo de vida sedentário, combinado com hábitos alimentares inadequados, aumenta significativamente seus riscos de saúde."
      : "Seu nível de atividade física é bom, mas sem uma alimentação adequada, você não está maximizando seus resultados.";
  };

  const getWeightLossHistory = () => {
    const hasYoYoEffect = answers.yoyoEffect === 'Sim, frequentemente';
    return hasYoYoEffect
      ? "O efeito sanfona que você experimentou pode ter prejudicado seu metabolismo. Um plano nutricional personalizado pode ajudar a quebrar esse ciclo."
      : "Para evitar o efeito sanfona no futuro, é essencial seguir um plano nutricional cientificamente elaborado.";
  };

  const getSocialProof = () => {
    const weightLoss = Math.round(weightDiff);
    const city = "São Paulo";
    const similarClient = isWoman ? "Maria" : "João";
    
    return {
      name: similarClient,
      age,
      city,
      weightLoss,
      gender: isWoman ? "mulher" : "homem",
      timeframe: timeframe.message,
      occupation: isWoman ? "professora" : "professor",
    };
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isFirst = payload.date === 'Hoje';
    const isLast = payload.date === chartData[chartData.length - 1].date;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          stroke="white"
          strokeWidth={3}
          fill={payload.color}
        />
        {isFirst && (
          <g transform={`translate(${cx},${cy - 50})`}>
            <rect
              x={-45}
              y={-14}
              width={90}
              height={24}
              rx={12}
              fill="#F44336"
            />
            <text
              x={0}
              y={2}
              textAnchor="middle"
              fill="white"
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Inter'
              }}
            >
              Peso Atual
            </text>
            <path
              d="M0,0 L6,6 L-6,6 Z"
              fill="#F44336"
              transform="translate(0,4)"
            />
          </g>
        )}
        {isLast && (
          <g transform={`translate(${cx},${cy - 50})`}>
            <rect
              x={-30}
              y={-14}
              width={60}
              height={24}
              rx={12}
              fill="#00C27C"
            />
            <text
              x={0}
              y={2}
              textAnchor="middle"
              fill="white"
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Inter'
              }}
            >
              Meta
            </text>
            <path
              d="M0,0 L6,6 L-6,6 Z"
              fill="#00C27C"
              transform="translate(0,4)"
            />
          </g>
        )}
        <text
          x={cx}
          y={cy - (isFirst || isLast ? 70 : 16)}
          textAnchor="middle"
          fill={payload.color}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'Inter'
          }}
        >
          {`${Math.round(payload.weight)}kg`}
        </text>
      </g>
    );
  };

  const socialProof = getSocialProof();

  const getTimeframeMessage = () => {
    if (timeframe.type === 'days') {
      return `em apenas ${timeframe.message}`;
    } else if (timeframe.type === 'weeks') {
      return `em ${timeframe.message}`;
    } else {
      return `até ${format(addDays(now, timeframe.days), "d 'de' MMMM", { locale: ptBR })}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Jornada de Transformação de {answers.name}
            </h1>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <p className="text-sm text-blue-800 font-medium">
                  Aprovado por<br/>95% dos usuários
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Garantia Tripla de Resultado</h3>
                  <p className="text-sm text-green-700">
                    Compromisso total com sua transformação
                  </p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Perda de peso garantida ou dinheiro de volta
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Suporte nutricional 7 dias por semana
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Acompanhamento personalizado contínuo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-lg text-blue-600 font-medium text-center mb-4">
            {answers.name}, analisamos suas respostas e identificamos os pontos críticos que estão impedindo sua perda de peso.
          </p>
          <p className="text-base text-gray-600 text-center mb-8">
            Com base nos seus dados, criamos um plano personalizado que vai transformar seu metabolismo e garantir resultados duradouros.
          </p>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3 text-center">
              Sua Jornada de Transformação
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Acompanhe sua evolução projetada com nosso plano personalizado
            </p>

            <div className="h-[250px] bg-white rounded-xl shadow-inner p-4 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 100, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F44336" />
                      <stop offset="33%" stopColor="#FF974D" />
                      <stop offset="66%" stopColor="#FEC226" />
                      <stop offset="100%" stopColor="#00C27C" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    horizontal={false}
                    vertical={true}
                    strokeDasharray="1 6"
                    stroke="#F0EEEC"
                    strokeWidth={2}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#999999', fontSize: 17, fontWeight: 'bold', fontFamily: 'Inter' }}
                    dy={12}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="url(#weightGradient)"
                    strokeWidth={3}
                    dot={<CustomDot />}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xl text-center text-gray-800 font-medium">
              Com base nas suas respostas, {answers.name}, {age} anos, prevemos que você chegará aos{' '}
              <span className="text-green-600 font-bold">{targetWeight}kg</span> {getTimeframeMessage()}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-800">
                  Histórias de Transformação Real
                </h3>
                <p className="text-sm text-blue-600">
                  Pessoas reais, resultados comprovados
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600">
                      {socialProof.name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {socialProof.name}, {socialProof.age} anos
                      </h4>
                      <p className="text-sm text-gray-600">
                        {socialProof.occupation} • {socialProof.city}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                        <span className="text-green-600 text-sm font-medium">
                          -{socialProof.weightLoss}kg
                        </span>
                        <span className="text-green-500 text-xs">
                          em {socialProof.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>
                  <blockquote className="mt-4 text-gray-600 text-sm italic">
                    "O programa mudou completamente minha relação com a comida. Perdi peso de forma saudável e, o melhor, consegui manter! A equipe de nutricionistas é incrível e sempre presente."
                  </blockquote>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3">Resultados Comprovados</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">97%</div>
                      <div className="text-sm text-gray-600">dos usuários atingiram a meta</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">185mil+</div>
                      <div className="text-sm text-gray-600">vidas transformadas</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3">Benefícios Relatados</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-500">✓</span>
                      <span>Mais disposição e energia no dia a dia</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-500">✓</span>
                      <span>Melhora significativa no sono</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-500">✓</span>
                      <span>Redução de medidas em áreas específicas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-500">✓</span>
                      <span>Aumento da autoestima e bem-estar</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Assim como {socialProof.name}</span>, você também pode 
                    transformar sua vida com nosso programa personalizado. Comece sua jornada hoje e junte-se 
                    a milhares de pessoas que já conquistaram seus objetivos!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 mb-12">
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Análise Metabólica Detalhada
                </h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {getMetabolismAnalysis()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <h4 className="font-medium text-orange-800 mb-2">Situação Atual</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Metabolismo desacelerado em até 45%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Dificuldade na queima de gordura localizada</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Acúmulo de toxinas prejudicando funções vitais</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h4 className="font-medium text-green-800 mb-2">Com Nosso Programa</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Aceleração metabólica em até 85%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Queima de gordura 24h por dia</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Desintoxicação natural do organismo</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Perfil de Atividade
                </h3>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {getActivityAnalysis()}
              </p>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <span>
                    <strong>Risco:</strong> A combinação de maus hábitos alimentares com seu nível de atividade 
                    atual pode acelerar o ganho de peso e problemas de saúde.
                  </span>
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Histórico e Projeção de Peso
                </h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {getWeightLossHistory()}
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <h4 className="font-medium text-blue-800 mb-3">Sua Nova Jornada</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Peso Inicial</div>
                      <div className="text-lg font-semibold text-blue-700">{currentWeight} kg</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Meta</div>
                      <div className="text-lg font-semibold text-green-600">{targetWeight} kg</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Tempo Estimado</div>
                      <div className="text-lg font-semibold text-purple-600">{timeframe.message}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-blue-700">
                    Com nosso programa, sua perda de peso será saudável e duradoura, sem efeito sanfona.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <ArrowRight className="w-6 h-6" />
                {answers.name}, sua transformação começa hoje!
              </h2>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                    <span>Plano 100% personalizado para seu perfil</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                    <span>Cardápios adaptados ao seu estilo de vida</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                    <span>Suporte nutricional ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                    <span>Garantia de resultado ou seu dinheiro de volta</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onShowSubscriptionForm}
                className="w-full bg-white text-blue-600 py-4 rounded-xl font-semibold 
                         hover:bg-blue-50 transition-all duration-200 flex items-center 
                         justify-center gap-2 text-lg transform hover:scale-[1.02]"
              >
                <span>Quero Começar Minha Transformação Agora</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-sm text-center mt-4 text-white/80">
                Comece hoje mesmo e garanta sua vaga com condição especial
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiagnosisReport;