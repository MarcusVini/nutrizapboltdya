import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Constantes para cálculos
export const IDEAL_BMI = 21.5;
export const WEIGHT_LOSS_RATE = {
  MIN_KG_PER_PERIOD: 4, // Minimum healthy weight loss per period
  MAX_KG_PER_PERIOD: 8, // Maximum healthy weight loss per period
  DAYS: 30 // Standard period in days
};

export interface TimeframeData {
  days: number;
  type: 'days' | 'weeks' | 'months';
  dailyLoss: number;
  message: string;
}

export interface WeightData {
  date: string;
  weight: number;
  color?: string;
}

// Cálculo do IMC
export const calculateBMI = (weight: number, heightInCm: number): number => {
  const heightInMeters = heightInCm / 100;
  return weight / (heightInMeters * heightInMeters);
};

// Categoria do IMC
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'ABAIXO DO PESO';
  if (bmi < 25) return 'PESO NORMAL';
  if (bmi < 30) return 'ACIMA DO PESO';
  return 'MUITO ACIMA DO PESO';
};

// Cálculo do peso ideal baseado na altura
export const calculateIdealWeight = (heightInCm: number): number => {
  if (!heightInCm || heightInCm <= 0) return 0;
  const heightInMeters = heightInCm / 100;
  const idealWeight = IDEAL_BMI * (heightInMeters * heightInMeters);
  return Math.round(idealWeight * 10) / 10; // Arredonda para 1 casa decimal
};

// Cálculo do tempo necessário para atingir o objetivo
export const calculateTimeframe = (weightDiff: number, currentBMI: number): TimeframeData => {
  // Adjust rate based on BMI - higher BMI allows for faster initial weight loss
  const rateMultiplier = currentBMI > 30 ? 1.2 : 
                        currentBMI > 25 ? 1.0 : 0.8;
  
  // Calculate safe weight loss rate per period
  const safeRate = Math.min(
    WEIGHT_LOSS_RATE.MAX_KG_PER_PERIOD * rateMultiplier,
    Math.max(WEIGHT_LOSS_RATE.MIN_KG_PER_PERIOD, weightDiff * 0.08)
  );

  const days = Math.ceil((Math.abs(weightDiff) * WEIGHT_LOSS_RATE.DAYS) / safeRate);
  
  return {
    days,
    type: 'days',
    dailyLoss: weightDiff / days,
    message: `${days} dias`
  };
};

// Cálculo da taxa metabólica basal (BMR)
export const calculateBMR = (weight: number, heightInCm: number, age: number, isWoman: boolean): number => {
  if (isWoman) {
    return 655 + (9.6 * weight) + (1.8 * heightInCm) - (4.7 * age);
  }
  return 66 + (13.7 * weight) + (5 * heightInCm) - (6.8 * age);
};

// Geração de dados para o gráfico de perda de peso
export const generateWeightLossData = (
  currentWeight: number,
  targetWeight: number,
  timeframeInDays: number,
  points: number = 4
): WeightData[] => {
  const weightDiff = currentWeight - targetWeight;
  const interval = timeframeInDays / (points - 1);
  const now = new Date();

  return Array.from({ length: points }, (_, i) => {
    const date = i === 0 ? now : addDays(now, interval * i);
    
    // Usando uma curva exponencial para simular perda de peso mais realista
    // A perda é mais rápida no início e diminui gradualmente
    const progress = i === 0 ? 0 : 
      1 - Math.exp(-3 * (i / (points - 1))) / (1 - Math.exp(-3));
    
    // Adiciona pequena variação para simular flutuações naturais do peso
    const variation = i === 0 || i === points - 1 ? 0 : 
      (Math.random() - 0.5) * 0.4;
    
    const weight = currentWeight - (weightDiff * progress) + variation;

    let dateLabel = i === 0 ? 'Seu peso hoje' : format(date, 'd MMM', { locale: ptBR });

    return {
      date: dateLabel,
      weight: Math.round(weight * 10) / 10,
      color: i === 0 ? '#F44336' :
             i === points - 1 ? '#00C27C' :
             i === 1 ? '#FF974D' : '#FEC226'
    };
  });
};

// Cálculo da porcentagem de perda de peso
export const calculateWeightLossPercentage = (currentWeight: number, targetWeight: number) => {
  const weightLoss = currentWeight - targetWeight;
  const percentage = (weightLoss / currentWeight) * 100;
  const timeframe = calculateTimeframe(weightLoss, calculateBMI(currentWeight, 170));
  const extraWeightLoss = weightLoss * 1.1;

  return {
    percentage: Math.abs(percentage),
    isReasonable: percentage > 0 && percentage <= 20,
    weightLoss,
    extraWeightLoss,
    timeframe
  };
};

// Cálculo dos pesos intermediários
export const calculateIntermediateWeights = (currentWeight: number, targetWeight: number) => {
  const weightDiff = currentWeight - targetWeight;
  return {
    start: currentWeight,
    firstMilestone: Math.round(currentWeight - (weightDiff * 0.33)),
    secondMilestone: Math.round(currentWeight - (weightDiff * 0.66)),
    target: targetWeight
  };
}; 