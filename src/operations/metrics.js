'use strict';

class Metrics {
  constructor() { this.values = new Map(); }

  increment(name, labels = {}, value = 1) {
    const key = metricKey(name, labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  set(name, labels = {}, value) {
    this.values.set(metricKey(name, labels), value);
  }

  render() {
    return [...this.values.entries()].sort().map(([key, value]) => `${key} ${value}`).join('\n') + '\n';
  }
}

function metricKey(name, labels) {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('invalid metric name');
  const entries = Object.entries(labels).sort();
  for (const [key, value] of entries) {
    if (!/^[a-z][a-z0-9_]*$/.test(key) || !/^[A-Za-z0-9_.:-]{1,64}$/.test(String(value))) throw new Error('invalid metric label');
  }
  return entries.length ? `${name}{${entries.map(([key, value]) => `${key}="${value}"`).join(',')}}` : name;
}

module.exports = { Metrics };