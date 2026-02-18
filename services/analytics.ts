
/**
 * Utility for Google Analytics Event Tracking
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export const trackPageView = (pageName: string) => {
  if (window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_title: pageName,
      page_path: `/${pageName.toLowerCase()}`,
    });
  }
};
