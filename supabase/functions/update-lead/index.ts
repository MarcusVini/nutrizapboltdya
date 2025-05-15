import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  id?: string;
  fingerprint: string;
  ip_address: string;
  [key: string]: any;
}

const calculateScore = (data: LeadData): number => {
  let score = 0;

  // Weight Loss Goal
  if (data.weight_loss_goal) {
    const goalMap: { [key: string]: number } = {
      'Perder mais de 20 kg definitivamente': 20,
      'Perder 11-20 kg definitivamente': 15,
      'Perder 1-10 kg definitivamente': 10,
      'Manter o peso e ficar em forma': 5,
      'Ainda não decidi': 0
    };
    score += goalMap[data.weight_loss_goal] || 0;
  }

  // Activity Level
  if (data.activity_level) {
    const activityMap: { [key: string]: number } = {
      'Sedentário': 20,
      'Levemente ativo': 15,
      'Moderadamente ativo': 10,
      'Muito ativo': 5,
      'Atleta': 0
    };
    score += activityMap[data.activity_level] || 0;
  }

  // Diet Quality
  if (data.diet_quality) {
    const dietMap: { [key: string]: number } = {
      'Muito ruim': 20,
      'Regular': 15,
      'Boa': 10,
      'Excelente': 0
    };
    score += dietMap[data.diet_quality] || 0;
  }

  // Previous Attempts
  if (data.previous_attempts) {
    const attemptsMap: { [key: string]: number } = {
      'Mais de 5 vezes': 20,
      '3-5 vezes': 15,
      '1-2 vezes': 10,
      'Nunca tentei': 0
    };
    score += attemptsMap[data.previous_attempts] || 0;
  }

  // Metabolism
  if (data.metabolism_type) {
    const metabolismMap: { [key: string]: number } = {
      'Metabolismo lento': 20,
      'Metabolismo normal': 10,
      'Metabolismo acelerado': 0
    };
    score += metabolismMap[data.metabolism_type] || 0;
  }

  // Yo-yo Effect
  if (data.yoyo_effect) {
    const yoyoMap: { [key: string]: number } = {
      'Sim, frequentemente': 20,
      'Sim, algumas vezes': 10,
      'Não': 0
    };
    score += yoyoMap[data.yoyo_effect] || 0;
  }

  return score;
};

serve(async (req) => {
  // Log the incoming request
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-timezone': 'America/Sao_Paulo'
        }
      }
    });

    const requestData = await req.json();
    console.log('Received data:', requestData);

    const { fingerprint, ip_address } = requestData;

    if (!fingerprint || !ip_address) {
      throw new Error('Missing required fields: fingerprint or ip_address');
    }

    // Get city and timezone from IP
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip_address}/json/`);
      const geoData = await geoResponse.json();
      console.log('Geo data:', geoData);
      
      const enrichedData = {
        ...requestData,
        city: geoData.city,
        timezone: geoData.timezone
      };

      // Calculate score if we have enough data
      if (Object.keys(requestData).length > 3) {
        enrichedData.score = calculateScore(requestData);
      }

      console.log('Enriched data:', enrichedData);

      // Check for existing lead
      const { data: existingLead, error: selectError } = await supabase
        .from('leads')
        .select('id')
        .eq('fingerprint', fingerprint)
        .single();

      if (selectError) {
        console.error('Error checking for existing lead:', selectError);
      }

      let result;
      if (existingLead) {
        console.log('Updating existing lead:', existingLead.id);
        // Update existing lead
        result = await supabase
          .from('leads')
          .update(enrichedData)
          .eq('id', existingLead.id)
          .select()
          .single();
      } else {
        console.log('Inserting new lead');
        // Insert new lead
        result = await supabase
          .from('leads')
          .insert(enrichedData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      console.log('Operation successful:', result);

      return new Response(
        JSON.stringify(result.data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (geoError) {
      console.error('Error fetching geo data:', geoError);
      // Continue without geo data
      const enrichedData = {
        ...requestData,
        score: calculateScore(requestData)
      };

      const { data, error } = await supabase
        .from('leads')
        .upsert(enrichedData, { onConflict: 'fingerprint' })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});