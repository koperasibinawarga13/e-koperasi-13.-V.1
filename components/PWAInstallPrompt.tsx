import React from 'react';
import { DownloadIcon } from './icons/Icons';
import { usePWA } from '../context/PWAContext';

const PWAInstallPrompt: React.FC = () => {
  const { installPromptEvent, isAppInstalled, triggerInstallPrompt } = usePWA();

  // If there's no deferred prompt event or the app is already installed,
  // don't show the install notification.
  if (!installPromptEvent || isAppInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950/95 px-4 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl transition-opacity duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-2xl bg-primary p-3 text-black">
          <DownloadIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-text">Aplikasi PWA Siap Dipasang</p>
          <p className="mt-1 text-sm font-semibold text-white">Instal e-Koperasi 13 untuk akses cepat dan aman.</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={triggerInstallPrompt}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary-dark"
        >
          <DownloadIcon className="w-4 h-4" />
          Pasang Sekarang
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
