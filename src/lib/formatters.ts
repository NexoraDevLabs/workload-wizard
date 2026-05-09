export function toDisplayLabel(value: string | null | undefined) {
    if (!value) return '—';
  
    return value
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }