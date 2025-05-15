import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mail, Phone, ArrowRight, Shield, CheckCircle2, ArrowUpRight, Star, Check, Timer, Play, Flame, Heart, Brain, Activity, MapPin, Target, Clipboard, Calendar, Book, ChefHat, ShoppingCart, MessageCircle, Wallet, Dna, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { redirectToCheckout } from '../lib/stripe';
import type { ProductId } from '../stripe-config';
import { getLocationFromIP } from '../lib/geolocation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  ChartArea,
  ScriptableContext,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { Plugin } from 'chart.js';
import { LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Line as RechartsLine, Tooltip } from 'recharts';
import { generateWeightLossData } from '../utils/weightCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  ChartDataLabels
);

interface SalesPageProps {
  userName: string;
  weightLossGoal: number;
  timeframe: string;
  isWoman: boolean;
  currentWeight: number;
  age: number;
}

interface Timer {
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
}

const useTimer = () => {
  const [timer, setTimer] = useState<Timer>({
    hours: '00',
    minutes: '06',
    seconds: '00',
    milliseconds: '00'
  });

  useEffect(() => {
    // Set end time to 6 minutes from now if not already set in localStorage
    const savedEndTime = localStorage.getItem('timerEndTime');
    const endTime = savedEndTime ? new Date(parseInt(savedEndTime)) : new Date(Date.now() + 6 * 60 * 1000);
    
    // Save end time to localStorage if not already saved
    if (!savedEndTime) {
      localStorage.setItem('timerEndTime', endTime.getTime().toString());
    }

    const updateTimer = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        // Reset timer when it reaches zero
        const newEndTime = new Date(Date.now() + 6 * 60 * 1000);
        localStorage.setItem('timerEndTime', newEndTime.getTime().toString());
        setTimer({
          hours: '00',
          minutes: '06',
          seconds: '00',
          milliseconds: '00'
        });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      const milliseconds = Math.floor((difference % 1000) / 100) * 10;

      setTimer({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        milliseconds: milliseconds.toString().padStart(2, '0')
      });
    };

    // Update immediately
    updateTimer();

    // Update every second for the main timer
    const secondInterval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(secondInterval);
    };
  }, []); // Empty dependency array since we don't want to recreate the effect

  return timer;
};

const useNotifications = (location: { city: string }) => {
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  const names = [
    'Ana', 'João', 'Maria', 'Pedro', 'Lucas', 'Julia', 'Carlos', 'Mariana',
    'Rafael', 'Beatriz', 'Gabriel', 'Isabella', 'Thiago', 'Laura', 'Felipe',
    'Larissa', 'Bruno', 'Camila', 'Daniel', 'Amanda', 'Rodrigo', 'Carolina',
    'Marcelo', 'Patrícia', 'Gustavo', 'Vanessa', 'Eduardo', 'Fernanda',
    'André', 'Natália', 'Ricardo', 'Tatiane', 'Leonardo', 'Priscila',
    'Alexandre', 'Bianca', 'Vinicius', 'Raquel', 'Diego', 'Cristina'
  ];

  const generateNotification = useCallback(() => {
    const name = names[Math.floor(Math.random() * names.length)];
    const plan = Math.random() > 0.5 ? 'anual' : 'mensal';
    const newNotification = {
      id: notificationId,
      text: `${name} de ${location.city}, acabou de comprar o plano ${plan}!`
    };
    
    setNotifications(prev => [...prev, newNotification]);
    setNotificationId(prev => prev + 1);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, [location.city, notificationId]);

  useEffect(() => {
    const interval = setInterval(generateNotification, 6000);
    return () => clearInterval(interval);
  }, [generateNotification]);

  return notifications;
};

// Adicionar hook para o timer do cupom
const useCouponTimer = (initialSeconds: number) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const SalesPage: React.FC<SalesPageProps> = ({ userName, weightLossGoal, timeframe, isWoman, currentWeight, age }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'quarterly'>('annual');
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState({ city: '', region: '' });
  const [recentBuyers, setRecentBuyers] = useState(0);
  const [totalBuyers, setTotalBuyers] = useState(Math.floor(Math.random() * 20) + 5);
  const [remainingSpots, setRemainingSpots] = useState(16);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuarterlySoldOut, setShowQuarterlySoldOut] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  const timer = useTimer();
  const notifications = useNotifications(location);
  // Timer do cupom de desconto (3 minutos e 32 segundos = 212 segundos)
  const couponTimer = useCouponTimer(212);

  interface Transformation {
    name: string;
    weightLoss: string;
    image: string;
    time: string;
  }

  const transformations: Transformation[] = [
    {
      name: 'Juliana Costa',
      weightLoss: '23kg',
      image: '/img/alunas/lg-srkf7-5.png',
      time: '75 dias'
    },
    {
      name: 'Ana Paula',
      weightLoss: '35kg',
      image: '/img/alunas/lg-esyud-12.png',
      time: '60 dias'
    },
    {
      name: 'Maria Silva',
      weightLoss: '26kg',
      image: '/img/alunas/lg-mucr3-7.png',
      time: '90 dias'
    },
    {
      name: 'Carla',
      weightLoss: '25kg',
      image: '/img/alunas/lg-h2nxi-6.png',
      time: '75 dias'
    },
    {
      name: 'Julia',
      weightLoss: '26kg',
      image: '/img/alunas/lg-3m4i7-1.png',
      time: '60 dias'
    },
    {
      name: 'Larissa',
      weightLoss: '10,9kg',
      image: '/img/alunas/lg-b08rj-2.png',
      time: '90 dias'
    },
    {
      name: 'Mariana',
      weightLoss: '28kg',
      image: '/img/alunas/lg-2s09k-13.png',
      time: '60 dias'
    },
    {
      name: 'Beatriz',
      weightLoss: '20kg',
      image: '/img/alunas/lg-l2hir-11.png',
      time: '90 dias'
    }
  ];

  const testimonials = [
    {
      name: "Ana Carolina",
      age: 34,
      city: "São Paulo",
      message: "Sério, Dr. Ricardo, eu só tenho a te agradecer!! 🙏 Eu me sentia um lixo 😔, nem me olhava no espelho. Meu marido já nem me procurava mais... nossa relação virou amizade. Depois que comecei o plano (que é MUITO fácil de seguir, gente, sério kkk), já nos primeiros 15 dias perdi peso e ele começou a me olhar diferente. Hoje, 12kg a menos, autoestima lá em cima, me amando de novo 😍!! Voltei a ser mulher, sabe? Haha... Obrigada de coração, mudou minha vida!! ❤️",
      image: "/img/depo/1.jpg"
    },
    {
      name: "Paula Santos",
      age: 29,
      city: "Rio de Janeiro",
      message: "Antes de conhecer o plano do Dr. Ricardo, eu era escrava da compulsão 😩. Chorava escondida depois de comer. Hoje? Eliminei 10kg em 40 dias e o plano foi ESSENCIAL 🥹. A forma que ele organiza as refeições, os ajustes semanais... tudo fez diferença! 🙌 Recuperei minha energia, minha alegria, minha relação com meu noivo melhorou DEMAIS! rs Ele até me pediu em casamento depois da mudança hahaha 💍 Gratidão eterna!!!",
      image: "/img/depo/2.jpg"
    },
    {
      name: "Juliana Mendes",
      age: 36,
      city: "Salvador",
      message: "Gente, eu quase desisti de mim. Juro. 🥲 Eu me escondia até na praia de camiseta. Vergonha TOTAL do meu corpo. Mas o método do Dr. Ricardo me deu esperança. Cada cardápio, cada dica no app, era como ter alguém segurando minha mão 🥹. Em 60 dias perdi 17kg!! Hoje me olho no espelho e penso: QUE MULHER!! kkkkk Me amo, me respeito, e meu marido agora não tira mais a mão de mim 😏🔥.",
      image: "/img/depo/3.jpg"
    },
    {
      name: "Vanessa Oliveira",
      age: 32,
      city: "Curitiba",
      message: "Era dieta segunda, fossa na quarta 😂 kkk. Nunca dava certo! Quando recebi meu plano personalizado, chorei de emoção 😭. Era tudo feito pra mim!! Respeitava minha rotina, meus gostos... enfim, consegui seguir. Já são 13kg eliminados e o principal: ganhei de volta meu amor próprio que tava enterrado!!! Obrigada, Dr. Ricardo, você é um anjo na minha vida 🙏❤️.",
      image: "/img/depo/4.jpg"
    },
    {
      name: "Mariana Rocha",
      age: 28,
      city: "Recife",
      message: "Sério, antes eu me achava incapaz 😔. Só de pensar em emagrecer já me batia tristeza. Mas o plano que recebi foi tão simples, tão leve... que parecia até brincadeira haha 😂. Em 50 dias mandei embora 11kg. Mas o melhor foi ver a minha confiança RENASCER!! Hoje eu me amo como nunca me amei antes. E até me sinto desejada de novo rs 😜 Obrigada, Dr. Ricardo!",
      image: "/img/depo/5.jpg"
    },
    {
      name: "Priscila Ferreira",
      age: 40,
      city: "Campinas",
      message: "Dr. Ricardo, você não tem ideia do que fez por mim 😭❤️. Eu era aquela mulher que chorava de vergonha do próprio corpo, evitava sair, fotos então? Nem pensar!! Depois que comecei o plano, tudo mudou. Em 3 meses, perdi 19kg! Receber um plano feito pra mim, sem neuras, sem terrorismo... me fez entender que eu mereço ser feliz, linda e confiante 😍 Agora tô até namorando de novo rs! Haha.",
      image: "/img/depo/6.jpg"
    },
    {
      name: "Camila Costa",
      age: 33,
      city: "Porto Alegre",
      message: "Eu já tinha desistido kkkk sério 😂. Tentei tanta coisa que não funcionava... achava que era defeito meu. Aí recebi o plano do Dr. Ricardo e foi diferente! TUDO personalizado, ajustado, fácil de seguir 🙌. Hoje com 14kg a menos, minhas roupas cabem, meu sorriso voltou e eu me sinto VIVA!! Quem tá lendo isso, acredite: você também pode! Se ame!! ❤️",
      image: "/img/depo/7.jpg"
    },
    {
      name: "Renata Lima",
      age: 30,
      city: "Brasília",
      message: "A pior parte era acordar e me sentir derrotada sem nem levantar da cama 😞. Conhecer o plano mudou tudo!!! Cada orientação parecia feita com carinho, sério 🥰. Em 40 dias perdi 9kg e ganhei minha vontade de viver de novo. Agora acordo sorrindo haha 🤭 e meu marido não para de me elogiar kkkk. Obrigada, Dr. Ricardo, vc me deu uma nova chance!",
      image: "/img/depo/8.jpg"
    },
    {
      name: "Fernanda Souza",
      age: 35,
      city: "Belém",
      message: "A vida sem autoestima é cinza, né? 😔 Eu não me via mais, não tinha interesse em nada. Aí, Deus colocou o Dr. Ricardo no meu caminho 🙏 Recebi o plano e decidi tentar uma última vez... E ainda bem que tentei! Emagreci 15kg, recuperei meu brilho, minha vontade de cuidar de mim 🥰. Hoje eu vivo, eu brilho, eu me amo de novo ❤️ (e meu marido tbm kkkk).",
      image: "/img/depo/9.jpg"
    },
    {
      name: "Débora Andrade",
      age: 27,
      city: "Fortaleza",
      message: "Eu era a rainha do efeito sanfona 😂 Emagrecia, engordava o dobro. Até conhecer o método do Dr. Ricardo. Quando recebi meu plano (com cada refeição pensada PRA MIM 🥹), vi que era diferente. Resultado? -12kg, uma nova mulher na frente do espelho e lágrimas de felicidade 😭 Hoje eu respiro alívio, orgulho e amor próprio. Obrigada por me dar a oportunidade de me amar de novo! ❤️",
      image: "/img/depo/10.jpg"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadLocation = async () => {
      const locationData = await getLocationFromIP();
      setLocation({
        city: locationData.city,
        region: locationData.region
      });
      // Gerar um número aleatório entre 3 e 12 para simular compradores recentes
      setRecentBuyers(Math.floor(Math.random() * 10) + 3);
    };

    loadLocation();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCTA(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    if (pricingRef.current) {
      observer.observe(pricingRef.current);
    }

    return () => {
      if (pricingRef.current) {
        observer.unobserve(pricingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % transformations.length);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(timer);
  }, []);

  // Adicionar novo useEffect para incrementar compradores
  useEffect(() => {
    const incrementInterval = setInterval(() => {
      // 30% de chance de incrementar a cada 3 segundos
      if (Math.random() < 0.3) {
        setTotalBuyers(prev => prev + 1);
      }
    }, 3000); // Checar a cada 3 segundos

    return () => clearInterval(incrementInterval);
  }, []);

  // Adicionar novo useEffect para diminuir vagas
  useEffect(() => {
    const decrementInterval = setInterval(() => {
      // 20% de chance de diminuir a cada 3 segundos
      if (Math.random() < 0.2) {
        setRemainingSpots(prev => Math.max(1, prev - 1)); // Não deixa ficar menor que 1 vaga
      }
    }, 3000);

    return () => clearInterval(decrementInterval);
  }, []);

  // Adicionar useEffect para lidar com warnings de cookies
  useEffect(() => {
    // Remover warnings de cookies de terceiros
    const consoleError = console.error;
    console.error = (...args: any[]) => {
      if (args[0]?.includes?.('third-party cookies')) return;
      consoleError.apply(console, args);
    };

    return () => {
      console.error = consoleError;
    };
  }, []);

  const handleSubscribe = () => {
    if (selectedPlan === 'monthly') {
      window.open('https://nutrizap.chat/promocao-2/', '_blank');
    } else if (selectedPlan === 'annual') {
      window.open('https://nutrizap.chat/promocao/', '_blank');
    } else {
      window.open('https://nutrizap.chat/promocao/', '_blank');
    }
  };

  const getWeightLossPromise = () => {
    if (weightLossGoal <= 5) {
      const days = Math.ceil((weightLossGoal / 10) * 21);
      return `Perca ${weightLossGoal}kg em ${days} dias ou seu dinheiro de volta!`;
    } 
    else if (weightLossGoal <= 10) {
      return `Perca ${weightLossGoal}kg em 21 dias ou seu dinheiro de volta!`;
    }
    else if (weightLossGoal <= 15) {
      return `Perca ${weightLossGoal}kg em 8 semanas ou seu dinheiro de volta!`;
    }
    return `Perca 15kg em 12 semanas ou seu dinheiro de volta!`;
  };

  const generateWeightData = () => {
    const targetWeight = currentWeight - weightLossGoal;
    const firstMilestone = Math.round(currentWeight - (weightLossGoal * 0.33));
    const secondMilestone = Math.round(currentWeight - (weightLossGoal * 0.66));
    
    return [
      { month: 'Now', weight: currentWeight, color: '#FF4444' },
      { month: 'May', weight: firstMilestone, color: '#FFA500' },
      { month: 'Jun', weight: secondMilestone, color: '#FFD700' },
      { month: 'Jul', weight: targetWeight, color: '#10B981' }
    ];
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isLast = payload.month === 'Jul';

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={payload.color}
          stroke="white"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy - 15}
          textAnchor="middle"
          fill={payload.color}
          style={{
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {`${payload.weight} kg`}
        </text>
        {isLast && (
          <g transform={`translate(${cx + 15},${cy - 12})`}>
            <rect
              width={45}
              height={24}
              rx={4}
              fill="#10B981"
            />
            <text
              x={22}
              y={16}
              textAnchor="middle"
              fill="white"
              style={{
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Goal
            </text>
          </g>
        )}
      </g>
    );
  };

  const weightData = generateWeightData();

  const weightLossData = {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6', 'Semana 7', 'Semana 8'],
    datasets: [
      {
        label: 'Peso (kg)',
        data: Array.from({ length: 8 }, (_, i) => {
          const weeklyLoss = (weightLossGoal / 21) * 7;
          return Number((currentWeight - (weeklyLoss * i)).toFixed(1));
        }),
        fill: true,
        backgroundColor: function(context: ScriptableContext<'line'>) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.4)');
          return gradient;
        },
        borderColor: '#10B981',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        borderWidth: 3
      }
    ]
  };

  type ChartOptionsWithPlugins = ChartOptions<'line'> & {
    plugins?: {
      legend?: {
        display?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
        labels?: {
          font?: {
            size?: number;
            weight?: string;
          };
        };
      };
      datalabels?: {
        align?: (context: any) => 'start' | 'end' | 'top' | 'bottom';
        anchor?: (context: any) => 'start' | 'end' | 'top' | 'bottom';
        offset?: number;
        color?: string;
        font?: {
          size?: number;
          weight?: string;
        };
        formatter?: (value: number) => string;
      };
    };
  };

  const chartOptions: ChartOptionsWithPlugins = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} kg`;
          }
        }
      },
      datalabels: {
        align: function(context: any) {
          return 'top';
        },
        anchor: function(context: any) {
          return 'end';
        },
        offset: 8,
        color: '#4B5563',
        font: {
          size: 14,
          weight: 'bold'
        },
        formatter: function(value: number) {
          return value.toFixed(1) + ' kg';
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#4B5563'
        }
      },
      y: {
        display: true,
        grid: {
          color: '#E5E7EB'
        },
        min: currentWeight - weightLossGoal - 1, // Target weight - 1kg buffer
        max: currentWeight + 1, // Starting weight + 1kg buffer
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#4B5563',
          padding: 8
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 6,
        hoverRadius: 8
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const generateProgressChartData = () => {
    const targetWeight = currentWeight - weightLossGoal;
    const days = Math.ceil((weightLossGoal * 21) / 10);
    
    return generateWeightLossData(currentWeight, targetWeight, days, 4);
  };

  const progressChartData = generateProgressChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 relative" role="main">
      {/* SEÇÃO 1: NOTIFICAÇÕES DE COMPRAS EM TEMPO REAL */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg rounded-xl px-4 py-3 mb-2 transform translate-y-[-100%] animate-slide-in w-[300px]"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1.5 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-tight">
                  {notification.text}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-white/70">agora mesmo</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SEÇÃO 2: CTA FLUTUANTE (CALL TO ACTION) */}
      {showStickyCTA && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4 z-50 transition-all duration-300 transform translate-y-0"
          role="complementary"
          aria-label="Call to action"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{recentBuyers} pessoas em {location.city} já começaram sua transformação hoje!</span>
            </div>
            <button 
              onClick={handleSubscribe}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl 
                     font-semibold transition-all duration-200 flex items-center gap-2">
              <span>Comece agora por R$ 9,90/mês</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* SEÇÃO 3: HEADER PRINCIPAL COM PROMESSA DE RESULTADO */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 mb-16 text-white relative overflow-hidden">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {userName}, você tem tudo para eliminar {weightLossGoal}kg até {format(addDays(new Date(), Math.ceil((weightLossGoal / 10) * 21)), 'd MMM', { locale: ptBR })} – sem dietas malucas ou sofrimento.
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Seu objetivo é ir de {currentWeight}kg para {currentWeight - weightLossGoal}kg, e nós criamos o plano perfeito para isso, baseado no seu metabolismo e na sua realidade.
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-300" />
                  <p className="text-lg font-medium">
                    Plano feito para você. Resultados visíveis em {Math.ceil(weightLossGoal * 0.1)} dias.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-lg">
                    Plano 100% personalizado para seu metabolismo
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-lg">
                    Resultados visíveis na primeira semana
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* SEÇÃO: RESUMO DO LEAD E CLASSIFICAÇÃO DE RISCO */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 mb-16 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Coluna de Informações do Lead */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100">
              <h3 className="text-xl font-bold text-blue-800 mb-4">📋 Resumo do Perfil - {userName}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                  <span className="text-gray-600">Objetivo</span>
                  <span className="font-medium">{currentWeight}kg → {currentWeight - weightLossGoal}kg</span>
                </div>
                <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                  <span className="text-gray-600">Meta de Perda</span>
                  <span className="font-medium">{weightLossGoal}kg</span>
                </div>
                <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                  <span className="text-gray-600">Tempo Estimado</span>
                  <span className="font-medium">{Math.ceil(weightLossGoal * 0.1 * 30)} dias</span>
                </div>
                <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                  <span className="text-gray-600">Metabolismo</span>
                  <span className="font-medium text-red-600 flex items-center gap-2">
                    <span>⚠️ ALERTA</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna de Classificação de Risco */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100">
              <h3 className="text-xl font-bold text-blue-800 mb-4">🎯 Análise de Viabilidade</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Chance de Sucesso</span>
                    <span className="text-sm text-green-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Complexidade do Caso</span>
                    <span className="text-sm text-blue-600">Moderada</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✨ Perfil ideal para nosso programa personalizado. Alta probabilidade de atingir a meta com acompanhamento adequado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* FIM SEÇÃO: TUDO QUE VOCÊ VAI RECEBER */}

        {/* SEÇÃO: ERROS COMUNS EM DIETAS ANTERIORES */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 mb-16 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🚫 ERROS COMUNS EM DIETAS ANTERIORES
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Erros Frequentes</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>🍽️ Comer menos = metabolismo travado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>📱 Dietas da moda = sabotagem metabólica</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>🔄 Restrição extrema = compulsão e sanfona</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>⏰ Sem ajustes = estagnação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>💪 Só treino = corpo resistente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>⚡ Resultados rápidos = recuperação rápida</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>🧠 Força de vontade = desistência</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>😔 Saúde emocional negligenciada = sabotagem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>💊 Suplementos sozinhos = dinheiro perdido</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Que Falharam</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>🎯 Genéricas: não personalizadas para você</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>🔄 Estáticas: sem adaptação ao seu corpo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>⚠️ Restritivas: ativam defesas do corpo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>🧠 Superficiais: ignoram saúde mental</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>✨ Ilusórias: promessas irreais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>📅 Incompatíveis: não se encaixam na sua rotina</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>⚖️ Forçadas: não respeitam seu ritmo natural</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* FIM SEÇÃO: ERROS COMUNS EM DIETAS ANTERIORES */}

        {/* SEÇÃO 4: GALERIA DE TRANSFORMAÇÕES */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 overflow-hidden">
          <h2 className="text-3xl font-bold text-center mb-12">
            Transformações Reais das Nossas Alunas
          </h2>

          <div className="relative max-w-2xl mx-auto">
            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {transformations.map((transformation, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        src={transformation.image}
                        alt={`Transformação ${transformation.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-8 text-center">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {transformation.name} de {location.city}
                      </h3>
                      <p className="text-lg text-gray-600 mt-2">
                        Perdeu <span className="text-green-500 font-bold">{transformation.weightLoss}</span> em {transformation.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões de navegação */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + transformations.length) % transformations.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all"
              aria-label="Slide anterior"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % transformations.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all"
              aria-label="Próximo slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Indicadores */}
            <div className="flex justify-center gap-3 mt-8">
              {transformations.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentSlide === index
                      ? 'bg-blue-600 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        {/* SEÇÃO 4: GALERIA DE TRANSFORMAÇÕES */}

        {/* SEÇÃO 5: GRÁFICO DE PROGRESSO DE PESO */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-gray-500 text-lg mb-4">
              Com base em tudo que você respondeu até aqui...
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Você receberá o plano perfeito em suas mãos, feito por mim e pela minha equipe...
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Com ele você seria capaz de romper o efeito sanfona, emagrecer de uma vez por todas, acabar com a sensação de insegurança, frustração e tristeza que te domina hoje!
            </p>
          </div>
          <div className="text-center my-8 w-full max-w-4xl mx-auto">
            <figure className="mx-auto inline-block w-full">
              <svg width="100%" height="100%" viewBox="0 0 339 190" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M114 166V0M226 166V0M338 166V0M2 166V0" stroke="#F0EEEC" strokeWidth="2" strokeDasharray="1 6" />
                <path d="M13 40c35.154 0 59.761 6.498 81.44 19.492 29.294 17.561 53.472 31.488 79.681 45.483 63.277 33.786 150.575 29.888 162.879 29.888" stroke="url(#a)" strokeWidth="3" />
                <g filter="url(#b)">
                  <rect x="7" y="33" width="12" height="12" rx="6" fill="#F2556F" />
                  <rect x="5.5" y="31.5" width="15" height="15" rx="7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <g filter="url(#c)">
                  <rect x="288" y="121" width="28" height="28" rx="14" fill="#CAEEE1" />
                  <rect x="286.5" y="119.5" width="31" height="31" rx="15.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <g filter="url(#filter2_d_14_891)">
                  <rect x="108" y="64" width="12" height="12" rx="6" fill="#FF974D" />
                  <rect x="106.5" y="62.5" width="15" height="15" rx="7.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <g filter="url(#filter3_d_14_891)">
                  <rect x="220" y="117" width="12" height="12" rx="6" fill="#FEC226" />
                  <rect x="218.5" y="115.5" width="15" height="15" rx="7.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <rect x="296" y="129" width="12" height="12" rx="6" fill="#00C27C" />
                <rect x="267" y="54" width="70" height="50" rx="4" fill="#00C27C" />
                <path d="m302.556 112-6.736-8.25h13.471l-6.735 8.25Z" fill="#00C27C" />
                <text fill="#fff" style={{whiteSpace: "pre"}} fontSize="16" fontWeight="bold" letterSpacing="-.01em">
                  <tspan x="301.382" y="75.188" textAnchor="middle">Meta</tspan>
                  <tspan x="302.382" y="94.188" textAnchor="middle">{currentWeight - weightLossGoal} kg</tspan>
                </text>
                <text fill="#FF974D" style={{whiteSpace: "pre"}} fontSize="16" fontWeight="bold" letterSpacing="-0.01em">
                  <tspan x="92.0544" y="46.1875">{Math.round(currentWeight - (weightLossGoal * 0.33))} kg</tspan>
                </text>
                <text fill="#FEC226" style={{whiteSpace: "pre"}} fontSize="16" fontWeight="bold" letterSpacing="-0.01em">
                  <tspan x="204.086" y="101.188">{Math.round(currentWeight - (weightLossGoal * 0.66))} kg</tspan>
                </text>
                <text fill="#F2556F" style={{whiteSpace: "pre"}} fontSize="16" fontWeight="bold" letterSpacing="-.01em">
                  <tspan x="10.218" y="22.188">{currentWeight} kg</tspan>
                </text>
                <text fill="#999999" style={{whiteSpace: "pre"}} fontSize="14">
                  <tspan x="313.02" y="186.477">{format(addDays(new Date(), Math.ceil((weightLossGoal / 10) * 21)), 'd MMM', { locale: ptBR })}</tspan>
                </text>
                <text fill="#999999" style={{whiteSpace: "pre"}} fontSize="14">
                  <tspan x="212.553" y="186.477">{format(addDays(new Date(), Math.ceil(((weightLossGoal / 10) * 21) * 0.66)), 'd MMM', { locale: ptBR })}</tspan>
                </text>
                <text fill="#999999" style={{whiteSpace: "pre"}} fontSize="14">
                  <tspan x="100.956" y="186.477">{format(addDays(new Date(), Math.ceil(((weightLossGoal / 10) * 21) * 0.33)), 'd MMM', { locale: ptBR })}</tspan>
                </text>
                <text fill="#999" style={{whiteSpace: "pre"}} fontSize="14">
                  <tspan x="2" y="186.477">Hoje</tspan>
                </text>
                <defs>
                  <filter id="filter3_d_14_891" x="213" y="114" width="26" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_14_891" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_14_891" result="shape" />
                  </filter>
                  <filter id="filter2_d_14_891" x="101" y="61" width="26" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_14_891" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_14_891" result="shape" />
                  </filter>
                  <filter id="b" x="0" y="30" width="26" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                    <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_16156_1601" />
                    <feBlend in="SourceGraphic" in2="effect1_dropShadow_16156_1601" result="shape" />
                  </filter>
                  <filter id="c" x="281" y="118" width="42" height="42" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                    <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_16156_1601" />
                    <feBlend in="SourceGraphic" in2="effect1_dropShadow_16156_1601" result="shape" />
                  </filter>
                  <linearGradient id="a" x1="12.154" y1="82.107" x2="328.929" y2="82.547" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F2556F" />
                    <stop offset=".433" stopColor="#FFD96B" />
                    <stop offset="1" stopColor="#00C27C" />
                  </linearGradient>
                </defs>
              </svg>
            </figure>
          </div>
        </div>
        {/* SEÇÃO 5: GRÁFICO DE PROGRESSO DE PESO */}
        {/* SEÇÃO: DEPOIMENTO WHATSAPP */}
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Depoimentos Reais de Nossas Alunas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                {testimonials.slice(0, 5).map((testimonial, index) => (
                  <div key={index} className="bg-[#ece5dd] rounded-2xl shadow-lg p-4 border border-[#dadada] relative" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-600">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">{testimonial.name}</span>
                        <span className="text-gray-500 text-sm ml-2">{testimonial.age} anos – {testimonial.city}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-3 mb-2 shadow-sm relative">
                      <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">
                        {testimonial.message}
                      </p>
                      <span className="absolute bottom-2 right-4 text-gray-400 text-xs select-none">22:17</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Coluna Direita */}
              <div className="space-y-6">
                {testimonials.slice(5, 10).map((testimonial, index) => (
                  <div key={index} className="bg-[#ece5dd] rounded-2xl shadow-lg p-4 border border-[#dadada] relative" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-600">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">{testimonial.name}</span>
                        <span className="text-gray-500 text-sm ml-2">{testimonial.age} anos – {testimonial.city}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-3 mb-2 shadow-sm relative">
                      <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">
                        {testimonial.message}
                      </p>
                      <span className="absolute bottom-2 right-4 text-gray-400 text-xs select-none">22:17</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* FIM SEÇÃO: DEPOIMENTOS WHATSAPP */}
        {/* SEÇÃO 21: COMPARAÇÃO ENTRE DIETAS */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 mb-16 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🔄 COMPARAÇÃO ENTRE DIETAS
            </h2>
                </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Coluna da Esquerda - Dietas Restritivas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-red-100">
              <h3 className="text-xl font-bold text-red-600 mb-4">Dietas Restritivas</h3>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>❌ Genéricas: não consideram suas necessidades individuais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>⏰ Temporárias: não ensinam hábitos duradouros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>📉 Metabolismo travado: efeito sanfona garantido</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>😫 Sofrimento: fome constante e privação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>💸 Custo alto: suplementos e produtos caros</span>
                </li>
              </ul>
              </div>

            {/* Coluna da Direita - PAPI */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100">
              <h3 className="text-xl font-bold text-green-600 mb-4">Plano Alimentar Personalizado Individualizado (PAPI)</h3>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>✅ Personalizado: feito exclusivamente para você</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>🔄 Adaptável: evolui com seu corpo e rotina</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>📈 Metabolismo acelerado: emagrecimento sustentável</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>😊 Prazer: sem fome e sem privações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>💰 Investimento: resultados duradouros</span>
                </li>
              </ul>
                </div>
              </div>
            </div>
        {/* SEÇÃO 21: COMPARAÇÃO ENTRE DIETAS */}

        {/* SEÇÃO: ARGUMENTOS PODEROSOS */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 mb-16 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              💡 CONHEÇA NOSSA ABORDAGEM ÚNICA
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100">
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>🎯 Sobre: Plano 100% personalizado para seu corpo e metabolismo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>💪 Sobre: Adaptação mensal para evitar desistência</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>⏰ Sobre: Plano flexível para sua rotina, mesmo com pouco tempo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>⚡ Sobre: Emagrecimento sustentável e definitivo</span>
                </li>
              </ul>
        </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100">
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>💰 Sobre: Investimento em sua autoestima e bem-estar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>🧬 Sobre: Hábitos superam a genética</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>🔄 Sobre: Ajustes contínuos para manter o progresso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>✨ Sobre: Método evolutivo e personalizado</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* FIM SEÇÃO: ARGUMENTOS PODEROSOS */}

        {/* SEÇÃO 6: CONTADOR DE TEMPO E VAGAS */}
        <div className="bg-red-50 rounded-2xl shadow-xl p-8 mb-12 border-2 border-red-500">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-red-500 text-white px-6 py-2 rounded-full inline-block mb-6">
              ⚠️ ATENÇÃO: Oferta por Tempo Limitado
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Esta Oferta Expira em:
            </h2>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-white rounded-xl p-4 shadow">
                <span className="text-3xl font-bold text-red-500">{timer.hours}</span>
                <p className="text-sm text-gray-600">Horas</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <span className="text-3xl font-bold text-red-500">{timer.minutes}</span>
                <p className="text-sm text-gray-600">Minutos</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <span className="text-3xl font-bold text-red-500">{timer.seconds}</span>
                <p className="text-sm text-gray-600">Segundos</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-lg text-red-600 font-semibold">
                Apenas {remainingSpots} vagas restantes para {location.city}!
              </p>
              <p className="text-gray-600">
                🔥 {totalBuyers} pessoas de {location.city} compraram nos últimos 30 minutos
              </p>
              <div className="bg-yellow-100 p-4 rounded-lg inline-block">
                <p className="text-yellow-800">
                  ⚡ Bônus especiais disponíveis apenas nas próximas 24 horas!
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* SEÇÃO 6: CONTADOR DE TEMPO E VAGAS */}

        {/* SEÇÃO: CUPOM DE DESCONTO APLICADO */}
        <div className="bg-yellow-100 rounded-xl p-6 mb-8 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu cupom de desconto foi aplicado!</h2>
          <div className="inline-flex items-center gap-2 bg-white rounded-md px-3 py-1 mb-2 mt-2">
            <span className="bg-green-500 rounded p-1"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="text-green-600 font-bold text-xl">{userName}_72%OFF</span>
          </div>
          <div className="text-gray-700 mt-2">
            O desconto de 72% está reservado por: <span className="text-red-600 font-bold text-xl">{couponTimer}</span> minutos
          </div>
        </div>
        {/* FIM SEÇÃO: CUPOM DE DESCONTO APLICADO */}

        {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}
        <div className="mt-12 pt-8 border-t border-gray-100" role="region" aria-label="Planos e preços">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Comece sua transformação hoje mesmo
            </h3>
            <p className="text-gray-600 mb-4">Escolha o plano que melhor se adapta a você</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plano Mensal */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'monthly' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Mensal</div>
                  <div><span className="text-neutral-400 line-through">R$ 47</span> apenas <span className="text-red-500 font-bold">R$ 29</span></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,96</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Trimestral */}
            <div
              onClick={() => setSelectedPlan('quarterly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'quarterly' ? 'border-blue-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'quarterly'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Trimestral</div>
                  <div><span className="text-neutral-400 line-through">R$ 141</span> apenas <span className="text-neutral-400 font-bold">R$ 49</span></div>
                  <div className="text-xs text-neutral-400 font-bold mt-1"></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,54</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Anual */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'annual' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'annual'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Anual</div>
                  <div>
                    <span className="text-neutral-400 line-through">R$ 348</span> apenas <span className="text-green-600 font-bold">R$ 97</span>
                  </div>
                  <div className="text-xs text-green-600 font-bold mt-1">Economize 72% no anual</div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,27</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
              <div className="absolute -top-[0.54rem] left-[1rem] inline-flex h-[18.25px] items-center justify-start gap-2.5 rounded-md bg-gradient-to-r from-red-400 to-orange-400 px-2 py-0.5">
                <div className="text-xs font-medium uppercase leading-none text-white flex items-center gap-1">
                  Mais popular <Flame className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`w-full text-[18px] font-bold bg-gradient-to-r from-red-400 to-orange-400 
                       text-white py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                       ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
              aria-label={isLoading ? "Processando pagamento" : "Escolher este plano"}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>Escolher este plano</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
        {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}

        {showQuarterlySoldOut && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center font-semibold text-lg">
            O Plano Trimestral está esgotado! Você será redirecionado para o Plano Anual.
          </div>
        )}


        {/* SEÇÃO 10: MANCHETES DE JORNAIS */}
        <div className="bg-gray-50 rounded-2xl shadow-xl p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              O Que a Mídia Está Dizendo Sobre a Obesidade
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Jornal 1 */}
              <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <img src="/img/logos/folha-logo.png" alt="Folha de S.Paulo" className="h-8" />
                  <span className="text-xs text-gray-500">Publicado em 15/03/2024</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  Obesidade Aumenta em 40% o Risco de Câncer no Brasil
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Estudo da USP revela que excesso de peso está diretamente ligado ao desenvolvimento de tumores
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Por Dr. Carlos Silva, Especialista em Oncologia</p>
                </div>
              </div>

              {/* Jornal 2 */}
              <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <img src="/img/logos/estadao-logo.png" alt="O Estado de S.Paulo" className="h-8" />
                  <span className="text-xs text-gray-500">Publicado em 10/03/2024</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  Gordura no Fígado: A Epidemia Silenciosa que Atinge 30% dos Brasileiros
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Especialistas alertam para o aumento alarmante de casos de esteatose hepática
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Por Dra. Ana Oliveira, Hepatologista</p>
                </div>
              </div>

              {/* Jornal 3 */}
              <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <img src="/img/logos/globo-logo.png" alt="O Globo" className="h-8" />
                  <span className="text-xs text-gray-500">Publicado em 05/03/2024</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  Obesidade Reduz Expectativa de Vida em Até 10 Anos
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Pesquisa internacional mostra impacto do excesso de peso na longevidade
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Por Dr. Roberto Santos, Epidemiologista</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-lg text-gray-700">
                <span className="font-bold text-red-600">ATENÇÃO:</span> Estas notícias são baseadas em estudos científicos reais e mostram a gravidade do problema.
              </p>
            </div>
          </div>
        </div>
        {/* SEÇÃO 10: MANCHETES DE JORNAIS */}

        {/* SEÇÃO 11: ALERTA DE SAÚDE */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border-l-8 border-red-600">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                ALERTA DE SAÚDE: Pequenas Mudanças Hoje Podem Transformar Seu Amanhã
              </h2>
              <p className="text-xl text-gray-600">
                Estudo recente revela como hábitos alimentares inadequados podem impactar sua qualidade de vida
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <div className="bg-red-50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-red-600 mb-4">Sinais de Alerta</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Indisposição e cansaço frequente</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Alterações no sono</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Mudanças no humor</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Desconforto com roupas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-red-50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-red-600 mb-4">Benefícios da Mudança</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Mais disposição e energia</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Melhor qualidade do sono</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Mais autoestima e confiança</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-gray-800">Roupas que servem melhor</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-100 p-6 rounded-xl mb-8">
              <p className="text-xl text-gray-800 text-center">
                <span className="font-bold text-red-600">ATENÇÃO:</span> Se você tem {age} anos, está no momento ideal para fazer mudanças positivas na sua vida.
              </p>
            </div>
          </div>
        </div>
        {/* SEÇÃO 11: ALERTA DE SAÚDE */}

        {/* SEÇÃO 12: HISTÓRIA DO ESPECIALISTA */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1 rounded-full mb-4">
                Conheça o Criador do Método PAI
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                "Minha missão é ajudar pessoas a transformarem suas vidas através da nutrição personalizada"
              </h2>
              <p className="text-xl text-gray-600">
                Dr. Ricardo Santos, PhD em Nutrição Clínica
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="relative">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                  <img
                    src="/img/dr-ricardo.jpg"
                    alt="Dr. Ricardo Santos"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4">
                  <div className="flex items-center gap-2">
                    <img src="/img/logos/harvard-logo.png" alt="Harvard" className="h-8" />
                    <div className="text-sm">
                      <p className="font-bold text-gray-900">Harvard Medical School</p>
                      <p className="text-gray-600">Pesquisador Visitante</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Minha Jornada Pessoal
                  </h3>
                  <p className="text-gray-600 mb-4">
                    "Como muitos de vocês, eu também lutei com meu peso durante anos. Na faculdade de medicina, pesava 98kg e, mesmo sendo médico, não conseguia encontrar uma solução definitiva. Foi quando percebi que cada pessoa é única e precisa de uma abordagem personalizada."
                  </p>
                  <p className="text-gray-600">
                    "Depois de perder 23kg aplicando os princípios que desenvolvi, dediquei minha vida a ajudar outras pessoas a conquistarem sua própria transformação."
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    A Descoberta do Método PAI
                  </h3>
                  <p className="text-gray-600 mb-4">
                    "Durante meu doutorado, analisei mais de 10.000 casos de emagrecimento e descobri que os planos genéricos falham em 83% das vezes. Foi quando desenvolvi o Método PAI - Plano Alimentar Individualizado, que já transformou mais de 50.000 vidas."
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-md">
                    <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                    <p className="text-sm text-gray-600">Anos de Experiência</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-md">
                    <div className="text-3xl font-bold text-blue-600 mb-2">50k+</div>
                    <p className="text-sm text-gray-600">Vidas Transformadas</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-md">
                    <div className="text-3xl font-bold text-blue-600 mb-2">97%</div>
                    <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Formação Internacional
                </h3>
                <p className="text-gray-600">
                  Especialização em Nutrição Clínica pela Harvard Medical School e PhD em Metabolismo pela USP
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Pesquisador Premiado
                </h3>
                <p className="text-gray-600">
                  Autor de 47 artigos científicos e 3 livros sobre nutrição personalizada
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Método Comprovado
                </h3>
                <p className="text-gray-600">
                  Desenvolvido após 10 anos de pesquisa e validado em mais de 50.000 casos
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <blockquote className="text-2xl font-serif text-gray-800 italic">
                "Minha maior realização não são os títulos ou prêmios, mas ver a transformação na vida das pessoas que confiam em nosso método."
              </blockquote>
              <p className="mt-4 text-gray-600">- Dr. Ricardo Santos</p>
            </div>

            <div className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Quer conhecer mais sobre o método que já transformou milhares de vidas?
              </h3>
              {/* Botão removido conforme solicitado */}
            </div>
          </div>
        </div>
        {/* SEÇÃO 12: HISTÓRIA DO ESPECIALISTA */}
       {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}
       <div className="mt-12 pt-8 border-t border-gray-100" role="region" aria-label="Planos e preços">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Comece sua transformação hoje mesmo
            </h3>
            <p className="text-gray-600 mb-4">Escolha o plano que melhor se adapta a você</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plano Mensal */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'monthly' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Mensal</div>
                  <div><span className="text-neutral-400 line-through">R$ 47</span> apenas <span className="text-red-500 font-bold">R$ 29</span></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,96</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Trimestral */}
            <div
              onClick={() => setSelectedPlan('quarterly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'quarterly' ? 'border-blue-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'quarterly'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Trimestral</div>
                  <div><span className="text-neutral-400 line-through">R$ 141</span> apenas <span className="text-neutral-400 font-bold">R$ 49</span></div>
                  <div className="text-xs text-neutral-400 font-bold mt-1"></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,54</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Anual */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'annual' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'annual'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Anual</div>
                  <div>
                    <span className="text-neutral-400 line-through">R$ 348</span> apenas <span className="text-green-600 font-bold">R$ 97</span>
                  </div>
                  <div className="text-xs text-green-600 font-bold mt-1">Economize 72% no anual</div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,27</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
              <div className="absolute -top-[0.54rem] left-[1rem] inline-flex h-[18.25px] items-center justify-start gap-2.5 rounded-md bg-gradient-to-r from-red-400 to-orange-400 px-2 py-0.5">
                <div className="text-xs font-medium uppercase leading-none text-white flex items-center gap-1">
                  Mais popular <Flame className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`w-full text-[18px] font-bold bg-gradient-to-r from-red-400 to-orange-400 
                       text-white py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                       ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
              aria-label={isLoading ? "Processando pagamento" : "Escolher este plano"}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>Escolher este plano</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
        {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}
        {/* SEÇÃO 13: BÔNUS EXCLUSIVOS */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 mb-12 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              🎁 Bônus Exclusivos do PAPI
            </h2>
            <p className="text-xl text-white/90">
              Valor Total em Bônus: <span className="line-through">R$ 2.997,00</span> — GRÁTIS para Membros
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "🔥",
                title: "Guia de Receitas Low Carb",
                value: "R$ 297,00",
                features: [
                  "100+ receitas práticas",
                  "Cardápios semanais",
                  "Lista de compras automática"
                ]
              },
              {
                icon: "📱",
                title: "App de Tracking de Progresso",
                value: "R$ 397,00",
                features: [
                  "Acompanhamento diário",
                  "Fotos antes/depois",
                  "Gráficos de evolução"
                ]
              },
              {
                icon: "📚",
                title: "E-book Mindset da Transformação",
                value: "R$ 197,00",
                features: [
                  "Técnicas de psicologia",
                  "Exercícios práticos",
                  "Áudios de meditação"
                ]
              },
              {
                icon: "🎯",
                title: "Programa Acelerador Metabólico",
                value: "R$ 497,00",
                features: [
                  "30 treinos de 15 minutos",
                  "Exercícios sem equipamentos",
                  "Vídeos explicativos HD"
                ]
              },
              {
                icon: "💪",
                title: "Guia de Jejum Intermitente",
                value: "R$ 297,00",
                features: [
                  "Protocolos para iniciantes",
                  "Cronogramas personalizados",
                  "Dicas para controle da fome"
                ]
              },
              {
                icon: "🍳",
                title: "Mini-Curso Batch Cooking",
                value: "R$ 397,00",
                features: [
                  "4 aulas em vídeo HD",
                  "Preparo de marmitas fit",
                  "Organização semanal"
                ]
              },
              {
                icon: "👥",
                title: "Grupo VIP no WhatsApp",
                value: "R$ 497,00",
                features: [
                  "Acesso direto aos especialistas",
                  "Dúvidas respondidas em 24h",
                  "Suporte motivacional diário"
                ]
              },
              {
                icon: "📊",
                title: "Planilha Calculadora Nutricional",
                value: "R$ 197,00",
                features: [
                  "Cálculo automático de macros",
                  "Ajuste de calorias",
                  "Controle de água"
                ]
              },
              {
                icon: "🎓",
                title: "Masterclass Nutrição na Prática",
                value: "R$ 127,00",
                features: [
                  "3 aulas gravadas em HD",
                  "Interpretação de rótulos",
                  "Certificado de conclusão"
                ]
              },
              {
                icon: "🌟",
                title: "Kit Sucesso Garantido",
                value: "R$ 97,00",
                features: [
                  "Checklist diário",
                  "Adesivos de progresso",
                  "Wallpapers motivacionais"
                ]
              }
            ].map((bonus, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{bonus.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{bonus.title}</h3>
                    <p className="text-white/80 mb-3">
                      <span className="line-through">{bonus.value}</span> — GRÁTIS
                    </p>
                    <ul className="space-y-2">
                      {bonus.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-white/90">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 inline-block">
              <h3 className="text-2xl font-bold mb-2">⚡ Bônus Surpresa de Ação Rápida</h3>
              <p className="text-white/90 mb-4">Disponível apenas para as próximas 24 horas</p>
              <div className="bg-white/20 rounded-lg p-4">
                <h4 className="text-xl font-bold mb-2">Consultoria Individual por Videochamada</h4>
                <p className="text-white/80 mb-2">
                  <span className="line-through">R$ 497,00</span> — GRÁTIS
                </p>
                <ul className="text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    30 minutos exclusivos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Análise do seu caso
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Plano de ação específico
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 inline-block">
              <h3 className="text-2xl font-bold mb-2">💰 Valor Total em Bônus</h3>
              <p className="text-3xl font-bold">
                <span className="line-through">R$ 2.997,00</span>
              </p>
              <p className="text-xl mt-2">🎁 TUDO GRÁTIS para Membros do PAPI</p>
            </div>
          </div>
        </div>
        {/* SEÇÃO 13: BÔNUS EXCLUSIVOS */}

        {/* SEÇÃO 14: GARANTIAS DO PROGRAMA */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-8 mb-12 text-white text-center">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-14 h-14 text-green-500" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Garantia Tripla de Satisfação
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-bold text-xl mb-2">Garantia de Resultado</h3>
                <p>Se você não perder peso nos primeiros 30 dias, devolvemos 100% do seu dinheiro.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-bold text-xl mb-2">Garantia de Suporte</h3>
                <p>Acompanhamento personalizado durante todo o programa.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-bold text-xl mb-2">Garantia de Satisfação</h3>
                <p>Não gostou por qualquer motivo? Devolvemos seu dinheiro em até 7 dias.</p>
              </div>
            </div>
          </div>
        </div>
        {/* SEÇÃO 14: GARANTIAS DO PROGRAMA */}

        {/* SEÇÃO 15: SOLUÇÕES PARA PROBLEMAS COMUNS */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Problemas Que Vamos Resolver Juntos
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                problem: "Metabolismo Lento",
                solution: "Aceleração Natural do Metabolismo",
                description: "Técnicas comprovadas para aumentar seu gasto calórico mesmo em repouso",
                icon: "🔥"
              },
              {
                problem: "Compulsão Alimentar",
                solution: "Controle da Fome",
                description: "Estratégias para regular hormônios da fome e saciedade",
                icon: "🍽️"
              },
              {
                problem: "Falta de Energia",
                solution: "Energia o Dia Todo",
                description: "Plano nutricional que mantém sua energia estável",
                icon: "⚡"
              },
              {
                problem: "Gordura Localizada",
                solution: "Queima de Gordura Direcionada",
                description: "Exercícios e nutrientes específicos para cada área",
                icon: "💪"
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <div className="text-2xl">{item.icon}</div>
                  </div>
                  <div>
                    <div className="text-red-500 font-medium mb-1">{item.problem}</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.solution}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* SEÇÃO 15: SOLUÇÕES PARA PROBLEMAS COMUNS */}

       {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}
       <div className="mt-12 pt-8 border-t border-gray-100" role="region" aria-label="Planos e preços">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Comece sua transformação hoje mesmo
            </h3>
            <p className="text-gray-600 mb-4">Escolha o plano que melhor se adapta a você</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plano Mensal */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'monthly' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Mensal</div>
                  <div><span className="text-neutral-400 line-through">R$ 47</span> apenas <span className="text-red-500 font-bold">R$ 29</span></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,96</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Trimestral */}
            <div
              onClick={() => setSelectedPlan('quarterly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'quarterly' ? 'border-blue-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'quarterly'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Trimestral</div>
                  <div><span className="text-neutral-400 line-through">R$ 141</span> apenas <span className="text-neutral-400 font-bold">R$ 49</span></div>
                  <div className="text-xs text-neutral-400 font-bold mt-1"></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,54</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Anual */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'annual' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'annual'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Anual</div>
                  <div>
                    <span className="text-neutral-400 line-through">R$ 348</span> apenas <span className="text-green-600 font-bold">R$ 97</span>
                  </div>
                  <div className="text-xs text-green-600 font-bold mt-1">Economize 72% no anual</div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,27</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
              <div className="absolute -top-[0.54rem] left-[1rem] inline-flex h-[18.25px] items-center justify-start gap-2.5 rounded-md bg-gradient-to-r from-red-400 to-orange-400 px-2 py-0.5">
                <div className="text-xs font-medium uppercase leading-none text-white flex items-center gap-1">
                  Mais popular <Flame className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`w-full text-[18px] font-bold bg-gradient-to-r from-red-400 to-orange-400 
                       text-white py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                       ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
              aria-label={isLoading ? "Processando pagamento" : "Escolher este plano"}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>Escolher este plano</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
        {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}
        {/* SEÇÃO 18: HISTÓRIAS DE SUCESSO LOCAL */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Histórias de Sucesso em {location.city}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: `Maria Silva de ${location.city}`,
                age: 34,
                weightLoss: 12,
                timeframe: '45 dias',
                image: 'https://randomuser.me/api/portraits/women/1.jpg'
              },
              {
                name: `João Santos de ${location.city}`,
                age: 42,
                weightLoss: 15,
                timeframe: '60 dias',
                image: 'https://randomuser.me/api/portraits/men/1.jpg'
              },
              {
                name: `Ana Oliveira de ${location.city}`,
                age: 28,
                weightLoss: 8,
                timeframe: '30 dias',
                image: 'https://randomuser.me/api/portraits/women/2.jpg'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-600">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{testimonial.name}</h3>
                    <p className="text-gray-600">{testimonial.age} anos</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Perdi {testimonial.weightLoss}kg em apenas {testimonial.timeframe} seguindo o plano! 
                  Nunca me senti tão bem e com tanta energia. Recomendo muito!"
                </p>
                <div className="mt-4 flex items-center gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* SEÇÃO 18: HISTÓRIAS DE SUCESSO LOCAL */}

        {/* SEÇÃO 19: CERTIFICAÇÕES E SELOS */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Programa Certificado e Reconhecido
          </h2>
          <div className="grid grid-cols-3 gap-8 items-center justify-items-center mb-8">
            <div className="text-center">
              <img src="/seals/nutri-seal.png" alt="Certificação Nutrição" className="w-32 h-32 mx-auto mb-4" />
              <p className="font-medium text-gray-700">Conselho Federal de Nutrição</p>
            </div>
            <div className="text-center">
              <img src="/seals/quality-seal.png" alt="Selo de Qualidade" className="w-32 h-32 mx-auto mb-4" />
              <p className="font-medium text-gray-700">Excelência em Resultados</p>
            </div>
            <div className="text-center">
              <img src="/seals/safety-seal.png" alt="Selo de Segurança" className="w-32 h-32 mx-auto mb-4" />
              <p className="font-medium text-gray-700">100% Seguro e Testado</p>
            </div>
          </div>
        </div>
        {/* SEÇÃO 19: CERTIFICAÇÕES E SELOS */}

       {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}
       <div className="mt-12 pt-8 border-t border-gray-100" role="region" aria-label="Planos e preços">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Comece sua transformação hoje mesmo
            </h3>
            <p className="text-gray-600 mb-4">Escolha o plano que melhor se adapta a você</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plano Mensal */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'monthly' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Mensal</div>
                  <div><span className="text-neutral-400 line-through">R$ 47</span> apenas <span className="text-red-500 font-bold">R$ 29</span></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,96</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Trimestral */}
            <div
              onClick={() => setSelectedPlan('quarterly')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'quarterly' ? 'border-blue-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'quarterly'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Trimestral</div>
                  <div><span className="text-neutral-400 line-through">R$ 141</span> apenas <span className="text-neutral-400 font-bold">R$ 49</span></div>
                  <div className="text-xs text-neutral-400 font-bold mt-1"></div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,54</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
            </div>

            {/* Plano Anual */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`rounded-xl border relative cursor-pointer border-2 px-4 pb-3 pt-4 ${
                selectedPlan === 'annual' ? 'border-red-400 bg-white' : 'border-zinc-100 bg-stone-100 text-gray-500 shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`relative h-6 w-6 rounded-full before:rounded-full before:content-[''] ${
                  selectedPlan === 'annual'
                    ? 'bg-gradient-to-br from-red-400 to-orange-400 before:absolute before:bottom-[2px] before:left-[2px] before:right-[2px] before:top-[2px] before:border-4 before:border-white'
                    : 'border-2 border-stone-300'
                }`} />
                <div className="grow pl-2 leading-7">
                  <div className="text-[18px] font-bold pb-1">Plano Anual</div>
                  <div>
                    <span className="text-neutral-400 line-through">R$ 348</span> apenas <span className="text-green-600 font-bold">R$ 97</span>
                  </div>
                  <div className="text-xs text-green-600 font-bold mt-1">Economize 72% no anual</div>
                </div>
                <div className="text-right">
                  <div className="is-size-4 pb-1 font-bold">R$ 0,27</div>
                  <div className="font-normal text-neutral-400">por dia</div>
                </div>
              </div>
              <div className="absolute -top-[0.54rem] left-[1rem] inline-flex h-[18.25px] items-center justify-start gap-2.5 rounded-md bg-gradient-to-r from-red-400 to-orange-400 px-2 py-0.5">
                <div className="text-xs font-medium uppercase leading-none text-white flex items-center gap-1">
                  Mais popular <Flame className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`w-full text-[18px] font-bold bg-gradient-to-r from-red-400 to-orange-400 
                       text-white py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                       ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
              aria-label={isLoading ? "Processando pagamento" : "Escolher este plano"}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>Escolher este plano</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
        {/* SEÇÃO 7: SELEÇÃO DE PLANOS E PREÇOS */}


        {/* SEÇÃO 20: PERGUNTAS FREQUENTES (FAQ) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Dúvidas Frequentes
          </h2>
          <div className="space-y-6">
            {[
              {
                question: "Quanto tempo leva para receber meu plano personalizado?",
                answer: "Após a confirmação do pagamento, você receberá seu plano completo em até 24 horas, incluindo cardápio personalizado, cronograma de resultados e todos os bônus."
              },
              {
                question: "Como funciona o suporte nutricional?",
                answer: "Você terá acesso direto à nossa equipe de nutricionistas através do grupo VIP no WhatsApp, onde poderá tirar dúvidas e receber orientações personalizadas em até 24 horas."
              },
              {
                question: "O plano é realmente personalizado para mim?",
                answer: "Sim! Seu plano é criado considerando seu metabolismo, rotina, preferências alimentares e objetivos específicos. Nossa equipe analisa todos os dados do seu quiz para criar um plano único para você."
              },
              {
                question: "Como funciona a garantia de resultado?",
                answer: "Se você não perder peso nos primeiros 30 dias seguindo o plano corretamente, devolvemos 100% do seu investimento. Basta nos enviar um e-mail com seus dados e comprovante de pagamento."
              },
              {
                question: "Preciso fazer exercícios para ter resultados?",
                answer: "Não é obrigatório, mas recomendamos a prática de exercícios para acelerar os resultados. O programa inclui o bônus 'Programa Acelerador Metabólico' com treinos de 15 minutos que podem ser feitos em casa."
              },
              {
                question: "Como funciona o cronograma de resultados?",
                answer: "Você receberá um cronograma detalhado com metas semanais, mostrando exatamente o que esperar em cada fase do processo, desde a primeira semana até atingir seu peso ideal."
              },
              {
                question: "Posso adaptar o cardápio se não gostar de algum alimento?",
                answer: "Sim! O Guia de Substituições que você recebe como bônus permite trocar qualquer alimento por opções equivalentes, mantendo o equilíbrio nutricional do seu plano."
              },
              {
                question: "Como faço para acompanhar meu progresso?",
                answer: "Você receberá acesso ao App de Tracking de Progresso, onde poderá registrar seu peso, medidas, fotos e acompanhar sua evolução através de gráficos e relatórios."
              },
              {
                question: "O plano inclui receitas práticas?",
                answer: "Sim! Você receberá o Guia de Receitas Low Carb com mais de 100 receitas práticas e saudáveis, além de cardápios semanais e lista de compras automática."
              },
              {
                question: "Como funciona o ajuste mensal do plano?",
                answer: "A cada mês, nossa equipe analisa seu progresso e faz os ajustes necessários no seu plano para garantir que você continue evoluindo e mantendo os resultados."
              }
            ].map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        {/* SEÇÃO 20: PERGUNTAS FREQUENTES (FAQ) */}


      </div>
    </div>
  );
};

export default SalesPage;