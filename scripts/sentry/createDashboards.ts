#!/usr/bin/env tsx

import fetch from 'node-fetch';

const org = process.env.SENTRY_ORG;
const project = process.env.SENTRY_PROJECT;
const token = process.env.SENTRY_AUTH_TOKEN;

if (!org || !project || !token) {
  console.error('Missing required environment variables:');
  console.error('- SENTRY_ORG');
  console.error('- SENTRY_PROJECT');
  console.error('- SENTRY_AUTH_TOKEN');
  process.exit(1);
}

async function createDashboard() {
  try {
    const dashboardData = {
      title: 'API & DB Observability - P95 Latency & Error Rate',
      widgets: [
        {
          title: 'API P95 Duration (ms)',
          interval: '5m',
          displayType: 'line',
          queries: [
            {
              name: 'P95 by endpoint',
              fields: ['p95(transaction.duration)'],
              aggregates: ['p95(transaction.duration)'],
              columns: ['transaction'],
              conditions: `event.type:transaction project:${project} transaction:*api*`,
              orderby: 'p95(transaction.duration)',
            },
          ],
        },
        {
          title: 'API Error Rate (%)',
          interval: '5m',
          displayType: 'line',
          queries: [
            {
              name: 'Error rate by endpoint',
              fields: ['failure_rate()'],
              aggregates: ['failure_rate()'],
              columns: ['transaction'],
              conditions: `event.type:transaction project:${project} transaction:*api*`,
              orderby: 'failure_rate()',
            },
          ],
        },
        {
          title: 'DB Operations P95 Duration (ms)',
          interval: '5m',
          displayType: 'line',
          queries: [
            {
              name: 'DB P95 by operation',
              fields: ['p95(transaction.duration)'],
              aggregates: ['p95(transaction.duration)'],
              columns: ['transaction'],
              conditions: `event.type:transaction project:${project} transaction:*db*`,
              orderby: 'p95(transaction.duration)',
            },
          ],
        },
        {
          title: 'Overall Error Rate (%)',
          interval: '5m',
          displayType: 'line',
          queries: [
            {
              name: 'Overall error rate',
              fields: ['failure_rate()'],
              aggregates: ['failure_rate()'],
              columns: [],
              conditions: `event.type:transaction project:${project}`,
              orderby: 'failure_rate()',
            },
          ],
        },
        {
          title: 'Request Volume by Endpoint',
          interval: '5m',
          displayType: 'table',
          queries: [
            {
              name: 'Request count by endpoint',
              fields: ['count()'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: `event.type:transaction project:${project} transaction:*api*`,
              orderby: '-count()',
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://sentry.io/api/0/organizations/${org}/dashboards/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboardData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create dashboard: ${response.status} ${errorText}`
      );
    }

    const result = (await response.json()) as { id: string };
    console.log('✅ Dashboard created successfully!');
    console.log(`Dashboard ID: ${result.id}`);
    console.log(
      `Dashboard URL: https://sentry.io/organizations/${org}/dashboards/${result.id}/`
    );
  } catch (error) {
    console.error('❌ Failed to create dashboard:', error);
    process.exit(1);
  }
}

void createDashboard();
