export const products = {
  monthly: {
    priceId: 'price_1RGBJECigeIHczBwvN12xYmz',
    name: 'Plano de Assinatura Personalizado Mensal',
    description: 'Plano de Assinatura Personalizado Mensal',
    mode: 'subscription' as const
  },
  annual: {
    priceId: 'price_1RGBJSCigeIHczBwQ2Ej4Axl',
    name: 'Plano de Assinatura Personalizado Anual',
    description: 'Plano de Assinatura Personalizado Anual',
    mode: 'subscription' as const
  }
} as const;

export type ProductId = keyof typeof products;