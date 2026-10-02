import { ChromeBookmarkNode, Bookmark, Section } from '../types';

export const isChromeExtension = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
};

export const hasChromeBookmarksPermission = async (): Promise<boolean> => {
  if (!isChromeExtension() || !chrome.bookmarks) return false;
  return true;
};

// Fetch real Chrome bookmarks tree
export async function getChromeBookmarksTree(): Promise<ChromeBookmarkNode[]> {
  if (!isChromeExtension() || !chrome.bookmarks) {
    // Return sample structure for web preview / mock
    return [
      {
        id: 'mock-1',
        title: 'Chrome Bookmarks Bar',
        children: [
          { id: 'b1', title: 'GitHub', url: 'https://github.com' },
          { id: 'b2', title: 'Hacker News', url: 'https://news.ycombinator.com' },
          {
            id: 'f1',
            title: 'Development Tools',
            children: [
              { id: 'b3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
              { id: 'b4', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
              { id: 'b5', title: 'React Documentation', url: 'https://react.dev' },
            ],
          },
          {
            id: 'f2',
            title: 'Design Inspiration',
            children: [
              { id: 'b6', title: 'Awwwards', url: 'https://awwwards.com' },
              { id: 'b7', title: 'Godly Websites', url: 'https://godly.website' },
            ],
          },
        ],
      },
    ];
  }

  return new Promise((resolve) => {
    (chrome.bookmarks.getTree as any)((tree: any) => {
      resolve(tree as unknown as ChromeBookmarkNode[]);
    });
  });
}

// Convert Chrome bookmark tree nodes to MySpace Sections and Bookmarks
export function convertChromeBookmarks(
  nodes: ChromeBookmarkNode[],
  workspaceId: string
): { sections: Section[]; bookmarks: Bookmark[] } {
  const sections: Section[] = [];
  const bookmarks: Bookmark[] = [];

  let sectionOrder = 100;
  let bookmarkOrder = 100;

  function traverse(node: ChromeBookmarkNode, currentSectionId?: string) {
    if (node.url) {
      // It's a bookmark
      bookmarks.push({
        id: `bm-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workspaceId,
        sectionId: currentSectionId || 'sec-imported-general',
        title: node.title || 'Untitled Bookmark',
        url: node.url,
        isFavorite: false,
        clickCount: 0,
        order: bookmarkOrder++,
        createdAt: Date.now(),
        lastUsedAt: 0,
      });
    } else if (node.children && node.children.length > 0) {
      // It's a folder: if it has non-folder items or subfolders, consider creating a section
      const hasBookmarks = node.children.some((c) => !!c.url);
      let targetSecId = currentSectionId;

      // Only create new section if it's not root container
      if (node.title && node.title !== 'Bookmarks Bar' && node.title !== 'Other Bookmarks') {
        targetSecId = `sec-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        sections.push({
          id: targetSecId,
          workspaceId,
          name: node.title,
          icon: 'Folder',
          color: '#6366f1',
          layout: 'grid',
          order: sectionOrder++,
          createdAt: Date.now(),
        });
      }

      for (const child of node.children) {
        traverse(child, targetSecId);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  // If general bookmarks were created with fallback section, make sure that section exists
  const hasFallbackBookmarks = bookmarks.some((b) => b.sectionId === 'sec-imported-general');
  if (hasFallbackBookmarks && !sections.some((s) => s.id === 'sec-imported-general')) {
    sections.unshift({
      id: 'sec-imported-general',
      workspaceId,
      name: 'Imported Bookmarks',
      icon: 'Bookmark',
      color: '#3b82f6',
      layout: 'grid',
      order: 99,
      createdAt: Date.now(),
    });
  }

  return { sections, bookmarks };
}

// Clean navigation handler
export function openDestinationUrl(url: string, inNewTab: boolean = true) {
  const formattedUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('chrome://')
    ? url
    : `https://${url}`;

  if (inNewTab) {
    if (isChromeExtension() && chrome?.tabs?.create) {
      chrome.tabs.create({ url: formattedUrl });
    } else {
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }
  } else {
    window.location.href = formattedUrl;
  }
}

// Get current active tab title and URL if available
export async function getCurrentActiveTab(): Promise<{ title?: string; url?: string } | null> {
  if (isChromeExtension() && chrome?.tabs?.query) {
    return new Promise((resolve) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].url) {
            resolve({ title: tabs[0].title, url: tabs[0].url });
          } else {
            resolve(null);
          }
        });
      } catch {
        resolve(null);
      }
    });
  }
  return null;
}

