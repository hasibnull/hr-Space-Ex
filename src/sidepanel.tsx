import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppProvider } from './context/AppContext';
import { SidePanelDrawer } from './components/Panels/SidePanelDrawer';
import { Toast } from './components/UI/Toast';
import { ScreenshotEditorModal } from './components/Panels/ScreenshotEditorModal';
import { PageToolsModal } from './components/Panels/PageToolsModal';
import { TabManagerModal } from './components/Panels/TabManagerModal';
import { SavedPagesModal } from './components/Panels/SavedPagesModal';
import { DesignToolsModal } from './components/Panels/DesignToolsModal';

function SidePanelApp() {
  return (
    <div className="w-full min-h-screen bg-[#0f1117] text-slate-100 flex flex-col">
      <SidePanelDrawer isStandalone={true} />
      <ScreenshotEditorModal />
      <PageToolsModal />
      <TabManagerModal />
      <SavedPagesModal />
      <DesignToolsModal />
      <Toast />
    </div>
  );
}

const rootEl = document.getElementById('sidepanel-root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <AppProvider>
        <SidePanelApp />
      </AppProvider>
    </StrictMode>
  );
}
