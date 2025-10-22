import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pengumuman } from '../types';
import { getPengumuman } from '../services/pengumumanService';
import { ChevronLeftIcon } from '../components/icons/Icons';
import { LogoBinaWarga } from '../components/icons/LogoBinaWarga';

const BeritaPage: React.FC = () => {
    const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPengumuman = async () => {
            setIsLoading(true);
            const data = await getPengumuman();
            setPengumumanList(data);
            setIsLoading(false);
        };
        fetchPengumuman();
    }, []);

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
                          <LogoBinaWarga className="text-white"/>
                        </div>
                    </div>
                    <Link to="/login" className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span>Login</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-10">Memuat pengumuman...</p>
                ) : pengumumanList.length > 0 ? (
                    <div className="space-y-6">
                        {pengumumanList.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-fade-in-up">
                                <div className="p-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-dark mb-2">{item.judul}</h2>
                                    <div className="flex items-center text-xs text-gray-500 mb-4">
                                        <span>Diterbitkan oleh {item.penulis}</span>
                                        <span className="mx-2">&bull;</span>
                                        <span>{formatDate(item.tanggal)}</span>
                                    </div>
                                    <div 
                                        className="prose max-w-none text-gray-700 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: item.isi }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold text-gray-700">Belum Ada Pengumuman</h2>
                        <p className="text-gray-500 mt-2">Saat ini belum ada berita atau pengumuman yang diterbitkan.</p>
                    </div>
                )}
            </main>
             <style>{`
                .prose ul { list-style-type: disc; margin-left: 1.5rem; }
                .prose ol { list-style-type: decimal; margin-left: 1.5rem; }
                .prose li { margin-bottom: 0.25rem; }
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