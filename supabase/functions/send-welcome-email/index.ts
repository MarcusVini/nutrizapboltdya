import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend@3.2.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Incoming request:', req.method, req.url)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Request body:', body)
    
    const { leadId } = body

    if (!leadId) {
      console.error('Missing leadId parameter')
      return new Response(
        JSON.stringify({ error: 'Missing leadId parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    console.log('Environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasResendApiKey: !!resendApiKey
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!resendApiKey) {
      console.error('Missing Resend API key')
      return new Response(
        JSON.stringify({ error: 'Missing Resend API key' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get lead data
    console.log('Fetching lead data for ID:', leadId)
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError) {
      console.error('Error fetching lead:', leadError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch lead: ${leadError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!lead) {
      console.error('Lead not found')
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Lead found:', lead)

    // Get quiz responses
    console.log('Fetching quiz responses for lead:', leadId)
    const { data: responses, error: responsesError } = await supabaseClient
      .from('quiz_responses')
      .select('*')
      .eq('lead_id', leadId)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch quiz responses: ${responsesError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Quiz responses found:', responses)

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Adicione esta função para formatar as respostas de forma mais amigável
    function formatQuizResponses(responses: any[]) {
      const categories = {
        'Informações Pessoais': ['name', 'age', 'gender'],
        'Objetivos': ['weight', 'targetWeight', 'timeframe'],
        'Hábitos': ['activity', 'diet', 'habits'],
        'Histórico': ['previousAttempts', 'dietResults', 'yoyoEffect']
      };

      let formattedResponses = '';
      for (const [category, fields] of Object.entries(categories)) {
        const categoryResponses = responses.filter(r => fields.includes(r.question_id));
        if (categoryResponses.length > 0) {
          formattedResponses += `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #2563eb; margin-bottom: 10px; font-size: 18px;">${category}</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${categoryResponses.map(r => `
                  <li style="margin-bottom: 8px; display: flex;">
                    <span style="color: #6b7280; min-width: 150px;">${r.question}:</span>
                    <strong style="color: #1f2937;">${r.answer}</strong>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        }
      }
      return formattedResponses;
    }

    // Send welcome email
    console.log('Sending welcome email to:', lead.email)
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Seu Plano Alimentar <contato@seuplanoalimentar.com.br>',
        to: [lead.email],
        reply_to: 'suporte@seuplanoalimentar.com.br',
        subject: `${lead.name}, seu plano personalizado está pronto! 🎯`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Seu Plano Personalizado</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; margin-bottom: 10px;">
                  Olá, ${lead.name}! 👋
                </h1>
                <p style="color: #e0e7ff; margin: 0; font-size: 16px;">
                  Seu plano personalizado está pronto
                </p>
              </div>

              <!-- Main Content -->
              <div style="padding: 32px 24px;">
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                  <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                    📊 Resumo do Seu Perfil
                  </h2>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 14px;">Peso Atual</p>
                      <p style="color: #1f2937; margin: 0; font-size: 18px; font-weight: bold;">
                        ${lead.current_weight_kg}kg
                      </p>
                    </div>
                    <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 14px;">Meta</p>
                      <p style="color: #1f2937; margin: 0; font-size: 18px; font-weight: bold;">
                        ${lead.target_weight_kg}kg
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Quiz Responses -->
                <div style="margin-bottom: 32px;">
                  <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                    🎯 Suas Informações
                  </h2>
                  ${formatQuizResponses(responses)}
                </div>

                <!-- Next Steps -->
                <div style="background: linear-gradient(to right, #34d399, #10b981); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 32px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px;">Próximos Passos</h2>
                  <p style="margin: 0; font-size: 16px;">
                    Em breve você receberá acesso ao seu plano personalizado com todas as orientações necessárias para alcançar seu objetivo.
                  </p>
                </div>

                <!-- Tips -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px;">
                  <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                    💡 Dicas para Começar
                  </h2>
                  <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">Mantenha-se hidratado bebendo água regularmente</li>
                    <li style="margin-bottom: 8px;">Faça suas refeições em horários regulares</li>
                    <li style="margin-bottom: 8px;">Evite pular refeições</li>
                    <li>Procure dormir bem, pelo menos 7 horas por noite</li>
                  </ul>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
                  Siga-nos nas redes sociais para mais dicas e conteúdos exclusivos
                </p>
                <div style="margin-bottom: 24px;">
                  <!-- Social Media Links -->
                  <a href="[LINK_INSTAGRAM]" style="color: #2563eb; text-decoration: none; margin: 0 8px;">Instagram</a>
                  <a href="[LINK_FACEBOOK]" style="color: #2563eb; text-decoration: none; margin: 0 8px;">Facebook</a>
                  <a href="[LINK_YOUTUBE]" style="color: #2563eb; text-decoration: none; margin: 0 8px;">YouTube</a>
                </div>
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                  © 2024 Seu Plano Alimentar. Todos os direitos reservados.<br>
                  Este email foi enviado para ${lead.email}
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      })

      if (emailError) {
        console.error('Error sending email:', JSON.stringify(emailError, null, 2))
        return new Response(
          JSON.stringify({ error: `Failed to send email: ${JSON.stringify(emailError)}` }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Email sent successfully:', emailData)

      return new Response(
        JSON.stringify({ success: true, data: emailData }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      console.error('Error in email sending:', JSON.stringify(error, null, 2))
      return new Response(
        JSON.stringify({ error: `Email sending failed: ${JSON.stringify(error)}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}) 