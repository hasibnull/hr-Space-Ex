// Formatting utilities

export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Good Morning', emoji: '☀️' };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'Good Afternoon', emoji: '🌤️' };
  } else if (hour >= 17 && hour < 22) {
    return { text: 'Good Evening', emoji: '🌙' };
  } else {
    return { text: 'Good Night', emoji: '🌌' };
  }
}

export function formatDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

export function formatTime(
  date: Date = new Date(),
  format: '12h' | '24h' = '12h',
  showSeconds: boolean = true
): { timeStr: string; period?: string } {
  if (format === '24h') {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const timeStr = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
    return { timeStr };
  } else {
    let hours = date.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = String(hours);
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const timeStr = showSeconds ? `${hoursStr}:${minutes}:${seconds}` : `${hoursStr}:${minutes}`;
    return { timeStr, period };
  }
}

export function isLikelyUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes(' ')) return false;

  // Has scheme
  if (/^[a-zA-Z]+:\/\//.test(trimmed)) return true;

  // localhost or IP
  if (/^localhost(:\d+)?$/.test(trimmed) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(trimmed)) {
    return true;
  }

  // Domain like example.com or sub.example.org/path
  const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  return domainPattern.test(trimmed);
}

export function buildSearchUrl(query: string, engine: string): string {
  const encoded = encodeURIComponent(query);
  switch (engine) {
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${encoded}`;
    case 'bing':
      return `https://www.bing.com/search?q=${encoded}`;
    case 'brave':
      return `https://search.brave.com/search?q=${encoded}`;
    case 'ecosia':
      return `https://www.ecosia.org/search?q=${encoded}`;
    case 'google':
    default:
      return `https://www.google.com/search?q=${encoded}`;
  }
}
