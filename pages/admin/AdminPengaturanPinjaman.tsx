import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
// Fix: Changed the import source for the 'PengaturanPinjaman' type from 'pengaturanService' to 'types' to resolve the module export error.
import { getPengaturanPinjaman, updatePengaturanPinjaman } from '../../services/pengaturanService';
import { PengaturanPinjaman } from '../../types';

const defaultValues: PengaturanPinjaman = {
    sukuBunga: 2, // Default 2%
};

const FormField: React.FC<{
    label: string;
    name: keyof PengaturanPinjaman;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-text">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
             <input
                type="number"
                step="0.01"
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

const AdminPengaturanPinjaman: React.FC = () => {
    const [settings, setSettings] = useState<PengaturanPinjaman>(defaultValues);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const data = await getPengaturanPinjaman();
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
            await updatePengaturanPinjaman(settings);
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
                <Header title="Pengaturan Suku Bunga Pinjaman" />
                <p className="text-center p-10 text-gray-text">Memuat pengaturan...</p>
            </div>
        );
    }

    return (
        <div>
            <Header title="Pengaturan Suku Bunga Pinjaman" />
            <div className="bg-surface p-6 rounded-xl max-w-lg mx-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <p className="text-sm text-gray-text">
                        Nilai yang diatur di sini akan menjadi suku bunga per bulan yang digunakan dalam simulasi pinjaman anggota.
                    </p>
                    
                     {message && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <FormField label="Suku Bunga Pinjaman per Bulan" name="sukuBunga" value={settings.sukuBunga} onChange={handleInputChange} />

                    <div className="flex justify-end pt-4">
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

export default AdminPengaturanPinjaman;