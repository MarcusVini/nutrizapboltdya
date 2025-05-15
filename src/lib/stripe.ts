import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { products, ProductId } from '../stripe-config';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  throw new Error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
}

console.log('Inicializando Stripe com chave pública:', stripePublicKey.substring(0, 8) + '...');

export const stripe = loadStripe(stripePublicKey).catch(error => {
  console.error('Erro ao inicializar Stripe:', error);
  return null;
});

export async function createCheckoutSession(priceId: string) {
  try {
    console.log('=== Iniciando criação de sessão de checkout ===');
    console.log('PriceId:', priceId);
    console.log('URL do Supabase:', import.meta.env.VITE_SUPABASE_URL);
    console.log('URL da função Edge:', import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL);
    
    const response = await supabase.functions.invoke('stripe-checkout', {
      body: {
        price_id: priceId,
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`,
        mode: 'subscription'
      }
    });

    console.log('Resposta da função Edge:', response);

    if (response.error) {
      console.error('Erro detalhado da função Supabase:', {
        error: response.error,
        message: response.error.message,
        stack: response.error.stack,
        context: response.error.context
      });
      throw new Error(`Falha ao criar sessão de checkout: ${response.error.message || 'Erro desconhecido'}`);
    }

    if (!response.data) {
      console.error('Nenhum dado retornado da função');
      throw new Error('Nenhum dado retornado da criação da sessão de checkout');
    }

    if (!response.data.sessionId) {
      console.error('Dados retornados sem sessionId:', response.data);
      throw new Error('Nenhum ID de sessão retornado da criação do checkout');
    }

    console.log('Sessão de checkout criada com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: error instanceof Error ? (error as any).code : undefined
    });
    throw error instanceof Error ? error : new Error('Falha ao criar sessão de checkout');
  }
}

export async function redirectToCheckout(productId: ProductId) {
  try {
    console.log('=== Iniciando redirecionamento para checkout ===');
    console.log('ProductId:', productId);

    const stripeInstance = await stripe;
    if (!stripeInstance) {
      console.error('Stripe não foi inicializado corretamente');
      throw new Error('Failed to load Stripe');
    }

    console.log('Stripe inicializado com sucesso');

    const priceId = products[productId]?.priceId;
    if (!priceId) {
      throw new Error(`Invalid product ID: ${productId}`);
    }

    console.log('PriceId encontrado:', priceId);
    const { sessionId } = await createCheckoutSession(priceId);
    
    if (!sessionId) {
      throw new Error('No session ID returned from checkout creation');
    }

    console.log('Redirecionando para checkout com sessionId:', sessionId);
    console.log('URL atual:', window.location.href);
    console.log('URL de sucesso:', `${window.location.origin}/success`);
    console.log('URL de cancelamento:', `${window.location.origin}/cancel`);

    const result = await stripeInstance.redirectToCheckout({ sessionId });
    
    if (result.error) {
      console.error('Stripe redirect error:', result.error);
      throw new Error(`Failed to redirect to checkout: ${result.error.message}`);
    }

    return result;
  } catch (error) {
    console.error('Error redirecting to checkout:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: error instanceof Error ? (error as any).code : undefined
    });
    throw error instanceof Error ? error : new Error('Failed to redirect to checkout');
  }
}