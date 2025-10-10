'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

// Tipos para organizar os dados
interface BaseAerea {
    id: number;
    name: string;
}

// Lista de Postos e Graduações
const fabRanks = [
    "Marechal-do-Ar", "Tenente-Brigadeiro-do-Ar", "Major-Brigadeiro", "Brigadeiro", "Coronel", 
    "Tenente-Coronel", "Major", "Capitão", "Primeiro-Tenente", "Segundo-Tenente", "Aspirante a Oficial",
    "Suboficial", "Primeiro-Sargento", "Segundo-Sargento", "Terceiro-Sargento", "Cabo", "Taifeiro-Mor",
    "Soldado (Primeira Classe)", "Taifeiro (Primeira Classe)", "Soldado (Segunda Classe)", "Taifeiro (Segunda Classe)"
];

// Lista de Categorias de Aeronave
const aircraftCategories = [
    "Caça", "Transporte", "Patrulha", "Asa Rotativa (Helicóptero)", "Aeronave Remotamente Pilotada (ARP)"
];

export default function ProfilePage() {
    const { authFetch, user } = useAuth();
    const router = useRouter();

    const [profileData, setProfileData] = useState<any>({});
    const [bases, setBases] = useState<BaseAerea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Busca os dados do perfil e a lista de bases ao carregar a página
    useEffect(() => {
        const loadPageData = async () => {
            setIsLoading(true);
            try {
                const [profileResponse, basesResponse] = await Promise.all([
                    authFetch('/api/profile'),
                    authFetch('/api/bases')
                ]);
                if (!profileResponse.ok) throw new Error('Falha ao carregar o perfil.');
                if (!basesResponse.ok) throw new Error('Falha ao carregar a lista de bases.');
                const profile = await profileResponse.json();
                const basesList = await basesResponse.json();
                if (profile.birth_date) {
                    profile.birth_date = new Date(profile.birth_date).toISOString().split('T')[0];
                }
                setProfileData(profile);
                setBases(basesList);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadPageData();
    }, [authFetch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar o perfil.');
      }

      // ★★★ MUDANÇA AQUI ★★★
      // Em vez de apenas mostrar uma mensagem, exibimos um alerta e redirecionamos.
      alert('Perfil atualizado com sucesso!');
      router.push('/dashboard'); // <-- Redireciona para o painel principal

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false); // Garante que o botão seja reativado em caso de erro
    }
    // O setIsLoading(false) no 'finally' foi removido porque o redirecionamento já acontece.
  };

    if (isLoading && !profileData.name) {
        return <div className="text-center p-10">Carregando perfil...</div>;
    }
    
    // Formulário do Piloto
    const pilotFormFields = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="saram" className="block text-sm font-medium text-gray-700">SARAM</label><input type="text" name="saram" id="saram" value={profileData.saram || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                <div><label htmlFor="rank" className="block text-sm font-medium text-gray-700">Posto / Graduação</label><select name="rank" id="rank" value={profileData.rank || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="">Selecione...</option>{fabRanks.map(rank => <option key={rank} value={rank}>{rank}</option>)}</select></div>
                <div><label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp</label><input type="text" name="whatsapp" id="whatsapp" value={profileData.whatsapp || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                <div><label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">Data de Nascimento</label><input type="date" name="birth_date" id="birth_date" value={profileData.birth_date || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                
                {/* ★★★ CAMPOS DE PESO E ALTURA ADICIONADOS AQUI ★★★ */}
                <div><label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700">Peso (kg)</label><input type="number" name="weight_kg" id="weight_kg" step="0.1" value={profileData.weight_kg || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 75.5"/></div>
                <div><label htmlFor="height_m" className="block text-sm font-medium text-gray-700">Altura (m)</label><input type="number" name="height_m" id="height_m" step="0.01" value={profileData.height_m || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 1.82"/></div>

                <div className="md:col-span-2"><label htmlFor="aircraft_type" className="block text-sm font-medium text-gray-700">Categoria de Aeronave Principal</label><select name="aircraft_type" id="aircraft_type" value={profileData.aircraft_type || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="">Selecione...</option>{aircraftCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div className="md:col-span-2"><label htmlFor="base_id" className="block text-sm font-medium text-gray-700">Base Aérea</label><select name="base_id" id="base_id" value={profileData.base_id || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="">Selecione...</option>{bases.map(base => <option key={base.id} value={base.id}>{base.name}</option>)}</select></div>
            </div>
        </>
    );

    // Formulário do Profissional de Saúde
    const healthProfessionalFormFields = () => (
         <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="crm_crefito" className="block text-sm font-medium text-gray-700">CRM / CREFITO</label><input type="text" name="crm_crefito" id="crm_crefito" value={profileData.crm_crefito || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                <div><label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp</label><input type="text" name="whatsapp" id="whatsapp" value={profileData.whatsapp || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                <div className="md:col-span-2"><label htmlFor="base_id" className="block text-sm font-medium text-gray-700">Base Aérea de Lotação</label><select name="base_id" id="base_id" value={profileData.base_id || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="">Selecione...</option>{bases.map(base => <option key={base.id} value={base.id}>{base.name}</option>)}</select></div>
            </div>
        </>
    );

    return (
        <main className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center text-sky-700 hover:underline mb-6">
                    <ChevronLeft size={20} /> Voltar ao Painel
                </Link>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Informações da Conta</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-500">Nome</label><p className="mt-1 p-2 bg-gray-100 rounded-md">{profileData.name}</p></div>
                                <div><label className="block text-sm font-medium text-gray-500">Email</label><p className="mt-1 p-2 bg-gray-100 rounded-md">{profileData.email}</p></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Informações Profissionais</h3>
                            {user?.role === 'PILOT' && pilotFormFields()}
                            {user?.role === 'HEALTH_PROFESSIONAL' && healthProfessionalFormFields()}
                        </div>

                        {error && <p className="text-sm text-center text-red-600">{error}</p>}
                        {successMessage && <p className="text-sm text-center text-green-600">{successMessage}</p>}

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isLoading} className="bg-sky-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-800 disabled:bg-gray-400">
                                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}