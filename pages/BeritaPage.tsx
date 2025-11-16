import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pengumuman } from '../types';
import { getPengumuman } from '../services/pengumumanService';
import { ChevronLeftIcon, DownloadIcon } from '../components/icons/Icons';
import { Logo } from '../components/icons/Logo';

// Definisi tipe untuk event beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}


const TRUNCATE_LENGTH = 500; // Character count threshold

const BeritaPage: React.FC = () => {
    const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    // State untuk event instalasi PWA
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const fetchPengumuman = async () => {
            setIsLoading(true);
            const data = await getPengumuman();
            setPengumumanList(data);
            setIsLoading(false);
        };
        fetchPengumuman();
    }, []);

    // Effect untuk menangani prompt instalasi PWA
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
            setInstallPromptEvent(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);
    
    const handleInstallClick = () => {
        if (!installPromptEvent) {
            return;
        }
        installPromptEvent.prompt();
    };
    
    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="bg-primary shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Logo className="text-white"/>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {installPromptEvent && (
                            <button 
                                onClick={handleInstallClick}
                                className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary-dark transition-colors animate-fade-in-up"
                                title="Instal aplikasi untuk akses lebih mudah"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span>Instal Aplikasi</span>
                            </button>
                        )}
                        <Link to="/login" className="flex items-center gap-2 bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-500 transition-colors">
                            <ChevronLeftIcon className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                {isLoading ? (
                    <p className="text-center text-gray-text py-10">Memuat pengumuman...</p>
                ) : pengumumanList.length > 0 ? (
                    <div className="space-y-6">
                        {pengumumanList.map((item) => {
                            const isLong = item.isi.length > TRUNCATE_LENGTH;
                            const isExpanded = !!expanded[item.id!];

                            return (
                                <div key={item.id} className="bg-surface rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
                                    <div className="p-6">
                                        <h2 className="text-xl md:text-2xl font-bold text-dark mb-2">{item.judul}</h2>
                                        <div className="flex items-center text-xs text-gray-text mb-4">
                                            <span>Diterbitkan oleh {item.penulis}</span>
                                            <span className="mx-2">&bull;</span>
                                            <span>{formatDate(item.tanggal)}</span>
                                        </div>
                                        <div className={`prose max-w-none text-slate-600 leading-relaxed transition-all duration-300 ${isLong && !isExpanded ? 'max-h-48 overflow-hidden relative' : ''}`}>
                                            <div dangerouslySetInnerHTML={{ __html: item.isi }} />
                                            {isLong && !isExpanded && (
                                                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent"></div>
                                            )}
                                        </div>
                                         {isLong && (
                                            <div className="mt-4">
                                                <button onClick={() => toggleExpand(item.id!)} className="text-primary font-semibold hover:underline text-sm">
                                                    {isExpanded ? 'Sembunyikan' : 'Baca Selengkapnya...'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold text-dark">Belum Ada Pengumuman</h2>
                        <p className="text-gray-text mt-2">Saat ini belum ada berita atau pengumuman yang diterbitkan.</p>
                    </div>
                )}
            </main>
             <style>{`
                .prose ul { list-style-type: disc; margin-left: 1.5rem; }
                .prose ol { list-style-type: decimal; margin-left: 1.5rem; }
                .prose li { margin-bottom: 0.25rem; }
                .prose p { margin-bottom: 1em; margin-top: 1em; color: #475569; } /* slate-600 */
                .prose h1, .prose h2, .prose h3, .prose strong { color: #1e2937; } /* slate-800 */
                .prose a { color: #0ea5e9; } /* sky-500 */
                .prose img { 
                    border-radius: 0.5rem; 
                    margin-top: 1em; 
                    margin-bottom: 1em;
                    max-width: 100%;
                    height: auto;
                }
            `}</style>
        </div>
    );
};

export default BeritaPage;