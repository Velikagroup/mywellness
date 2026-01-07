import { base44 } from '@/api/base44Client';

const REMEMBER_ME_KEY = 'mw_remember_token';

export const rememberMeManager = {
  // Salva token dopo login
  async saveToken() {
    try {
      const response = await base44.functions.invoke('generateRememberMeToken');
      if (response.data.success) {
        localStorage.setItem(REMEMBER_ME_KEY, response.data.token);
        console.log('✅ Remember Me token saved');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving remember me token:', error);
      return false;
    }
  },

  // Verifica token all'avvio
  async checkToken() {
    try {
      const token = localStorage.getItem(REMEMBER_ME_KEY);
      if (!token) {
        return { valid: false };
      }

      const response = await base44.functions.invoke('validateRememberMeToken', { token });
      
      if (response.data.valid) {
        console.log('✅ Remember Me token valid');
        return { valid: true, user: response.data.user };
      } else {
        // Token non valido, rimuovi
        localStorage.removeItem(REMEMBER_ME_KEY);
        return { valid: false };
      }
    } catch (error) {
      console.error('Error checking remember me token:', error);
      localStorage.removeItem(REMEMBER_ME_KEY);
      return { valid: false };
    }
  },

  // Rimuovi token al logout
  clearToken() {
    localStorage.removeItem(REMEMBER_ME_KEY);
    console.log('✅ Remember Me token cleared');
  }
};