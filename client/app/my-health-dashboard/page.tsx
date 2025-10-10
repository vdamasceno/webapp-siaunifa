'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, Heart, BarChart2, MapPin, BrainCircuit, Activity } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

// Mapeamento de locais do corpo para posições no Bodymap
const bodymapCoordinates: { [key: string]: { top: string; left: string } } = {
  'Cabeça': { top: '6.54%', left: '25.80%' },
  'Pescoço': { top: '16.01%', left: '26.00%' },
  'Ombro': { top: '18.55%', left: '17.40%' },
  'Ombro Esquerdo': { top: '18.55%', left: '17.40%' },
  'Ombro Direito': { top: '16.70%', left: '66.60%' },
  'Tórax': { top: '21.78%', left: '25.80%' },
  'Coluna Torácica': { top: '26.17%', left: '76.00%' },
  'Coluna Lombar': { top: '36.56%', left: '76.00%' },
  'Cotovelo': { top: '32.17%', left: '15.00%' },
  'Antebraço': { top: '36.33%', left: '11.60%' },
  'Punho e Mão': { top: '42.10%', left: '7.80%' },
  'Quadril e virilha': { top: '42.34%', left: '22.80%' },
  'Pelve e Nádegas': { top: '44.41%', left: '72.60%' },
  'Coxa': { top: '52.27%', left: '22.00%' },
  'Joelho': { top: '63.81%', left: '22.60%' },
  'Perna, Tornozelo e Pé': { top: '81.83%', left: '23.60%' },
};

// ★★★ Componente reutilizável para os Cards de Estatística ★★★
const StatCard = ({ title, value, icon, valueSuffix = '' }: { title: string, value: string | number, icon: React.ReactNode, valueSuffix?: string }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
        <div className="p-3 rounded-full bg-gray-100 mr-4">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value} {valueSuffix}</p>
        </div>
    </div>
);


export default function MyHealthDashboardPage() {
    const { authFetch } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await authFetch('/api/pilot-health-summary');
                if (!response.ok) throw new Error('Falha ao carregar os dados de saúde.');
                const data = await response.json();
                setSummary(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, [authFetch]);

    if (isLoading) return <div className="text-center p-10">Carregando seu Painel de Saúde...</div>;
    if (!summary) return <div className="text-center p-10">Não há dados suficientes para exibir o painel.</div>;

    const chartData = {
        labels: summary.timeSeries.complaintIntensity.map((d: any) => d.x),
        datasets: [
            { label: 'Intensidade da Queixa', data: summary.timeSeries.complaintIntensity.map((d: any) => d.y), borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.5)', yAxisID: 'y' },
            { label: 'Score NASA-TLX', data: summary.timeSeries.nasaTlx.map((d: any) => d.y), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.5)', yAxisID: 'y1' },
        ],
    };
    const chartOptions = {
        scales: { y: { type: 'linear' as const, display: true, position: 'left' as const, min: 0, max: 10 }, y1: { type: 'linear' as const, display: true, position: 'right' as const, min: 0, max: 100, grid: { drawOnChartArea: false } } }
    };

    return (
        <main className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center text-sky-700 hover:underline mb-6">
                    <ChevronLeft size={20} /> Voltar ao Painel
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Meu Painel de Saúde Pessoal</h1>
                
                {/* ★★★ CARDS DE RESUMO - SEÇÃO ATUALIZADA COM 5 CARDS ★★★ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <StatCard title="Região Mais Afetada" value={summary.summaryStats.mostAffectedRegion} icon={<MapPin className="text-red-500"/>} />
                    <StatCard title="Média de Intensidade" value={summary.summaryStats.averageIntensity} valueSuffix="/ 10" icon={<Heart className="text-red-500"/>} />
                    <StatCard title="Total de Queixas" value={summary.timeline.length} icon={<BarChart2 className="text-sky-500"/>} />
                    <StatCard title="Perfil de Carga (Média)" value={summary.summaryStats.averageNasaTlx} icon={<BrainCircuit className="text-purple-500"/>} />
                    <StatCard title="Perfil de Atividade" value={summary.summaryStats.mostFrequentIpaq} icon={<Activity className="text-green-500"/>} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Mapa Corporal de Queixas</h2>
                        <div className="relative w-full max-w-sm mx-auto">
                            <img src="/bodymap.png" alt="Mapa Corporal" className="w-full h-auto" />
                            {summary.bodymap.map((item: any, index: number) => {
                                const coords = bodymapCoordinates[item.location];
                                if (!coords) return null;
                                const size = 8 + (item.intensity * 2);
                                const color = item.onset === 'súbito' ? 'bg-yellow-400' : 'bg-red-500';
                                return (
                                    <div key={index} className={`absolute rounded-full ${color} opacity-60`} style={{ top: coords.top, left: coords.left, width: `${size}px`, height: `${size}px`, transform: 'translate(-50%, -50%)' }} title={`${item.location} - Intensidade: ${item.intensity}`}></div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Correlação: Intensidade vs. Carga de Trabalho</h2>
                        <Line options={chartOptions} data={chartData} />
                    </div>
                </div>
            </div>
        </main>
    );
}