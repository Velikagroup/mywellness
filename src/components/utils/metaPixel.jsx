/**
 * Meta Pixel tracking helper
 */

export const trackMetaEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
    console.log(`📊 Meta Pixel: ${eventName}`, params);
  }
};

export const trackCompleteRegistration = (language) => {
  trackMetaEvent('CompleteRegistration', {
    content_language: language
  });
};

export const trackViewContent = (contentType, language) => {
  trackMetaEvent('ViewContent', {
    content_type: contentType,
    content_language: language
  });
};

export const trackInitiateCheckout = (language, value, currency = 'EUR') => {
  trackMetaEvent('InitiateCheckout', {
    content_language: language,
    value: value,
    currency: currency
  });
};

export const trackStartTrial = (language, value = 0, currency = 'EUR') => {
  trackMetaEvent('StartTrial', {
    content_language: language,
    value: value,
    currency: currency,
    predicted_ltv: value
  });
};

export const trackSubscribe = (language, value, currency = 'EUR') => {
  trackMetaEvent('Subscribe', {
    content_language: language,
    value: value,
    currency: currency,
    predicted_ltv: value
  });
};

export const trackPurchase = (language, value, currency = 'EUR') => {
  trackMetaEvent('Purchase', {
    content_language: language,
    value: value,
    currency: currency
  });
};