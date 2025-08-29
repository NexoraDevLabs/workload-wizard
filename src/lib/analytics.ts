import posthog from 'posthog-js';

// Define proper types for analytics properties
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  fullName?: string;
  email?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface PerformanceMetrics {
  page_load_time?: number;
  dom_content_loaded?: number;
  first_paint?: number;
  first_contentful_paint?: number;
  timestamp: string;
  environment: string;
}

export interface SessionMetrics {
  distinct_id?: string;
  timestamp: string;
  environment: string;
}

/**
 * Enhanced Analytics Service with PostHog integration
 * Provides comprehensive tracking capabilities for user behavior, performance, and business metrics
 */
export class AnalyticsService {
  private isInitialized: boolean;

  constructor() {
    this.isInitialized =
      typeof posthog !== 'undefined' && typeof posthog.capture === 'function';
  }

  /**
   * Check if PostHog is available and initialized
   */
  private checkInitialization(): boolean {
    if (!this.isInitialized) {
      return false;
    }
    return true;
  }

  /**
   * Identify a user with PostHog
   */
  identify(userId: string, properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.identify(userId, properties);
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.checkInitialization()) return;

    try {
      if (posthog.people) {
        posthog.people.set(properties);
      }
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('$pageview', {
        $current_url: path,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  // Feature flags removed; no tracking helper

  /**
   * Track performance metrics
   */
  trackPerformance(
    metricName: string,
    value: number,
    properties?: AnalyticsProperties
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('performance_metric', {
        metric_name: metricName,
        metric_value: value,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('error_occurred', {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('user_action', {
        action_name: action,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track session start
   */
  trackSessionStart(properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('session_started', {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track session end
   */
  trackSessionEnd(properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('session_ended', {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track form interactions
   */
  trackFormStart(formName: string, properties?: AnalyticsProperties): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('form_started', {
        form_name: formName,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track form submission
   */
  trackFormSubmit(
    formName: string,
    success: boolean,
    properties?: AnalyticsProperties
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('form_submitted', {
        form_name: formName,
        form_success: success,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track navigation events
   */
  trackNavigation(
    from: string,
    to: string,
    properties?: AnalyticsProperties
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('navigation', {
        from_page: from,
        to_page: to,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Track search queries
   */
  trackSearch(
    query: string,
    resultsCount?: number,
    properties?: AnalyticsProperties
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture('search_performed', {
        search_query: query,
        results_count: resultsCount,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(): SessionMetrics {
    if (!this.checkInitialization()) return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    try {
      return {
        distinct_id: posthog.get_distinct_id(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    } catch {
      // Silent fail for analytics
      return {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (!this.checkInitialization()) return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      return {
        page_load_time: navigation?.loadEventEnd - navigation?.loadEventStart,
        dom_content_loaded:
          navigation?.domContentLoadedEventEnd -
          navigation?.domContentLoadedEventStart,
        first_paint: performance.getEntriesByName('first-paint')[0]?.startTime,
        first_contentful_paint: performance.getEntriesByName(
          'first-contentful-paint'
        )[0]?.startTime,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    } catch {
      // Silent fail for analytics
      return {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }

  /**
   * Reset user identity
   */
  reset(): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.reset();
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Opt out of tracking
   */
  optOut(): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.opt_out_capturing();
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Opt in to tracking
   */
  optIn(): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.opt_in_capturing();
    } catch {
      // Silent fail for analytics
    }
  }
}

// Export a default instance for convenience
export const analytics = new AnalyticsService();

// Export the class for custom instances
export default AnalyticsService;
