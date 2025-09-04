#!/usr/bin/env node

/**
 * Benchmark script for Convex listing operations
 * Measures performance of various query patterns
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  opsPerSecond: number;
}

function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  iterations = 1000
): Promise<BenchmarkResult> {
  return new Promise<BenchmarkResult>((resolve) => {
    queueMicrotask(() => {
      void (async () => {
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
          await fn();
        }

        const end = performance.now();
        const totalTime = end - start;
        const avgTime = totalTime / iterations;
        const opsPerSecond = 1000 / avgTime;

        resolve({
          operation: name,
          iterations,
          totalTime,
          avgTime,
          opsPerSecond,
        });
      })();
    });
  });
}

async function runBenchmarks(): Promise<void> {
  console.log('Starting Convex Listing Benchmarks...\n');

  // Mock operations for demonstration
  const results: BenchmarkResult[] = [];

  // Benchmark array filtering
  results.push(
    await benchmark(
      'Array.filter',
      () => {
        const arr = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          active: i % 2 === 0,
        }));
        arr.filter((item) => item.active);
      },
      100
    )
  );

  // Benchmark object property access
  results.push(
    await benchmark(
      'Object property access',
      () => {
        const obj = { name: 'test', value: 123, nested: { deep: 'value' } };
        const _name = obj.name;
        const _deep = obj.nested.deep;
      },
      10000
    )
  );

  // Benchmark string operations
  results.push(
    await benchmark(
      'String operations',
      () => {
        const str = 'Hello, World!';
        str.toLowerCase().includes('world');
      },
      10000
    )
  );

  // Print results
  console.log('Benchmark Results:');
  console.log('==================');

  for (const result of results) {
    console.log(`${result.operation}:`);
    console.log(`  Iterations: ${result.iterations}`);
    console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`  Average time: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Ops/second: ${result.opsPerSecond.toFixed(0)}`);
    console.log('');
  }

  console.log('Benchmarks completed successfully!');
}

// Run the benchmarks
if (require.main === module) {
  runBenchmarks().catch((error: unknown) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

export { benchmark, runBenchmarks };
export type { BenchmarkResult };
