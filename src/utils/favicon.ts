// Robust favicon resolution strategies

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function getFaviconUrl(urlStr: string, customFavicon?: string): string {
  if (customFavicon && customFavicon.trim().length > 0) {
    return customFavicon;
  }

  const domain = extractDomain(urlStr);

  // Chrome Extension favicon API if running in unpacked extension
  try {
    if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(
        urlStr.startsWith('http') ? urlStr : `https://${urlStr}`
      )}&size=64`;
    }
  } catch {
    // Fall back to external services
  }

  // Google Favicon service
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// Generate a deterministic soft pastel/accent color from a string
export function getInitialColor(str: string): string {
  const colors = [
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
