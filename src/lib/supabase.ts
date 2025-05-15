import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
});

export async function sendQuizToN8N(quizData: any) {
  return new Promise((resolve, reject) => {
    try {
      // Função para limpar o número do WhatsApp
      const cleanWhatsappNumber = (number: string) => {
        const cleaned = number.replace(/\D/g, '');
        if (!cleaned.startsWith('55')) {
          return `55${cleaned}`;
        }
        return cleaned;
      };

      const quizPayload = {
        Nome: quizData.lead_name,
        Email: quizData.email,
        WhatsApp: cleanWhatsappNumber(quizData.whatsapp),
        Idade: quizData.age,
        Gênero: quizData.gender,
        Altura: quizData.height_cm,
        Peso_Atual: quizData.current_weight_kg,
        Peso_Ideal: quizData.target_weight_kg,
        Meta_de_Perda_de_Peso: quizData.weight_loss_goal,
        Nível_de_Atividade: quizData.activity_level,
        Tempo_Disponível: quizData.daily_time_commitment,
        Qualidade_da_Dieta: quizData.diet_quality,
        Hábitos: quizData.habits,
        Tentativas_Anteriores: quizData.previous_attempts,
        Tipo_de_Metabolismo: quizData.metabolism_type,
        Número_de_Tentativas: quizData.diet_attempts_count,
        Resultados_Anteriores: quizData.diet_results,
        Efeito_Sanfona: quizData.yoyo_effect,
        IP: quizData.ip_address,
        Fingerprint: quizData.fingerprint,
        Data_e_Hora: new Date().toISOString()
      };

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://n8nwebhook.pahcheko.com/webhook/60962073-5815-4229-aba8-20e7b1f39c25', true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Dados enviados para n8n com sucesso');
          resolve({ success: true });
        } else {
          reject(new Error(`HTTP Error: ${xhr.status}`));
        }
      };

      xhr.onerror = function() {
        reject(new Error('Erro na requisição'));
      };

      xhr.send(JSON.stringify(quizPayload));

    } catch (error) {
      console.error('Erro ao enviar dados para n8n:', error);
      reject(error);
    }
  });
}