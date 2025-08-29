'use client';

import { useExperiment, useLayer } from '@statsig/react-bindings';

export function LayerExample() {
  const layer = useLayer('my_experiment_layer');
  return <div>Title: {layer.get('title', 'Fallback Title')}</div>;
}

export function ExperimentExample() {
  const experiment = useExperiment('my_experiment');
  return <div>Title: {experiment.get('title', 'Fallback Title')}</div>;
}
