// MySpace Chrome Extension Background Service Worker (Manifest V3)
// Complete Unified Browser Toolkit Controller & Stability Engine

// =========================================================================
// 0. CENTRALIZED LOGGER & CONCURRENCY CONTROLLER
// =========================================================================

const logger = {
  info: (tag, ...args) => console.log(`[MySpace][${tag}]`, ...args),
  warn: (tag, ...args) => console.warn(`[MySpace][${tag}]`, ...args),
  error: (tag, ...args) => console.error(`[MySpace][${tag}]`, ...args),
};

// Concurrency locks to prevent duplicate tool execution
const activeCaptures = new Set();

// Rate limiter for chrome.tabs.captureVisibleTab (Chrome limit: max 2 calls / sec)
let lastCaptureTimestamp = 0;
const MIN_CAPTURE_GAP_MS = 600; // Safe threshold ensuring <= 1.66 calls / sec

async function rateLimitedCaptureVisibleTab(windowId, options = { format: 'png' }) {
  const now = Date.now();
  const elapsed = now - lastCaptureTimestamp;
  if (elapsed < MIN_CAPTURE_GAP_MS) {
    await sleep(MIN_CAPTURE_GAP_MS - elapsed);
  }
  lastCaptureTimestamp = Date.now();
  return chrome.tabs.captureVisibleTab(windowId, options);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================================
// 1. CONTEXT MENUS SETUP (SAFE & IDEMPOTENT)
// =========================================================================

function setupContextMenus() {
  if (!chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      logger.warn('ContextMenu', 'removeAll error:', chrome.runtime.lastError.message);
    }

    const createSafe = (props) => {
      chrome.contextMenus.create(props, () => {
        if (chrome.runtime.lastError) {
          // Ignore duplicate item warnings on fast reload
        }
      });
    };

    // Single Parent Context Menu
    createSafe({
      id: 'myspace_root',
      title: 'MySpace',
      contexts: ['all'],
    });

    // Capture Sub-items
    createSafe({
      id: 'myspace_capture_full',
      parentId: 'myspace_root',
      title: '📸 Capture Full Page',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_capture_visible',
      parentId: 'myspace_root',
      title: '📷 Capture Visible Area',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_capture_selected',
      parentId: 'myspace_root',
      title: '✂️ Capture Selected Area',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_sep_1',
      parentId: 'myspace_root',
      type: 'separator',
      contexts: ['all'],
    });

    // Clipper Sub-items
    createSafe({
      id: 'myspace_save_page',
      parentId: 'myspace_root',
      title: '💾 Save Page to MySpace',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_save_selection',
      parentId: 'myspace_root',
      title: '📝 Save Selection to MySpace',
      contexts: ['selection'],
    });

    createSafe({
      id: 'myspace_save_link',
      parentId: 'myspace_root',
      title: '🔗 Save Link to MySpace',
      contexts: ['link'],
    });

    createSafe({
      id: 'myspace_sep_2',
      parentId: 'myspace_root',
      type: 'separator',
      contexts: ['all'],
    });

    // Reading & Inspection
    createSafe({
      id: 'myspace_reader_mode',
      parentId: 'myspace_root',
      title: '📖 Reader Mode',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_page_tools',
      parentId: 'myspace_root',
      title: '📊 Page Tools & Analysis',
      contexts: ['all'],
    });

    // Image Tools Submenu
    createSafe({
      id: 'myspace_image_tools',
      parentId: 'myspace_root',
      title: '🖼️ Image Tools',
      contexts: ['image'],
    });

    createSafe({
      id: 'myspace_image_open',
      parentId: 'myspace_image_tools',
      title: 'Open Image in New Tab',
      contexts: ['image'],
    });

    createSafe({
      id: 'myspace_image_download',
      parentId: 'myspace_image_tools',
      title: 'Download Image',
      contexts: ['image'],
    });

    createSafe({
      id: 'myspace_image_copy_url',
      parentId: 'myspace_image_tools',
      title: 'Copy Image URL',
      contexts: ['image'],
    });

    createSafe({
      id: 'myspace_image_qr',
      parentId: 'myspace_image_tools',
      title: 'Generate QR from Image URL',
      contexts: ['image'],
    });

    createSafe({
      id: 'myspace_sep_3',
      parentId: 'myspace_root',
      type: 'separator',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_copy_clean_url',
      parentId: 'myspace_root',
      title: '✨ Copy Clean URL',
      contexts: ['all'],
    });

    createSafe({
      id: 'myspace_open_tools',
      parentId: 'myspace_root',
      title: '🚀 Open MySpace Tools',
      contexts: ['all'],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

// Extension action click (toolbar button)
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && tab?.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    });
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

// =========================================================================
// 2. CONTEXT MENU & SHORTCUT COMMAND DISPATCHERS
// =========================================================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  switch (info.menuItemId) {
    case 'myspace_capture_full':
      executeTool('capture-full-page', tab);
      break;

    case 'myspace_capture_visible':
      executeTool('capture-visible', tab);
      break;

    case 'myspace_capture_selected':
      executeTool('capture-selected', tab);
      break;

    case 'myspace_save_page':
      executeTool('save-page', tab);
      break;

    case 'myspace_save_selection':
      handleSaveSelection(tab, info.selectionText);
      break;

    case 'myspace_save_link':
      handleSaveLink(tab, info.linkUrl);
      break;

    case 'myspace_reader_mode':
      executeTool('reader-mode', tab);
      break;

    case 'myspace_page_tools':
      executeTool('page-tools', tab);
      break;

    case 'myspace_image_open':
      if (info.srcUrl) chrome.tabs.create({ url: info.srcUrl });
      break;

    case 'myspace_image_download':
      if (info.srcUrl) {
        chrome.downloads.download({
          url: info.srcUrl,
          filename: `myspace-image-${Date.now()}.png`,
        });
      }
      break;

    case 'myspace_image_copy_url':
      if (info.srcUrl) {
        copyTextInTab(tab.id, info.srcUrl, 'Image URL copied to clipboard!');
      }
      break;

    case 'myspace_image_qr':
      if (info.srcUrl) {
        openQRInTab(tab.id, info.srcUrl);
      }
      break;

    case 'myspace_copy_clean_url':
      executeTool('clean-url', tab);
      break;

    case 'myspace_open_tools':
      openSidePanel(tab);
      break;
  }
});

// Handle Chrome Global Keyboard Commands
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  switch (command) {
    case 'capture-full-page':
      executeTool('capture-full-page', tab);
      break;
    case 'capture-visible':
      executeTool('capture-visible', tab);
      break;
    case 'save-page':
      executeTool('save-page', tab);
      break;
    case 'reader-mode':
      executeTool('reader-mode', tab);
      break;
    case 'open-side-panel':
      openSidePanel(tab);
      break;
    case 'open-tab-manager':
      handleOpenTabManager(tab);
      break;
  }
});

// =========================================================================
// 3. UNIFIED TOOL EXECUTION PIPELINE
// =========================================================================

async function executeTool(toolId, tab, options = {}) {
  logger.info('ToolExecution', `Starting: ${toolId} on tab ${tab?.id} (${tab?.url})`);

  if (!tab || !tab.id) {
    return { success: false, error: 'No active tab provided for tool execution' };
  }

  // Check page restriction for tools requiring page DOM access
  const requiresScripting = ['capture-full-page', 'capture-selected', 'reader-mode', 'page-tools', 'screen-ruler', 'element-inspector'];
  if (requiresScripting.includes(toolId) && !canScriptTab(tab.url)) {
    logger.warn('ToolExecution', `Restricted page: ${tab.url}`);
    notifyTab(tab.id, 'MySpace tools are not available on Chrome internal pages or Web Store.', 'error');
    return {
      success: false,
      error: 'MySpace tools cannot run on Chrome internal pages (chrome://) or Web Store due to browser security restrictions.',
    };
  }

  try {
    switch (toolId) {
      case 'capture-full-page':
        return await handleFullPageCapture(tab);

      case 'capture-visible':
        return await handleVisibleAreaCapture(tab);

      case 'capture-selected':
        return await handleSelectedAreaCapture(tab);

      case 'save-page':
        return await handleSavePage(tab);

      case 'reader-mode':
        return await handleReaderMode(tab);

      case 'page-tools':
        return await handlePageTools(tab);

      case 'clean-url':
        return await handleCopyCleanUrl(tab);

      case 'screen-ruler':
        return await handleScreenRuler(tab);

      case 'element-inspector':
        return await handleElementInspector(tab);

      default:
        throw new Error(`Unknown tool action: ${toolId}`);
    }
  } catch (err) {
    logger.error('ToolExecution', `Error executing ${toolId}:`, err);
    notifyTab(tab.id, `Tool error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 4. FULL PAGE SCREENSHOT ENGINE (RATE-LIMITED, HIGH-DPI & CANCELABLE)
// =========================================================================

async function handleFullPageCapture(tab) {
  if (!canScriptTab(tab.url)) {
    notifyTab(tab.id, 'Full-Page Screenshot unavailable on this page.', 'error');
    return { success: false, error: 'Restricted page cannot be captured' };
  }

  if (activeCaptures.has(tab.id)) {
    logger.warn('FullCapture', 'Capture already in progress on tab', tab.id);
    notifyTab(tab.id, 'Screenshot already in progress...', 'info');
    return { success: false, error: 'Screenshot already in progress' };
  }

  activeCaptures.add(tab.id);

  try {
    // 1. Prepare page, create progress badge with Cancel button, calculate layout dimensions
    const [dimResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.__myspace_capture_cancelled = false;

        // Create or reset Progress Badge
        let badge = document.getElementById('myspace-capture-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.id = 'myspace-capture-badge';
          badge.style.position = 'fixed';
          badge.style.top = '20px';
          badge.style.right = '20px';
          badge.style.zIndex = '2147483647';
          badge.style.padding = '12px 20px';
          badge.style.borderRadius = '12px';
          badge.style.background = 'rgba(15, 17, 23, 0.96)';
          badge.style.backdropFilter = 'blur(16px)';
          badge.style.border = '1px solid rgba(139, 92, 246, 0.5)';
          badge.style.color = '#ffffff';
          badge.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          badge.style.fontSize = '14px';
          badge.style.fontWeight = '600';
          badge.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '12px';
          badge.style.transition = 'all 0.2s ease';
          badge.innerHTML = `
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 10px #8b5cf6;animation:pulse 1.5s infinite;"></span>
            <span id="myspace-capture-text">Preparing Full Page Capture...</span>
            <button id="myspace-cancel-btn" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;margin-left:6px;">Cancel (Esc)</button>
          `;
          document.body.appendChild(badge);

          const cancelBtn = badge.querySelector('#myspace-cancel-btn');
          if (cancelBtn) {
            cancelBtn.onclick = () => {
              window.__myspace_capture_cancelled = true;
            };
          }
        }

        const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
            window.__myspace_capture_cancelled = true;
            window.removeEventListener('keydown', handleKeyDown);
          }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Save original scroll
        const origScrollX = window.scrollX;
        const origScrollY = window.scrollY;

        // Hide scrollbars temporarily
        const origOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';

        const clientWidth = document.documentElement.clientWidth || window.innerWidth;
        const clientHeight = document.documentElement.clientHeight || window.innerHeight;
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );
        const scrollWidth = Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
          clientWidth
        );
        const dpr = window.devicePixelRatio || 1;

        return {
          clientWidth,
          clientHeight,
          scrollHeight,
          scrollWidth,
          dpr,
          origScrollX,
          origScrollY,
          origOverflow,
        };
      },
    });

    const dim = dimResult?.result;
    if (!dim) throw new Error('Could not calculate page dimensions');

    const { clientHeight, scrollHeight, clientWidth, dpr } = dim;
    const slices = [];
    let currentY = 0;
    const maxCaptures = 35; // Maximum safety guard against infinite-scroll pages
    const yPositions = [];

    while (currentY < scrollHeight && yPositions.length < maxCaptures) {
      yPositions.push(currentY);
      if (currentY + clientHeight >= scrollHeight) break;
      currentY += clientHeight;
    }

    const totalSteps = yPositions.length;
    let wasCancelled = false;

    for (let i = 0; i < totalSteps; i++) {
      // Check cancellation state on page
      const [cancelCheck] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__myspace_capture_cancelled === true,
      });

      if (cancelCheck?.result) {
        wasCancelled = true;
        break;
      }

      const targetY = yPositions[i];

      // Update badge progress and scroll smoothly
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [i + 1, totalSteps, targetY],
        func: (step, total, scrollY) => {
          const txt = document.getElementById('myspace-capture-text');
          if (txt) txt.textContent = `Capturing slice ${step} / ${total}...`;
          window.scrollTo(0, scrollY);
        },
      });

      // Allow 300ms for lazy images and layout reflow to settle
      await sleep(300);

      // Capture visible tab via rate-limited API wrapper
      const dataUrl = await rateLimitedCaptureVisibleTab(tab.windowId, { format: 'png' });
      slices.push({
        y: targetY,
        dataUrl,
      });
    }

    // Restore page scroll position and cleanup badge
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [dim.origScrollX, dim.origScrollY, dim.origOverflow, wasCancelled],
      func: (origX, origY, origOverflow, cancelled) => {
        window.scrollTo(origX, origY);
        document.documentElement.style.overflow = origOverflow;
        const badge = document.getElementById('myspace-capture-badge');
        if (badge) {
          if (cancelled) {
            badge.innerHTML = `<span style="color:#ef4444;">Capture cancelled.</span>`;
            setTimeout(() => badge.remove(), 1000);
          } else {
            badge.innerHTML = `
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b981;"></span>
              <span>Stitching screenshot...</span>
            `;
            setTimeout(() => badge.remove(), 1200);
          }
        }
      },
    });

    if (wasCancelled) {
      notifyTab(tab.id, 'Screenshot capture cancelled.', 'info');
      return { success: false, cancelled: true };
    }

    // 2. Prepare high-DPI stitching package
    const screenshotData = {
      slices,
      width: Math.round(clientWidth * dpr),
      height: Math.round(scrollHeight * dpr),
      viewportWidth: Math.round(clientWidth * dpr),
      viewportHeight: clientHeight,
      dpr,
      sourceUrl: tab.url,
      pageTitle: tab.title || 'Web Page',
      timestamp: Date.now(),
      mode: 'full',
    };

    // Store in storage so Screenshot Editor can load it immediately
    await chrome.storage.local.set({ myspace_active_capture: screenshotData });

    // Notify open extension views
    chrome.runtime.sendMessage({
      type: 'MYSPACE_SCREENSHOT_READY',
      data: screenshotData,
    }).catch(() => {});

    // Open Screenshot Editor in tab
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?modal=screenshotEditor') });
    return { success: true };
  } catch (err) {
    logger.error('FullCapture', err);
    notifyTab(tab.id, `Capture failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  } finally {
    activeCaptures.delete(tab.id);
    // Guarantee page restoration
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const badge = document.getElementById('myspace-capture-badge');
        if (badge) badge.remove();
        document.documentElement.style.overflow = '';
      },
    }).catch(() => {});
  }
}

// =========================================================================
// 5. VISIBLE VIEWPORT CAPTURE
// =========================================================================

async function handleVisibleAreaCapture(tab) {
  try {
    const dataUrl = await rateLimitedCaptureVisibleTab(tab.windowId, { format: 'png' });
    const screenshotData = {
      dataUrl,
      sourceUrl: tab.url,
      pageTitle: tab.title || 'Visible Viewport',
      timestamp: Date.now(),
      mode: 'visible',
    };

    await chrome.storage.local.set({ myspace_active_capture: screenshotData });

    chrome.runtime.sendMessage({
      type: 'MYSPACE_SCREENSHOT_READY',
      data: screenshotData,
    }).catch(() => {});

    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?modal=screenshotEditor') });
    return { success: true };
  } catch (err) {
    logger.error('VisibleCapture', err);
    notifyTab(tab.id, `Visible capture failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 6. SELECTION / AREA CAPTURE (MARQUEE CROP)
// =========================================================================

async function handleSelectedAreaCapture(tab) {
  if (!canScriptTab(tab.url)) {
    notifyTab(tab.id, 'Area capture cannot run on this page.', 'error');
    return { success: false, error: 'Restricted page' };
  }

  try {
    const fullVisibleUrl = await rateLimitedCaptureVisibleTab(tab.windowId, { format: 'png' });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [fullVisibleUrl],
      func: (bgImageUrl) => {
        if (document.getElementById('myspace-crop-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'myspace-crop-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '2147483647';
        overlay.style.cursor = 'crosshair';
        overlay.style.background = 'rgba(0, 0, 0, 0.45)';
        overlay.style.userSelect = 'none';

        const info = document.createElement('div');
        info.style.position = 'fixed';
        info.style.top = '24px';
        info.style.left = '50%';
        info.style.transform = 'translateX(-50%)';
        info.style.background = 'rgba(15, 17, 23, 0.96)';
        info.style.border = '1px solid rgba(139, 92, 246, 0.5)';
        info.style.padding = '8px 20px';
        info.style.borderRadius = '9999px';
        info.style.color = '#fff';
        info.style.fontSize = '13px';
        info.style.fontWeight = '500';
        info.style.pointerEvents = 'none';
        info.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        info.textContent = 'Drag to select area to capture • Esc to cancel';
        overlay.appendChild(info);

        const box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.border = '2px dashed #8b5cf6';
        box.style.background = 'rgba(139, 92, 246, 0.15)';
        box.style.display = 'none';
        box.style.pointerEvents = 'none';
        overlay.appendChild(box);

        let startX = 0;
        let startY = 0;
        let isDragging = false;

        function onMouseDown(e) {
          startX = e.clientX;
          startY = e.clientY;
          isDragging = true;
          box.style.left = `${startX}px`;
          box.style.top = `${startY}px`;
          box.style.width = '0px';
          box.style.height = '0px';
          box.style.display = 'block';
        }

        function onMouseMove(e) {
          if (!isDragging) return;
          const currentX = e.clientX;
          const currentY = e.clientY;
          const left = Math.min(startX, currentX);
          const top = Math.min(startY, currentY);
          const width = Math.abs(currentX - startX);
          const height = Math.abs(currentY - startY);

          box.style.left = `${left}px`;
          box.style.top = `${top}px`;
          box.style.width = `${width}px`;
          box.style.height = `${height}px`;
        }

        function cleanup() {
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          overlay.remove();
        }

        function onKeyDown(e) {
          if (e.key === 'Escape') {
            cleanup();
          }
        }

        function onMouseUp(e) {
          if (!isDragging) return;
          isDragging = false;
          const endX = e.clientX;
          const endY = e.clientY;

          const rect = {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
            dpr: window.devicePixelRatio || 1,
          };

          cleanup();

          if (rect.width > 10 && rect.height > 10) {
            chrome.runtime.sendMessage({
              type: 'MYSPACE_CROP_SELECTION',
              rect,
              bgImageUrl,
            });
          }
        }

        overlay.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keydown', onKeyDown);
        document.body.appendChild(overlay);
      },
    });

    return { success: true };
  } catch (err) {
    logger.error('SelectedCapture', err);
    notifyTab(tab.id, `Selection capture failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 7. WEB CLIPPER (SAVE PAGE, SELECTION, LINK)
// =========================================================================

async function handleSavePage(tab) {
  try {
    let snippet = '';
    const favicon = tab.favIconUrl || '';

    if (canScriptTab(tab.url)) {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
          const p = document.querySelector('article p, main p, p')?.textContent?.trim() || '';
          return metaDesc || p.slice(0, 300);
        },
      });
      if (res?.result) snippet = res.result;
    }

    const clipItem = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: tab.title || 'Saved Page',
      url: tab.url,
      favicon,
      timestamp: Date.now(),
      selectedText: snippet,
      tags: ['Clipped'],
      workspaceId: 'ws-work',
      notes: '',
    };

    const stored = await chrome.storage.local.get(['myspace_clipped_pages']);
    const list = stored.myspace_clipped_pages || [];
    list.unshift(clipItem);
    await chrome.storage.local.set({ myspace_clipped_pages: list.slice(0, 100) });

    notifyTab(tab.id, 'Page saved to MySpace Web Clipper!', 'success');
    return { success: true, item: clipItem };
  } catch (err) {
    logger.error('SavePage', err);
    notifyTab(tab.id, `Failed to save page: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

async function handleSaveSelection(tab, text) {
  try {
    const clipItem = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: tab.title || 'Saved Selection',
      url: tab.url,
      favicon: tab.favIconUrl || '',
      timestamp: Date.now(),
      selectedText: text || '',
      tags: ['Quote', 'Research'],
      workspaceId: 'ws-work',
      notes: '',
    };

    const stored = await chrome.storage.local.get(['myspace_clipped_pages']);
    const list = stored.myspace_clipped_pages || [];
    list.unshift(clipItem);
    await chrome.storage.local.set({ myspace_clipped_pages: list.slice(0, 100) });

    notifyTab(tab.id, 'Selection saved to MySpace!', 'success');
    return { success: true, item: clipItem };
  } catch (err) {
    logger.error('SaveSelection', err);
    return { success: false, error: err.message };
  }
}

async function handleSaveLink(tab, linkUrl) {
  try {
    const clipItem = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: linkUrl,
      url: linkUrl,
      favicon: '',
      timestamp: Date.now(),
      selectedText: `Saved link from ${tab.title || tab.url}`,
      tags: ['Links'],
      workspaceId: 'ws-work',
      notes: '',
    };

    const stored = await chrome.storage.local.get(['myspace_clipped_pages']);
    const list = stored.myspace_clipped_pages || [];
    list.unshift(clipItem);
    await chrome.storage.local.set({ myspace_clipped_pages: list.slice(0, 100) });

    notifyTab(tab.id, 'Link saved to MySpace!', 'success');
    return { success: true, item: clipItem };
  } catch (err) {
    logger.error('SaveLink', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 8. NON-DESTRUCTIVE REVERSIBLE READER MODE
// =========================================================================

async function handleReaderMode(tab) {
  if (!canScriptTab(tab.url)) {
    notifyTab(tab.id, 'Reader Mode unavailable on this page.', 'error');
    return { success: false, error: 'Restricted page' };
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const existing = document.getElementById('myspace-reader-container');
        if (existing) {
          existing.remove();
          document.body.style.overflow = '';
          return;
        }

        // Extract content defensively
        const article = document.querySelector('article') ||
                        document.querySelector('[role="main"]') ||
                        document.querySelector('main') ||
                        document.querySelector('#content') ||
                        document.body;

        const title = document.querySelector('h1')?.textContent || document.title || 'Reader Mode';
        const rawElements = Array.from(article.querySelectorAll('p, h2, h3, blockquote, pre, ul, ol'))
          .filter((el) => el.textContent.trim().length > 20);

        let paragraphs = rawElements.map((el) => el.outerHTML).join('\n');
        const wordCount = (article.textContent || '').trim().split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        if (!paragraphs || paragraphs.trim().length === 0) {
          paragraphs = `<div style="padding:40px;text-align:center;color:#94a3b8;">
            <p style="font-size:18px;margin-bottom:12px;">Reader mode couldn't detect a readable article on this page.</p>
            <p style="font-size:14px;color:#64748b;">The page structure might be heavily interactive or dynamic.</p>
          </div>`;
        }

        // Reader Container
        const container = document.createElement('div');
        container.id = 'myspace-reader-container';
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.zIndex = '2147483646';
        container.style.background = '#090b10';
        container.style.color = '#e2e8f0';
        container.style.fontFamily = 'Georgia, Cambria, "Times New Roman", Times, serif';
        container.style.overflowY = 'auto';
        container.style.scrollBehavior = 'smooth';

        // Reading Progress Bar
        const progressBar = document.createElement('div');
        progressBar.style.position = 'fixed';
        progressBar.style.top = '0';
        progressBar.style.left = '0';
        progressBar.style.height = '4px';
        progressBar.style.background = 'linear-gradient(90deg, #8b5cf6, #3b82f6)';
        progressBar.style.width = '0%';
        progressBar.style.zIndex = '2147483647';
        container.appendChild(progressBar);

        container.addEventListener('scroll', () => {
          const total = container.scrollHeight - container.clientHeight;
          const current = container.scrollTop;
          const pct = total > 0 ? (current / total) * 100 : 0;
          progressBar.style.width = `${pct}%`;
        });

        // Top Toolbar
        const header = document.createElement('div');
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '12px 24px';
        header.style.background = 'rgba(9, 11, 16, 0.92)';
        header.style.backdropFilter = 'blur(16px)';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
        header.style.zIndex = '100';

        header.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:sans-serif;font-weight:700;font-size:14px;background:linear-gradient(135deg,#c084fc,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">MySpace Reader</span>
            <span style="font-family:sans-serif;font-size:12px;color:#94a3b8;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:12px;">${wordCount} words • ~${readTime} min read</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button id="myspace-reader-font-minus" style="background:rgba(255,255,255,0.08);border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:sans-serif;font-size:13px;">A-</button>
            <button id="myspace-reader-font-plus" style="background:rgba(255,255,255,0.08);border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:sans-serif;font-size:13px;">A+</button>
            <button id="myspace-reader-theme-toggle" style="background:rgba(255,255,255,0.08);border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:sans-serif;font-size:13px;">Theme</button>
            <button id="myspace-reader-close" style="background:#8b5cf6;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:sans-serif;font-weight:600;font-size:13px;">✕ Close (Esc)</button>
          </div>
        `;
        container.appendChild(header);

        // Content Box
        const articleBox = document.createElement('div');
        articleBox.id = 'myspace-reader-content';
        articleBox.style.maxWidth = '760px';
        articleBox.style.margin = '40px auto 120px';
        articleBox.style.padding = '0 24px';
        articleBox.style.fontSize = '19px';
        articleBox.style.lineHeight = '1.75';
        articleBox.innerHTML = `
          <h1 style="font-size:36px;line-height:1.25;font-weight:700;margin-bottom:24px;color:#f8fafc;">${title}</h1>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0 36px;" />
          <div class="myspace-reader-body">${paragraphs}</div>
        `;
        container.appendChild(articleBox);

        document.body.appendChild(container);
        document.body.style.overflow = 'hidden';

        // Font scaling
        let currentSize = 19;
        container.querySelector('#myspace-reader-font-minus').onclick = () => {
          currentSize = Math.max(14, currentSize - 2);
          articleBox.style.fontSize = `${currentSize}px`;
        };
        container.querySelector('#myspace-reader-font-plus').onclick = () => {
          currentSize = Math.min(28, currentSize + 2);
          articleBox.style.fontSize = `${currentSize}px`;
        };

        // Theme cycle
        const themes = [
          { bg: '#090b10', text: '#e2e8f0' },
          { bg: '#fbf0d9', text: '#2d2d2d' },
          { bg: '#ffffff', text: '#111827' },
          { bg: '#000000', text: '#a1a1aa' },
        ];
        let themeIndex = 0;
        container.querySelector('#myspace-reader-theme-toggle').onclick = () => {
          themeIndex = (themeIndex + 1) % themes.length;
          container.style.background = themes[themeIndex].bg;
          container.style.color = themes[themeIndex].text;
          const h1 = container.querySelector('h1');
          if (h1) h1.style.color = themes[themeIndex].text;
        };

        function closeReader() {
          container.remove();
          document.body.style.overflow = '';
          window.removeEventListener('keydown', onEsc);
        }
        function onEsc(e) {
          if (e.key === 'Escape') closeReader();
        }
        container.querySelector('#myspace-reader-close').onclick = closeReader;
        window.addEventListener('keydown', onEsc);
      },
    });

    return { success: true };
  } catch (err) {
    logger.error('ReaderMode', err);
    notifyTab(tab.id, `Reader Mode unavailable: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 9. PAGE TOOLS & DOM ANALYZER
// =========================================================================

async function handlePageTools(tab) {
  if (!canScriptTab(tab.url)) {
    notifyTab(tab.id, 'Page Tools unavailable on this page.', 'error');
    return { success: false, error: 'Restricted page' };
  }

  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const text = document.body?.innerText || '';
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const charCount = text.length;
        const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        // Headings
        const headings = [];
        const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
          const tag = h.tagName.toLowerCase();
          if (headingCounts[tag] !== undefined) headingCounts[tag]++;
          headings.push({
            level: parseInt(tag.replace('h', ''), 10),
            text: (h.textContent || '').trim().slice(0, 100),
          });
        });

        // Links
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        const currentHost = window.location.hostname;
        let internalLinks = 0;
        let externalLinks = 0;
        const extractedLinks = [];

        allLinks.forEach((a) => {
          const href = a.href;
          if (!href.startsWith('http')) return;
          try {
            const urlObj = new URL(href);
            const isExternal = urlObj.hostname !== currentHost;
            if (isExternal) externalLinks++;
            else internalLinks++;

            if (extractedLinks.length < 500) {
              extractedLinks.push({
                text: (a.textContent || '').trim().slice(0, 80) || '(No Anchor Text)',
                url: href,
                isExternal,
                domain: urlObj.hostname,
              });
            }
          } catch {}
        });

        // Images
        const images = Array.from(document.querySelectorAll('img'));
        const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt') || img.alt.trim() === '').length;

        // Meta tags
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

        return {
          title: document.title || 'Web Page',
          url: window.location.href,
          domain: window.location.hostname,
          protocol: window.location.protocol,
          wordCount,
          charCount,
          estimatedReadingTimeMinutes,
          headings: headings.slice(0, 50),
          headingCounts,
          totalLinks: allLinks.length,
          internalLinks,
          externalLinks,
          extractedLinks,
          imageCount: images.length,
          imagesWithoutAlt,
          description,
          canonicalUrl,
        };
      },
    });

    const analysis = res?.result;
    if (!analysis) throw new Error('Could not extract page metrics');

    await chrome.storage.local.set({ myspace_active_analysis: analysis });

    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?modal=pageTools') });
    return { success: true, data: analysis };
  } catch (err) {
    logger.error('PageTools', err);
    notifyTab(tab.id, `Page Tools error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 10. SCREEN RULER & ELEMENT INSPECTOR INJECTION
// =========================================================================

async function handleScreenRuler(tab) {
  if (!canScriptTab(tab.url)) {
    notifyTab(tab.id, 'Screen Ruler cannot run on this page.', 'error');
    return { success: false, error: 'Restricted page' };
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const existing = document.getElementById('myspace-screen-ruler');
      if (existing) {
        existing.remove();
        return;
      }

      const ruler = document.createElement('div');
      ruler.id = 'myspace-screen-ruler';
      ruler.style.position = 'fixed';
      ruler.style.inset = '0';
      ruler.style.pointerEvents = 'none';
      ruler.style.zIndex = '2147483647';

      const guideH = document.createElement('div');
      guideH.style.position = 'absolute';
      guideH.style.left = '0';
      guideH.style.right = '0';
      guideH.style.height = '1px';
      guideH.style.background = 'rgba(139, 92, 246, 0.85)';
      ruler.appendChild(guideH);

      const guideV = document.createElement('div');
      guideV.style.position = 'absolute';
      guideV.style.top = '0';
      guideV.style.bottom = '0';
      guideV.style.width = '1px';
      guideV.style.background = 'rgba(139, 92, 246, 0.85)';
      ruler.appendChild(guideV);

      const badge = document.createElement('div');
      badge.style.position = 'absolute';
      badge.style.background = 'rgba(15, 17, 23, 0.96)';
      badge.style.color = '#fff';
      badge.style.fontSize = '11px';
      badge.style.fontFamily = 'monospace';
      badge.style.padding = '4px 8px';
      badge.style.borderRadius = '6px';
      badge.style.border = '1px solid rgba(139, 92, 246, 0.5)';
      badge.style.pointerEvents = 'none';
      ruler.appendChild(badge);

      function onMouseMove(e) {
        guideH.style.top = `${e.clientY}px`;
        guideV.style.left = `${e.clientX}px`;
        badge.style.left = `${e.clientX + 14}px`;
        badge.style.top = `${e.clientY + 14}px`;
        badge.textContent = `X: ${e.clientX}px  Y: ${e.clientY}px`;
      }

      function onKeyDown(e) {
        if (e.key === 'Escape') {
          ruler.remove();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('keydown', onKeyDown);
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('keydown', onKeyDown);
      document.body.appendChild(ruler);
    },
  });

  return { success: true };
}

async function handleElementInspector(tab) {
  if (!canScriptTab(tab.url)) {
    notifyTab(tab.id, 'Inspector cannot run on this page.', 'error');
    return { success: false, error: 'Restricted page' };
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const existing = document.getElementById('myspace-inspector-box');
      if (existing) {
        existing.remove();
        return;
      }

      const box = document.createElement('div');
      box.id = 'myspace-inspector-box';
      box.style.position = 'fixed';
      box.style.pointerEvents = 'none';
      box.style.zIndex = '2147483647';
      box.style.border = '2px solid #8b5cf6';
      box.style.background = 'rgba(139, 92, 246, 0.15)';
      box.style.display = 'none';

      const tooltip = document.createElement('div');
      tooltip.style.position = 'absolute';
      tooltip.style.top = '-26px';
      tooltip.style.left = '0';
      tooltip.style.background = '#8b5cf6';
      tooltip.style.color = '#fff';
      tooltip.style.fontSize = '11px';
      tooltip.style.fontFamily = 'monospace';
      tooltip.style.padding = '2px 6px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.whiteSpace = 'nowrap';
      box.appendChild(tooltip);

      function onMouseOver(e) {
        const target = e.target;
        if (target === box || target.closest('#myspace-inspector-box')) return;
        const rect = target.getBoundingClientRect();
        box.style.display = 'block';
        box.style.top = `${rect.top}px`;
        box.style.left = `${rect.left}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
        tooltip.textContent = `<${target.tagName.toLowerCase()}> ${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
      }

      function onKeyDown(e) {
        if (e.key === 'Escape') {
          box.remove();
          window.removeEventListener('mouseover', onMouseOver);
          window.removeEventListener('keydown', onKeyDown);
        }
      }

      window.addEventListener('mouseover', onMouseOver);
      window.addEventListener('keydown', onKeyDown);
      document.body.appendChild(box);
    },
  });

  return { success: true };
}

// =========================================================================
// 11. CLEAN URL & QR GENERATOR UTILITIES
// =========================================================================

function cleanTrackingParams(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const trackingKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'mc_eid',
      'ref', 'source', 'igshid', 'si', 'feature', 'yclid', '_hsenc', '_hsmi',
    ];
    trackingKeys.forEach((k) => url.searchParams.delete(k));
    return url.toString();
  } catch {
    return rawUrl;
  }
}

async function handleCopyCleanUrl(tab) {
  const clean = cleanTrackingParams(tab.url);
  copyTextInTab(tab.id, clean, 'Clean URL copied to clipboard (tracking removed)!');
  return { success: true, cleanUrl: clean };
}

function copyTextInTab(tabId, textToCopy, toastMsg) {
  chrome.scripting.executeScript({
    target: { tabId },
    args: [textToCopy, toastMsg],
    func: async (text, msg) => {
      try {
        await navigator.clipboard.writeText(text);
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.zIndex = '2147483647';
        toast.style.padding = '10px 18px';
        toast.style.borderRadius = '10px';
        toast.style.background = 'rgba(15, 17, 23, 0.96)';
        toast.style.backdropFilter = 'blur(12px)';
        toast.style.border = '1px solid rgba(139, 92, 246, 0.5)';
        toast.style.color = '#fff';
        toast.style.fontSize = '13px';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      } catch (e) {
        console.error('Clipboard copy failed', e);
      }
    },
  }).catch(() => {});
}

function openQRInTab(tabId, urlToEncode) {
  chrome.tabs.create({
    url: chrome.runtime.getURL(`index.html?modal=designTools&tool=qr&data=${encodeURIComponent(urlToEncode)}`),
  });
}

// =========================================================================
// 12. SIDE PANEL & TAB MANAGEMENT
// =========================================================================

async function openSidePanel(tab) {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      return { success: true };
    } catch {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html?panel=sidepanel') });
      return { success: true };
    }
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?panel=sidepanel') });
    return { success: true };
  }
}

async function handleOpenTabManager() {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html?modal=tabManager') });
}

// =========================================================================
// 13. TARGET TAB RESOLUTION LOGIC
// =========================================================================

async function resolveTargetTab(sender, requestedTabId) {
  if (requestedTabId) {
    try {
      const tab = await chrome.tabs.get(requestedTabId);
      if (tab) return tab;
    } catch {}
  }

  // If sender is a regular web tab
  if (sender?.tab?.id && !sender.tab.url?.startsWith('chrome-extension://')) {
    return sender.tab;
  }

  // Active tab in current window
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.url && !activeTab.url.startsWith('chrome-extension://')) {
    return activeTab;
  }

  // If active tab is our extension page (Dashboard / Side Panel), find the most recently accessed web tab
  const windowTabs = await chrome.tabs.query({ currentWindow: true });
  const webTabs = windowTabs.filter((t) => t.url && canScriptTab(t.url));
  if (webTabs.length > 0) {
    webTabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    return webTabs[0];
  }

  return activeTab || null;
}

// =========================================================================
// 14. INTER-EXTENSION MESSAGING & PROTOCOL
// =========================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  // Unified Tool Protocol: { type: 'MYSPACE_EXECUTE_TOOL', action, payload }
  if (message.type === 'MYSPACE_EXECUTE_TOOL') {
    resolveTargetTab(sender, message.tabId).then((tab) => {
      if (!tab) {
        sendResponse({ success: false, error: 'No active webpage found to run this tool.' });
        return;
      }
      executeTool(message.action, tab, message.payload).then(sendResponse);
    });
    return true; // asynchronous
  }

  // Diagnostic Self-Check Protocol
  if (message.type === 'MYSPACE_SYSTEM_CHECK') {
    handleSystemCheck().then(sendResponse);
    return true;
  }

  // Legacy & direct actions for robust backwards compatibility
  if (message.type === 'START_FULL_PAGE_CAPTURE') {
    resolveTargetTab(sender, message.tab?.id).then((tab) => {
      if (tab) executeTool('capture-full-page', tab).then(sendResponse);
      else sendResponse({ success: false, error: 'No webpage found to capture' });
    });
    return true;
  }

  if (message.type === 'START_VISIBLE_CAPTURE') {
    resolveTargetTab(sender, message.tab?.id).then((tab) => {
      if (tab) executeTool('capture-visible', tab).then(sendResponse);
      else sendResponse({ success: false, error: 'No webpage found to capture' });
    });
    return true;
  }

  if (message.type === 'START_SELECTED_AREA_CAPTURE') {
    resolveTargetTab(sender, message.tab?.id).then((tab) => {
      if (tab) executeTool('capture-selected', tab).then(sendResponse);
      else sendResponse({ success: false, error: 'No webpage found to capture' });
    });
    return true;
  }

  if (message.type === 'TOGGLE_READER_MODE') {
    resolveTargetTab(sender, message.tab?.id).then((tab) => {
      if (tab) executeTool('reader-mode', tab).then(sendResponse);
      else sendResponse({ success: false, error: 'No webpage found' });
    });
    return true;
  }

  if (message.type === 'TRIGGER_PAGE_ANALYSIS') {
    resolveTargetTab(sender, message.tab?.id).then((tab) => {
      if (tab) executeTool('page-tools', tab).then(sendResponse);
      else sendResponse({ success: false, error: 'No webpage found' });
    });
    return true;
  }

  if (message.type === 'SAVE_PAGE') {
    resolveTargetTab(sender, message.tab?.id).then((tab) => {
      if (tab) executeTool('save-page', tab).then(sendResponse);
      else sendResponse({ success: false, error: 'No webpage found' });
    });
    return true;
  }

  if (message.type === 'GET_ALL_OPEN_TABS') {
    chrome.tabs.query({}).then((tabs) => sendResponse({ tabs, success: true }));
    return true;
  }

  if (message.type === 'CLOSE_TABS') {
    chrome.tabs.remove(message.tabIds).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'FOCUS_TAB') {
    chrome.tabs.update(message.tabId, { active: true });
    if (message.windowId) chrome.windows.update(message.windowId, { focused: true });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'RESTORE_TAB_SESSION') {
    chrome.windows.create({ url: message.urls }).then((newWindow) => {
      sendResponse({ success: true, windowId: newWindow.id });
    });
    return true;
  }

  if (message.type === 'MYSPACE_CROP_SELECTION') {
    const { rect, bgImageUrl } = message;
    const screenshotData = {
      dataUrl: bgImageUrl,
      cropRect: rect,
      sourceUrl: sender.tab?.url || '',
      pageTitle: sender.tab?.title || 'Selected Area',
      timestamp: Date.now(),
      mode: 'selected',
    };

    chrome.storage.local.set({ myspace_active_capture: screenshotData }).then(() => {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html?modal=screenshotEditor') });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab) openSidePanel(tab);
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});

// =========================================================================
// 15. DIAGNOSTICS & SELF-TEST ENGINE
// =========================================================================

async function handleSystemCheck() {
  const manifest = chrome.runtime.getManifest();
  const report = {
    version: manifest.version,
    permissions: manifest.permissions || [],
    checks: {
      manifest: { status: 'PASS' },
      serviceWorker: { status: 'PASS', uptime: 'active' },
      storage: { status: 'UNKNOWN' },
      contextMenus: { status: 'UNKNOWN' },
      downloads: { status: chrome.downloads ? 'PASS' : 'FAIL' },
      scripting: { status: chrome.scripting ? 'PASS' : 'FAIL' },
      tabs: { status: chrome.tabs ? 'PASS' : 'FAIL' },
      sidePanel: { status: chrome.sidePanel ? 'PASS' : 'FAIL' },
    },
  };

  try {
    await chrome.storage.local.set({ _myspace_ping: Date.now() });
    const res = await chrome.storage.local.get(['_myspace_ping']);
    report.checks.storage.status = res._myspace_ping ? 'PASS' : 'FAIL';
    await chrome.storage.local.remove(['_myspace_ping']);
  } catch (err) {
    report.checks.storage.status = 'FAIL';
    report.checks.storage.error = err.message;
  }

  try {
    report.checks.contextMenus.status = chrome.contextMenus ? 'PASS' : 'FAIL';
  } catch (err) {
    report.checks.contextMenus.status = 'FAIL';
  }

  return { success: true, report };
}

// =========================================================================
// 16. RESTRICTION VALIDATORS & TAB NOTIFIER
// =========================================================================

function canScriptTab(url) {
  if (!url) return false;
  return (
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('devtools://') &&
    !url.startsWith('view-source:') &&
    !url.startsWith('edge://') &&
    !url.includes('chrome.google.com/webstore')
  );
}

function notifyTab(tabId, msg, type = 'info') {
  if (!tabId) return;

  chrome.scripting.executeScript({
    target: { tabId },
    args: [msg, type],
    func: (text, t) => {
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.zIndex = '2147483647';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '12px';
      toast.style.background = t === 'error' ? 'rgba(239, 68, 68, 0.96)' : 'rgba(15, 17, 23, 0.96)';
      toast.style.backdropFilter = 'blur(16px)';
      toast.style.border = `1px solid ${t === 'error' ? '#ef4444' : '#8b5cf6'}`;
      toast.style.color = '#fff';
      toast.style.fontSize = '14px';
      toast.style.fontWeight = '500';
      toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
      toast.textContent = `[MySpace] ${text}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    },
  }).catch(() => {
    // Expected on restricted tabs where scripting cannot run
  });
}
