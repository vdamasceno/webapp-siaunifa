'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// Componente para o Bullet Colorido
const StatusBullet = ({ dateString }: { dateString: string }) => {
  const submissionDate = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - submissionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let bgColor = 'bg-gray-400';
  let tooltip = 'Data inválida';

  if (diffDays <= 30) {
    bgColor = 'bg-green-500';
    tooltip = 'Queixa com menos de 30 dias';
  } else if (diffDays <= 60) {
    bgColor = 'bg-yellow-500';
    tooltip = 'Queixa entre 30 e 60 dias';
  } else {
    bgColor = 'bg-red-500';
    tooltip = 'Queixa com mais de 60 dias';
  }

  return (
    <div className="group relative flex justify-center">
      <span className={`h-3 w-3 rounded-full ${bgColor}`}></span>
      <span className="absolute bottom-full mb-2 hidden w-auto p-2 text-xs text-white bg-gray-700 rounded-md group-hover:block">
        {tooltip}
      </span>
    </div>
  );
};

// Função para formatar a data
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


export default function HealthDashboardPage() {
  const { authFetch } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch(`/api/complaints?search=${searchTerm}&location=${locationFilter}`);
        if(!response.ok) throw new Error("Falha ao buscar queixas.");
        const data = await response.json();
        setComplaints(data);
      } catch (error) {
        console.error("Erro ao buscar queixas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 300);

    return () => clearTimeout(timer);

  }, [searchTerm, locationFilter, authFetch]);

  const uniqueLocations = useMemo(() => {
    if(!complaints) return ['Todos os locais'];
    const locations = complaints.map(c => c.location).filter(Boolean);
    return ['Todos os locais', ...Array.from(new Set(locations))];
  }, [complaints]);

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-sky-700 hover:underline mb-6">
          <ChevronLeft size={20} />
          Voltar ao Painel
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Saúde</h1>
        <p className="text-gray-600 mb-8">Acompanhe e filtre as queixas musculoesqueléticas.</p>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Total de Queixas</h3>
                <p className="text-3xl font-bold text-gray-800">{complaints?.length || 0}</p>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Alta Intensidade (&gt; 7)</h3>
                <p className="text-3xl font-bold text-gray-800">{complaints?.filter(c => c.intensity > 7).length || 0}</p>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Pilotos em Acompanhamento</h3>
                <p className="text-3xl font-bold text-gray-800">{new Set(complaints?.map(c => c.pilot_name) || []).size}</p>
            </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg shadow-md">
          <div className="relative"><input type="text" placeholder="Digite o nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border border-gray-300 rounded-md"/><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /></div>
          <div><select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value === 'Todos os locais' ? '' : e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">{uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
        </div>

        {/* Tabela de Queixas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piloto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local da Queixa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Intensidade</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-12 text-gray-500">Carregando queixas...</td></tr>
              ) : (
                <>
                  {/* ★★★ LÓGICA DO ESTADO VAZIO IMPLEMENTADA AQUI ★★★ */}
                  {!isLoading && complaints?.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="text-center p-12">
                            <div className="flex flex-col items-center gap-4 text-gray-500">
                                <ShieldCheck size={48} className="text-green-500" />
                                <h3 className="text-xl font-semibold text-gray-700">Tudo em ordem!</h3>
                                <p>No momento, não há queixas para avaliar.</p>
                                <p className="text-sm">Assim que um piloto registrar uma nova queixa na sua base, ela aparecerá aqui.</p>
                            </div>
                        </td>
                    </tr>
                  ) : (
                    complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap"><StatusBullet dateString={complaint.submission_date} /></td>
                        <td className="px-6 py-4 whitespace-nowrap">{complaint.pilot_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{complaint.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(complaint.submission_date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{complaint.intensity} / 10</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link href={`/complaint/${complaint.id}`} className="text-white bg-sky-700 hover:bg-sky-800 px-4 py-2 rounded-md text-sm font-medium">
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}