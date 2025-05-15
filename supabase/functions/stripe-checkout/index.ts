import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

console.log('=== Inicialização da função Edge ===');

// Verificar variáveis de ambiente
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecret) {
  console.error('STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente');
  throw new Error('STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente');
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
if (!supabaseUrl) {
  console.error('SUPABASE_URL não encontrada nas variáveis de ambiente');
  throw new Error('SUPABASE_URL não encontrada nas variáveis de ambiente');
}

const supabaseServiceKey = Deno.env.get('SUPA_SERVICE_ROLE_KEY');
if (!supabaseServiceKey) {
  console.error('SUPA_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  throw new Error('SUPA_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
}

console.log('Variáveis de ambiente verificadas com sucesso');

// Inicializar cliente Stripe
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

console.log('Cliente Stripe inicializado com sucesso');

// Inicializar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Cliente Supabase inicializado com sucesso');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, access-control-allow-origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(body: string | object | null, status = 200) {
  if (status === 204) {
    return new Response(null, { status, headers: corsHeaders });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

console.log('Função Edge pronta para receber requisições');

Deno.serve(async (req) => {
  try {
    console.log('=== Início da requisição ===');
    console.log('Headers da requisição:', Object.fromEntries(req.headers.entries()));
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Respondendo a requisição OPTIONS');
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      console.error('Método não permitido:', req.method);
      return corsResponse({ error: 'Método não permitido' }, 405);
    }

    // Parse request body and handle potential JSON parsing errors
    let body;
    try {
      body = await req.json();
      console.log('Corpo da requisição recebido:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
      return corsResponse({ error: 'JSON inválido no corpo da requisição' }, 400);
    }

    const { price_id, success_url, cancel_url, mode } = body;

    // Validate required parameters
    if (!price_id || !success_url || !cancel_url || !mode) {
      console.error('Parâmetros faltantes:', { price_id, success_url, cancel_url, mode });
      return corsResponse({ error: 'Parâmetros obrigatórios faltantes' }, 400);
    }

    try {
      console.log('Verificando preço no Stripe:', price_id);
      // Verify the price exists in Stripe before proceeding
      try {
        const price = await stripe.prices.retrieve(price_id);
        console.log('Preço verificado com sucesso:', JSON.stringify(price, null, 2));
      } catch (priceError) {
        console.error('Erro na verificação do preço:', {
          error: priceError,
          message: priceError instanceof Error ? priceError.message : 'Erro desconhecido',
          stack: priceError instanceof Error ? priceError.stack : undefined
        });
        return corsResponse({ error: 'ID de preço inválido ou preço não encontrado no Stripe' }, 400);
      }

      console.log('Criando sessão de checkout no Stripe com os seguintes parâmetros:', {
        price_id,
        success_url,
        cancel_url,
        mode
      });

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode,
        success_url,
        cancel_url,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      };

      // Adiciona customer_creation apenas para pagamentos únicos
      if (mode === 'payment') {
        sessionConfig.customer_creation = 'always';
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log('Sessão de checkout criada com sucesso:', JSON.stringify(session, null, 2));
      return corsResponse({ sessionId: session.id });
    } catch (stripeError) {
      console.error('Erro na API do Stripe:', {
        error: stripeError,
        message: stripeError instanceof Error ? stripeError.message : 'Erro desconhecido',
        stack: stripeError instanceof Error ? stripeError.stack : undefined,
        type: stripeError instanceof Error ? stripeError.constructor.name : typeof stripeError
      });
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Erro desconhecido do Stripe';
      return corsResponse({ error: `Falha ao criar sessão de checkout: ${errorMessage}` }, 500);
    }
  } catch (error) {
    console.error('Erro não tratado:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return corsResponse({ error: `Erro interno do servidor: ${errorMessage}` }, 500);
  } finally {
    console.log('=== Fim da requisição ===');
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    console.error('No data object found in event:', event);
    return;
  }

  if (!('customer' in stripeData)) {
    console.error('No customer found in event data:', stripeData);
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    console.info('Skipping one-time payment intent without invoice');
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`Invalid customer ID received on event: ${JSON.stringify(event)}`);
    return;
  }

  let isSubscription = true;

  if (event.type === 'checkout.session.completed') {
    const { mode } = stripeData as Stripe.Checkout.Session;
    isSubscription = mode === 'subscription';
    console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session for customer: ${customerId}`);
  }

  const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

  if (isSubscription) {
    console.info(`Starting subscription sync for customer: ${customerId}`);
    try {
      await syncCustomerFromStripe(customerId);
    } catch (error) {
      console.error(`Failed to sync subscription for customer ${customerId}:`, error);
      // Consider implementing a retry mechanism here
    }
  } else if (mode === 'payment' && payment_status === 'paid') {
    try {
      // Extract the necessary information from the session
      const {
        id: checkout_session_id,
        payment_intent,
        amount_subtotal,
        amount_total,
        currency,
      } = stripeData as Stripe.Checkout.Session;

      // Insert the order into the stripe_orders table
      const { error: orderError } = await supabase.from('stripe_orders').insert({
        checkout_session_id,
        payment_intent_id: payment_intent,
        customer_id: customerId,
        amount_subtotal,
        amount_total,
        currency,
        payment_status,
        status: 'completed',
      });

      if (orderError) {
        console.error('Error inserting order:', orderError);
        // Consider implementing a retry mechanism here
        return;
      }
      console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
    } catch (error) {
      console.error('Error processing one-time payment:', error);
      // Consider implementing a retry mechanism here
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}