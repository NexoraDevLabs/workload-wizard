import posthog from "posthog-js";

/**
 * Enhanced Analytics Service with PostHog integration
 * Provides comprehensive tracking capabilities for user behavior, performance, and business metrics
 */
export class AnalyticsService {
  private isInitialized: boolean;

  constructor() {
    this.isInitialized =
      typeof posthog !== "undefined" && typeof posthog.capture === "function";
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
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      if (posthog.people) {
        posthog.people.set(properties);
      }
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("$pageview", {
        $current_url: path,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
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
    properties?: Record<string, any>,
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("performance_metric", {
        metric_name: metricName,
        metric_value: value,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("error_occurred", {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (trackingError) {
      // Silent fail for analytics
    }
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("user_action", {
        action_name: action,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track session start
   */
  trackSessionStart(properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("session_started", {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track session end
   */
  trackSessionEnd(properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("session_ended", {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track form interactions
   */
  trackFormStart(formName: string, properties?: Record<string, any>): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("form_started", {
        form_name: formName,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track form submission
   */
  trackFormSubmit(
    formName: string,
    success: boolean,
    properties?: Record<string, any>,
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("form_submitted", {
        form_name: formName,
        form_success: success,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track navigation events
   */
  trackNavigation(
    from: string,
    to: string,
    properties?: Record<string, any>,
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("navigation", {
        from_page: from,
        to_page: to,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Track search queries
   */
  trackSearch(
    query: string,
    resultsCount?: number,
    properties?: Record<string, any>,
  ): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.capture("search_performed", {
        search_query: query,
        results_count: resultsCount,
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(): Record<string, any> {
    if (!this.checkInitialization()) return {};

    try {
      return {
        distinct_id: posthog.get_distinct_id(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      };
    } catch (error) {
      // Silent fail for analytics
      return {};
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, any> {
    if (!this.checkInitialization()) return {};

    try {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      return {
        page_load_time: navigation?.loadEventEnd - navigation?.loadEventStart,
        dom_content_loaded:
          navigation?.domContentLoadedEventEnd -
          navigation?.domContentLoadedEventStart,
        first_paint: performance.getEntriesByName("first-paint")[0]?.startTime,
        first_contentful_paint: performance.getEntriesByName(
          "first-contentful-paint",
        )[0]?.startTime,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      };
    } catch (error) {
      // Silent fail for analytics
      return {};
    }
  }

  /**
   * Reset user identity
   */
  reset(): void {
    if (!this.checkInitialization()) return;

    try {
      posthog.reset();
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      // Silent fail for analytics
    }
  }
}

// Export a default instance for convenience
export const analytics = new AnalyticsService();

// Export the class for custom instances
export default AnalyticsService;
