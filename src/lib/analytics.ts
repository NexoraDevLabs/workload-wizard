type AnalyticsProperties = Record<string, unknown>;

export class AnalyticsService {
  track(_eventName: string, _properties?: AnalyticsProperties): void {
    return undefined;
  }

  identify(_userId: string, _properties?: AnalyticsProperties): void {
    return undefined;
  }

  setUserProperties(_properties: AnalyticsProperties): void {
    return undefined;
  }

  trackPageView(_path?: string, _properties?: AnalyticsProperties): void {
    return undefined;
  }

  trackPerformanceMetric(
    _metricName: string,
    _value: number,
    _properties?: AnalyticsProperties
  ): void {
    return undefined;
  }

  trackError(_error: Error | string, _properties?: AnalyticsProperties): void {
    return undefined;
  }

  trackUserAction(_action: string, _properties?: AnalyticsProperties): void {
    return undefined;
  }

  startSession(_properties?: AnalyticsProperties): void {
    return undefined;
  }

  endSession(_properties?: AnalyticsProperties): void {
    return undefined;
  }

  trackFormStart(_formName: string, _properties?: AnalyticsProperties): void {
    return undefined;
  }

  trackFormSubmit(
    _formName: string,
    _success: boolean,
    _properties?: AnalyticsProperties
  ): void {
    return undefined;
  }

  trackNavigation(
    _from: string,
    _to: string,
    _properties?: AnalyticsProperties
  ): void {
    return undefined;
  }

  trackSearch(
    _query: string,
    _resultsCount?: number,
    _properties?: AnalyticsProperties
  ): void {
    return undefined;
  }

  getSessionInfo(): AnalyticsProperties {
    return {};
  }

  reset(): void {
    return undefined;
  }

  optOut(): void {
    return undefined;
  }

  optIn(): void {
    return undefined;
  }
}

export const analytics = new AnalyticsService();

export default AnalyticsService;
