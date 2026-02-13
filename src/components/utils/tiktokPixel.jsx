/**
 * TikTok Pixel Helper Functions
 * Pixel ID: D66VEQJC77U5P7UM15F0 (BLU ADV Corporate)
 */

const isBrowser = typeof window !== 'undefined';

// Generic track function
export const trackTikTokEvent = (eventName, params = {}) => {
  if (isBrowser && window.ttq) {
    window.ttq.track(eventName, params);
    console.log('🎯 TikTok Event:', eventName, params);
  }
};

// CompleteRegistration - User signup completed
export const trackCompleteRegistration = (userLang = 'it') => {
  trackTikTokEvent('CompleteRegistration', {
    content_language: userLang,
    currency: 'EUR',
    content_category: 'registration'
  });
};

// ViewContent - Quiz or subscription pages
export const trackViewContent = (contentCategory = 'quiz', userLang = 'it') => {
  trackTikTokEvent('ViewContent', {
    content_language: userLang,
    content_category: contentCategory,
    currency: 'EUR'
  });
};

// InitiateCheckout - User clicks "Buy" button
export const trackInitiateCheckout = (planPrice, userLang = 'it') => {
  trackTikTokEvent('InitiateCheckout', {
    content_language: userLang,
    currency: 'EUR',
    value: planPrice,
    content_category: 'subscription'
  });
};

// Purchase - Completed payment (server-side preferred)
export const trackPurchase = (amount, userLang = 'it') => {
  trackTikTokEvent('Purchase', {
    content_language: userLang,
    currency: 'EUR',
    value: amount,
    content_category: 'subscription'
  });
};