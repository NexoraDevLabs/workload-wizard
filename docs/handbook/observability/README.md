# Observability Handbook

This handbook provides comprehensive guides for monitoring, debugging, and maintaining the health of WorkloadWizard through distributed tracing, performance dashboards, and proactive alerting.

Our observability stack enables you to trace requests from API routes through Convex operations, visualise performance trends in real-time dashboards, and respond quickly to issues with well-defined alert thresholds and ownership.

## Quick Links

- **[Traces Guide](./traces.md)** — How to instrument, trace, and debug performance issues
- **[Dashboards Guide](./dashboards.md)** — Creating and interpreting performance dashboards
- **[Bundle Reports Guide](./bundle-reports.md)** — Analysing bundle size and optimisation opportunities
- **[Alerts & Ownership](./alerts-and-ownership.md)** — Alert thresholds, routing, and response procedures

## Overview

WorkloadWizard uses a comprehensive observability stack built on OpenTelemetry, Sentry, and Vercel Speed Insights. This enables:

- **Distributed Tracing**: Track requests across API routes, Convex functions, and client-side operations
- **Performance Monitoring**: Real-time dashboards showing P95/P99 latencies, error rates, and Core Web Vitals
- **Proactive Alerting**: Automated alerts with clear ownership and escalation procedures
- **Bundle Analysis**: Regular analysis of client and server bundle sizes to prevent performance regressions

All observability data flows through a unified pipeline, making it easy to correlate issues across the entire application stack.
