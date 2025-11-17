import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { getPengaturanJasa, updatePengaturanJasa } from '../../services/pengaturanService';
import { PengaturanJasa } from '../../types';

const defaultValues: PengaturanJasa = {
    simpanan_jasa_rat: 0,
    simpanan_jasa_shu: 0,
    simpanan_jasa_simpanan: 0,
    simpanan_jasa_fons_lebaran: 0,
    pinjaman_jasa_rat: 0,
    pinjaman_jasa_shu: 0,
    pinjaman_jasa_simpanan: 0,
    pinjaman_jasa_fons_lebaran: 0,
    bunga_berjangka: 2,
    bunga_khusus: 3,
};

const FormField: React.FC<{
    label: string;
    name: keyof PengaturanJasa;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-text">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
             <input
                type="number"
                step="0.001"
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="block w-full bg-zinc-800 rounded-md py-2 px-3 focus:outline-none focus:ring-primary text-right text-dark"
                placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-text sm:text-sm">%</span>
            </div>
        </div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6">
        <h3 className="text-lg font-semibold text-dark pb-2 mb-4 border-b border-zinc-800">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

const AdminPengaturanJasa: React.FC = () => {
    const [settings, setSettings] = useState<PengaturanJasa>(defaultValues);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const data = await getPengaturanJasa();
            if (data) {
                setSettings(data);
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseFloat(value);
        setSettings(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updatePengaturanJasa(settings);
            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <div>
                <Header title="Pengaturan Jasa Persentase" />
                <p className="text-center p-10 text-gray-text">Memuat pengaturan...</p>
            </div>
        );
    }

    return (
        <div>
            <Header title="Pengaturan Jasa Persentase" />
            <div className="bg-surface p-6 rounded-xl max-w-4xl mx-auto">
                <form onSubmit={handleSave}>
                    <p className="text-sm text-gray-text">
                        Atur nilai-nilai persentase yang akan digunakan untuk perhitungan Jasa pada SHU dan kegiatan RAT.
                    </p>
                    
                     {message && (
                        <div className={`my-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
                         <Section title="Jasa Simpanan">
                            <FormField label="Jasa RAT" name="simpanan_jasa_rat" value={settings.simpanan_jasa_rat} onChange={handleInputChange} />
                            <FormField label="Jasa SHU" name="simpanan_jasa_shu" value={settings.simpanan_jasa_shu} onChange={handleInputChange} />
                            <FormField label="Jasa Simpanan" name="simpanan_jasa_simpanan" value={settings.simpanan_jasa_simpanan} onChange={handleInputChange} />
                            <FormField label="Jasa Fons Lebaran" name="simpanan_jasa_fons_lebaran" value={settings.simpanan_jasa_fons_lebaran} onChange={handleInputChange} />
                        </Section>

                        <Section title="Jasa Pinjaman">
                            <FormField label="Jasa RAT" name="pinjaman_jasa_rat" value={settings.pinjaman_jasa_rat} onChange={handleInputChange} />
                            <FormField label="Jasa SHU" name="pinjaman_jasa_shu" value={settings.pinjaman_jasa_shu} onChange={handleInputChange} />
                            <FormField label="Jasa Simpanan" name="pinjaman_jasa_simpanan" value={settings.pinjaman_jasa_simpanan} onChange={handleInputChange} />
                            <FormField label="Jasa Fons Lebaran" name="pinjaman_jasa_fons_lebaran" value={settings.pinjaman_jasa_fons_lebaran} onChange={handleInputChange} />
                        </Section>
                    </div>

                    <Section title="Bunga Pinjaman (Untuk Perhitungan Jasa)">
                         <FormField label="Berjangka" name="bunga_berjangka" value={settings.bunga_berjangka} onChange={handleInputChange} />
                         <FormField label="Khusus" name="bunga_khusus" value={settings.bunga_khusus} onChange={handleInputChange} />
                    </Section>

                    <div className="flex justify-end pt-8">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="bg-primary text-black py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-zinc-700"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPengaturanJasa;