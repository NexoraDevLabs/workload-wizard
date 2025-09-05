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

async function createAlerts() {
  try {
    // Create P95 latency alert
    const p95AlertData = {
      name: 'API P95 Latency High',
      projects: [project],
      conditions: [
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          interval: '10m',
          value: 1,
        },
      ],
      filters: [
        {
          id: 'sentry.rules.filters.event_attribute.EventAttributeFilter',
          attribute: 'p95(transaction.duration)',
          match: 'gte',
          value: 1500, // 1.5 seconds
        },
        {
          id: 'sentry.rules.filters.event_attribute.EventAttributeFilter',
          attribute: 'transaction',
          match: 'contains',
          value: 'api:',
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event_service.NotifyEventServiceAction',
          service: 'slack',
          channel: '#alerts',
        },
      ],
      actionMatch: 'all',
      frequency: 5,
    };

    // Create error rate alert
    const errorRateAlertData = {
      name: 'High Error Rate',
      projects: [project],
      conditions: [
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          interval: '5m',
          value: 5,
        },
      ],
      filters: [
        {
          id: 'sentry.rules.filters.event_attribute.EventAttributeFilter',
          attribute: 'error',
          match: 'eq',
          value: 'true',
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event_service.NotifyEventServiceAction',
          service: 'slack',
          channel: '#alerts',
        },
      ],
      actionMatch: 'all',
      frequency: 5,
    };

    // Create database error alert
    const dbErrorAlertData = {
      name: 'Database Operation Errors',
      projects: [project],
      conditions: [
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          interval: '5m',
          value: 3,
        },
      ],
      filters: [
        {
          id: 'sentry.rules.filters.event_attribute.EventAttributeFilter',
          attribute: 'transaction',
          match: 'contains',
          value: 'db:',
        },
        {
          id: 'sentry.rules.filters.event_attribute.EventAttributeFilter',
          attribute: 'error',
          match: 'eq',
          value: 'true',
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event_service.NotifyEventServiceAction',
          service: 'slack',
          channel: '#alerts',
        },
      ],
      actionMatch: 'all',
      frequency: 5,
    };

    // Create the alerts
    const alerts = [
      { name: 'P95 Latency', data: p95AlertData },
      { name: 'Error Rate', data: errorRateAlertData },
      { name: 'Database Errors', data: dbErrorAlertData },
    ];

    for (const alert of alerts) {
      try {
        const response = await fetch(`https://sentry.io/api/0/projects/${org}/${project}/rules/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alert.data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`⚠️  Failed to create ${alert.name} alert: ${response.status} ${errorText}`);
        } else {
          const result = await response.json() as { id: string };
          console.log(`✅ ${alert.name} alert created successfully!`);
          console.log(`   Alert ID: ${result.id}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to create ${alert.name} alert:`, error);
      }
    }

    console.log('\n📊 Alert configuration complete!');
    console.log('Note: You may need to configure Slack integration in Sentry settings.');
  } catch (error) {
    console.error('❌ Failed to create alerts:', error);
    process.exit(1);
  }
}

void createAlerts();
