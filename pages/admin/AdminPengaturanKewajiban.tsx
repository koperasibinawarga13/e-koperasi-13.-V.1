import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { getPengaturanKewajiban, updatePengaturanKewajiban, PengaturanKewajiban } from '../../services/pengaturanService';

const defaultValues: PengaturanKewajiban = {
    simpananPokok: 25000,
    simpananWajibMin: 100000,
    simpananWajibMax: 200000,
    danaPerlaya: 5000,
    danaKatineng: 5000,
};

const FormField: React.FC<{
    label: string;
    name: keyof PengaturanKewajiban;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type="text"
            inputMode="numeric"
            id={name}
            name={name}
            value={value === 0 ? '' : new Intl.NumberFormat('id-ID').format(value)}
            onChange={onChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-right"
            placeholder="0"
        />
    </div>
);


const AdminPengaturanKewajiban: React.FC = () => {
    const [settings, setSettings] = useState<PengaturanKewajiban>(defaultValues);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const data = await getPengaturanKewajiban();
            if (data) {
                setSettings(data);
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        setSettings(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updatePengaturanKewajiban(settings);
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
                <Header title="Pengaturan Kewajiban Anggota Baru" />
                <p className="text-center p-10">Memuat pengaturan...</p>
            </div>
        );
    }

    return (
        <div>
            <Header title="Pengaturan Kewajiban Anggota Baru" />
            <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <p className="text-sm text-gray-600">
                        Ubah nilai-nilai di bawah ini untuk memperbarui informasi yang ditampilkan pada halaman pendaftaran anggota baru.
                    </p>
                    
                     {message && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Simpanan Pokok (sekali bayar)" name="simpananPokok" value={settings.simpananPokok} onChange={handleInputChange} />
                        <div />
                        <FormField label="Simpanan Wajib (Min per bulan)" name="simpananWajibMin" value={settings.simpananWajibMin} onChange={handleInputChange} />
                        <FormField label="Simpanan Wajib (Max per bulan)" name="simpananWajibMax" value={settings.simpananWajibMax} onChange={handleInputChange} />
                        <FormField label="Dana Perlaya (per bulan)" name="danaPerlaya" value={settings.danaPerlaya} onChange={handleInputChange} />
                        <FormField label="Dana Katineng (per bulan)" name="danaKatineng" value={settings.danaKatineng} onChange={handleInputChange} />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-400"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPengaturanKewajiban;
