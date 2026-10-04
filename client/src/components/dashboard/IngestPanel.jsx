import { useRef, useState } from 'react';
import { Upload, FolderSync, HardDriveDownload, Loader2 } from 'lucide-react';
import apiClient from '../../api/axiosClient';

const TABS = [
  { id: 'api', label: 'Direct API', icon: Upload },
  { id: 'folder', label: 'Folder Watcher', icon: FolderSync },
  { id: 'gdrive', label: 'Google Drive Mock', icon: HardDriveDownload },
];

export default function IngestPanel({ onSubmitted }) {
  const [activeTab, setActiveTab] = useState('api');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  function selectTab(tabId) {
    setActiveTab(tabId);
    setFeedback(null);
  }

  async function handleFileSubmit(endpoint) {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFeedback({ type: 'error', text: 'Choose a file first.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setBusy(true);
    setFeedback(null);
    try {
      await apiClient.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFeedback({ type: 'success', text: `${file.name} accepted for processing.` });
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSubmitted?.();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleDriveSync() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiClient.post('/ingest/google-drive-mock', {});
      setFeedback({ type: 'success', text: `${res.data.runs.length} mock file(s) synced from Drive.` });
      onSubmitted?.();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const fileInputClass =
    'block w-full flex-1 text-xs text-base-300 file:mr-3 file:rounded-badge file:border-0 file:bg-base-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-base-100 hover:file:bg-base-600';
  const submitButtonClass =
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-badge bg-andon-processing px-3 py-1.5 text-xs font-semibold text-base-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="panel p-4">
      <div className="mb-3 font-mono-industrial text-[11px] uppercase tracking-wide text-base-400">
        Ingest New Batch
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-badge border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-andon-processing bg-andon-processing/10 text-andon-processing'
                  : 'border-base-700 bg-base-900 text-base-200 hover:border-base-600'
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'api' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input ref={fileInputRef} type="file" accept=".json,.xml,.csv,.xlsx,.xls" className={fileInputClass} />
          <button type="button" disabled={busy} onClick={() => handleFileSubmit('/ingest')} className={submitButtonClass}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Submit to /api/v1/ingest
          </button>
        </div>
      )}

      {activeTab === 'folder' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input ref={fileInputRef} type="file" accept=".json,.xml,.csv,.xlsx,.xls" className={fileInputClass} />
          <button
            type="button"
            disabled={busy}
            onClick={() => handleFileSubmit('/ingest/folder-watcher')}
            className={submitButtonClass}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <FolderSync size={14} />}
            Simulate Drop
          </button>
        </div>
      )}

      {activeTab === 'gdrive' && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} onClick={handleGoogleDriveSync} className={submitButtonClass}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <HardDriveDownload size={14} />}
            Sync Mock Drive Folder
          </button>
          <span className="text-xs text-base-400">Pulls every mocked export file into the pipeline.</span>
        </div>
      )}

      {feedback && (
        <p className={`mt-3 text-xs ${feedback.type === 'error' ? 'text-andon-failed' : 'text-andon-success'}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
