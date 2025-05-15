export const GTM_ID = 'GTM-NR7QMFFN';

type WindowWithDataLayer = Window & {
  dataLayer: Record<string, any>[];
};

declare const window: WindowWithDataLayer;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined') {
    window.dataLayer.push({
      event: 'pageview',
      page: url,
    });
  }
};

export const trackEvent = ({
  event,
  category,
  action,
  label,
  value,
  ...rest
}: {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer.push({
      event,
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value,
      ...rest,
    });
  }
};

// Eventos específicos do Quiz
export const quizEvents = {
  start: () => trackEvent({ 
    event: 'quiz_start',
    category: 'Quiz',
    action: 'Start'
  }),
  
  answer: (questionId: string, answer: string | number) => {
    const value = typeof answer === 'string' ? parseFloat(answer) || undefined : answer;
    return trackEvent({
      event: 'quiz_answer',
      category: 'Quiz',
      action: 'Answer',
      label: questionId,
      value: value
    });
  },
  
  complete: (score: number) => trackEvent({
    event: 'quiz_complete',
    category: 'Quiz',
    action: 'Complete',
    value: score
  }),
  
  leadCapture: (type: 'email' | 'whatsapp') => trackEvent({
    event: 'lead_capture',
    category: 'Lead',
    action: 'Capture',
    label: type
  }),
  
  conversion: (type: string, value?: number) => trackEvent({
    event: 'conversion',
    category: 'Conversion',
    action: type,
    value: value
  })
}; 