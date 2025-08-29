'use client';

import { useGateValue } from '@statsig/react-bindings';

export default function CheckGate() {
  const gate = useGateValue('my_gate');

  return <div>Gate Value: {gate ? 'PASSED' : 'FAILED'}</div>;
}
