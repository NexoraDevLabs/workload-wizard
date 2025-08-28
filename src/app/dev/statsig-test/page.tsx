export default async function Page() {
  try {
    const { createFeatureFlag } = await import('@/flags');
    const enabled = await createFeatureFlag('my_first_gate')(); //Disabled by default, edit in the Statsig console
    return <div>myFeatureFlag is {enabled ? 'on' : 'off'}</div>;
  } catch {
    return <div>Feature flags not configured</div>;
  }
}
