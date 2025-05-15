import React, { useState, useEffect } from 'react';
import { Mail, Phone, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionFormProps {
  userName: string;
  onSubmit: (data: { email: string; whatsapp: string; fingerprint: string }) => Promise<void>;
  defaultEmail?: string;
  defaultWhatsapp?: string;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ 
  userName, 
  onSubmit,
  defaultEmail = '',
  defaultWhatsapp = ''
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp);
  const [emailError, setEmailError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  console.log('Initial State - Email:', email);
  console.log('Initial State - WhatsApp:', whatsapp);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        // Primeiro tenta pegar do localStorage
        const storedFingerprint = localStorage.getItem('fingerprint');
        if (storedFingerprint) {
          console.log('Fingerprint encontrado no localStorage:', storedFingerprint);
          setFingerprint(storedFingerprint);
          return;
        }

        // Se não encontrar, tenta gerar um novo
        const { getFingerprint } = await import('../lib/fingerprint');
        const fp = await getFingerprint();
        console.log('Novo fingerprint gerado:', fp);
        localStorage.setItem('fingerprint', fp);
        setFingerprint(fp);
      } catch (error) {
        console.error('Erro ao inicializar fingerprint:', error);
        setSubmitError('Erro ao identificar sua sessão. Por favor, recarregue a página.');
      }
    };

    initFingerprint();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWhatsapp = (number: string) => {
    const whatsappRegex = /^\(\d{2}\)\s\d{5}-\d{4}$/;
    return whatsappRegex.test(number);
  };

  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const cleanWhatsappNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return `55${cleaned}`;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatWhatsapp(e.target.value);
    setWhatsapp(formattedNumber);
    setWhatsappError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    if (!fingerprint) {
      setSubmitError('Erro ao identificar sua sessão. Por favor, recarregue a página.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Validação dos campos
      if (!email || !whatsapp) {
        setSubmitError('Por favor, preencha todos os campos.');
        setIsSubmitting(false);
        return;
      }

      if (!validateEmail(email)) {
        setEmailError('Por favor, insira um email válido.');
        setIsSubmitting(false);
        return;
      }

      if (!validateWhatsapp(whatsapp)) {
        setWhatsappError('Por favor, insira um número válido.');
        setIsSubmitting(false);
        return;
      }

      console.log('Iniciando submissão do formulário com fingerprint:', fingerprint);
      
      // Primeiro, verifica se existe um lead com este fingerprint
      const { data: existingLeads, error: searchError } = await supabase
        .from('leads')
        .select('*')
        .eq('fingerprint', fingerprint)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Erro ao buscar lead:', searchError);
        throw new Error('Erro ao verificar seus dados. Por favor, tente novamente.');
      }

      if (!existingLeads) {
        setSubmitError('Não foi possível encontrar seus dados. Por favor, reinicie o questionário.');
        setIsSubmitting(false);
        return;
      }

      // Limpa o número do WhatsApp antes de enviar
      const cleanedWhatsapp = cleanWhatsappNumber(whatsapp);

      // Se encontrou o lead, atualiza com o email e whatsapp
      const { error: updateError } = await supabase
        .from('leads')
        .update({ email, whatsapp: cleanedWhatsapp })
        .eq('fingerprint', fingerprint);

      if (updateError) {
        console.error('Erro ao atualizar lead:', updateError);
        throw new Error('Erro ao salvar seus dados. Por favor, tente novamente.');
      }

      // Chama a função onSubmit passada como prop com o número limpo
      await onSubmit({ email, whatsapp: cleanedWhatsapp, fingerprint });
      
      console.log('Formulário submetido com sucesso');
      
      // Limpa os campos após sucesso
      setEmail('');
      setWhatsapp('');
      setEmailError('');
      setWhatsappError('');

    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      setSubmitError(error instanceof Error ? error.message : 'Ocorreu um erro ao enviar seus dados. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {userName}, seu plano está pronto!
          </h1>
          <p className="text-gray-600">
            Preencha seus dados para receber seu plano alimentar personalizado
          </p>
        </div>

        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-center ${
                  emailError ? 'border-red-500' : 'border-gray-200'
                } focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all duration-200`}
                placeholder="seu@email.com"
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              WhatsApp
            </label>
            <div className="relative">
              <input
                type="tel"
                value={whatsapp}
                onChange={handleWhatsappChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-center ${
                  whatsappError ? 'border-red-500' : 'border-gray-200'
                } focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all duration-200`}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
              <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            {whatsappError && <p className="mt-1 text-sm text-red-500">{whatsappError}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 
                     transition-colors duration-200 flex items-center justify-center gap-2 
                     font-semibold ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>Receber Meu Plano</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-blue-800 text-center">
              Seus dados estão seguros e não serão compartilhados com terceiros
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionForm;