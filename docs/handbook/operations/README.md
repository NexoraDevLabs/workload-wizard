# Operations Handbook

This handbook contains Standard Operating Procedures (SOPs) and operational guidelines for the WorkloadWizard platform. These procedures ensure consistent, reliable, and secure operations across all environments.

## 📋 Standard Operating Procedures

### Security & Incident Response

- **[Vulnerability Intake & Response](sop-vulnerability-intake.md)** - Process for handling security vulnerabilities, from initial report to resolution
- **[Incident Response & Management](sop-incident-response.md)** - Comprehensive incident response procedures for production issues
- **[Secret Rotation & Management](sop-secret-rotation.md)** - Secure rotation of API keys, tokens, and credentials across all services

### Development & CI/CD

- **[CI Failure Triage & Resolution](sop-ci-failure-triage.md)** - Systematic approach to investigating and fixing CI/CD pipeline failures

## 🎯 Tabletop Exercises

- **[CI Failure Secrets Drill](tabletop/ci-failure-secrets-drill.md)** - Simulated exercise for CI failures caused by expired secrets (includes simulated results and live exercise plan)

## 🏗️ Architecture Overview

WorkloadWizard operates on the following technology stack:

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Convex (real-time database)
- **Authentication**: WorkOS
- **Analytics**: PostHog (session replays & heatmaps)
- **Deployment**: Vercel
- **Caching**: Upstash/Redis
- **Feature Flags**: Statsig
- **CI/CD**: GitHub Actions

## 🚨 Emergency Contacts

| Role                   | Contact          | Availability   |
| ---------------------- | ---------------- | -------------- |
| **Incident Commander** | @platform-team   | 24/7           |
| **Platform Owner**     | @platform-team   | Business hours |
| **On-call Engineer**   | @oncall-rotation | 24/7           |
| **Security Lead**      | @security-team   | Business hours |
| **Comms Lead**         | @comms-team      | Business hours |

## 📊 Service Level Agreements

### Response Times

| Severity     | Triage            | Mitigation       | Resolution        |
| ------------ | ----------------- | ---------------- | ----------------- |
| **P0/SEV-1** | ≤ 4 hours         | ≤ 4 hours        | ≤ 24 hours        |
| **P1/SEV-2** | ≤ 1 business day  | ≤ 1 business day | ≤ 3 business days |
| **P2/SEV-3** | ≤ 3 business days | ≤ 1 week         | Next sprint       |
| **P3/SEV-4** | ≤ 1 week          | N/A              | Monthly review    |

### CI/CD Targets

| Failure Type          | Acknowledge  | Fix        | Escalation |
| --------------------- | ------------ | ---------- | ---------- |
| **P1 (Blocking)**     | ≤ 15 minutes | ≤ 4 hours  | ≤ 1 hour   |
| **P2 (Non-blocking)** | ≤ 1 hour     | ≤ 8 hours  | ≤ 4 hours  |
| **P3 (Cosmetic)**     | ≤ 4 hours    | ≤ 24 hours | N/A        |

## 🔧 Tools & Resources

### Monitoring & Observability

- **PostHog**: User analytics, session recordings, feature flags
- **Vercel Analytics**: Frontend performance and usage metrics
- **Convex Dashboard**: Database monitoring and function logs

### Communication

- **GitHub Issues**: Incident tracking, vulnerability reports, secret rotations
- **Slack/Teams**: Real-time communication during incidents
- **Status Page**: External communication for user-facing issues

### Documentation

- **GitHub**: Code, issues, pull requests, workflows
- **Convex Dashboard**: Database schema, function definitions
- **Vercel Dashboard**: Deployment history, environment variables

## 📚 Related Documentation

- **[Disaster Recovery](../operations/dr/)** - Backup and restore procedures
- **[Security](../security/)** - Security policies and threat models
- **[Engineering](../engineering/)** - Development guidelines and best practices
- **[Observability](../observability/)** - Monitoring and alerting setup

## 🔄 Process Improvement

### Review Schedule

- **Weekly**: Incident trends and CI failure patterns
- **Monthly**: SOP effectiveness and tooling assessment
- **Quarterly**: Full operational process review
- **Annually**: Security and compliance audit

### Feedback & Updates

- **Issues**: Report process gaps or improvement suggestions via GitHub Issues
- **PRs**: Submit improvements to SOPs via pull requests
- **Discussions**: Use GitHub Discussions for process questions

## 📝 Change History

| Date       | Author        | Summary                                       |
| ---------- | ------------- | --------------------------------------------- |
| 2024-01-15 | Platform Team | Initial handbook creation with four core SOPs |
