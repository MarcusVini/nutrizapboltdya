import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY, FROM_EMAIL, TEMPLATE_ID } from '../config/sendgrid';

sgMail.setApiKey(SENDGRID_API_KEY);

interface EmailData {
  name: string;
  email: string;
  quizResults: any; // Você pode definir uma interface específica para os resultados do quiz
}

export const sendQuizResults = async (data: EmailData) => {
  try {
    const msg = {
      to: data.email,
      from: FROM_EMAIL,
      templateId: TEMPLATE_ID,
      dynamicTemplateData: {
        lead_name: data.name,
        results: data.quizResults,
      },
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export function generateReportEmail(reportData: any) {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .metric { margin-bottom: 20px; }
          .alert { color: #721c24; background: #f8d7da; padding: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Relatório de Performance</h2>
          <p>Período: ${reportData.period.start} a ${reportData.period.end}</p>
          
          <div class="metric">
            <h3>Métricas Principais</h3>
            <ul>
              <li>Visualizações: ${reportData.metrics.pageViews}</li>
              <li>Visitantes Únicos: ${reportData.metrics.uniqueVisitors}</li>
              <li>Taxa de Conversão: ${reportData.metrics.conversionRate}</li>
              <li>Receita: ${reportData.metrics.revenue}</li>
            </ul>
          </div>

          ${reportData.alerts.length > 0 ? `
            <div class="alert">
              <h3>⚠️ Alertas</h3>
              <ul>
                ${reportData.alerts.map((alert: any) => `
                  <li>${alert.message}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
} 