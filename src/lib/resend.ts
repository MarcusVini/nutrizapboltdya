import { Resend } from 'resend';

if (!import.meta.env.VITE_RESEND_API_KEY) {
  throw new Error('VITE_RESEND_API_KEY is not defined');
}

export const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
export const FROM_EMAIL = 'noreply@resend.dev';
export const REPLY_TO = 'noreply@resend.dev';

export const resend = new Resend(RESEND_API_KEY); 