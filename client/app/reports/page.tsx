'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, Users, FileText, Activity, BarChart, PieChart, LineChart } from 'lucide-react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';

// Registra os componentes do Chart.js que vamos usar
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// Componente para um Card de Estatística (KPI) no estilo Tailwind
const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
        <div className="bg-sky-100 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        </div>
    </div>
);

// Componente para um "Contêiner" de Gráfico no estilo Tailwind
const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div>{children}</div>
    </div>
);

export default function ReportsPage() {
  const { authFetch } = useAuth();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await authFetch('/api/reports/summary');
        if (!response.ok) throw new Error('Falha ao buscar os dados.');
        const data = await response.json();
        setSummaryData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummaryData();
  }, [authFetch]);

  if (isLoading) return <div className="text-center p-10">Carregando relatórios...</div>;
  if (error) return <div className="text-center p-10 text-red-500">**Erro:** {error}</div>;
  if (!summaryData) return <div className="text-center p-10 text-gray-500">Nenhum dado disponível para exibir.</div>;
  
  // Opções e dados para os gráficos (lógica inalterada)
  const chartOptions = { responsive: true, plugins: { legend: { display: false } } };
  const pieChartOptions = { responsive: true, plugins: { legend: { position: 'right' as const } } };
  const horizontalBarOptions = { indexAxis: 'y' as const, ...chartOptions };
  
  const createChartData = (label: string, data: object, backgroundColor: string | string[]) => ({
    labels: Object.keys(data),
    datasets: [{ label, data: Object.values(data), backgroundColor, borderColor: '#0056b3', borderWidth: 1 }],
  });
  
  const regionChartData = createChartData('Nº de Queixas', summaryData.complaintsByRegion, 'rgba(0, 86, 179, 0.7)');
  const impactChartData = createChartData('', summaryData.flightImpactDistribution, ['#2e7d32', '#ffc107', '#ed6c02', '#d32f2f', '#9e9e9e']);
  const monthlyChartData = createChartData('Queixas por Mês', summaryData.complaintsPerMonth, 'rgba(0, 86, 179, 0.7)');
  const lossOfMovementChartData = createChartData('Nº de Casos', summaryData.lossOfMovement, 'rgba(0, 86, 179, 0.7)');
  const medicationUseChartData = createChartData('Nº de Casos', summaryData.medicationUse, 'rgba(0, 86, 179, 0.7)');
  const onsetChartData = createChartData('Nº de Casos', summaryData.onsetDistribution, 'rgba(0, 86, 179, 0.7)');

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-sky-700 hover:underline mb-6">
          <ChevronLeft size={20} />
          Voltar ao Painel
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel de Análises e Relatórios</h1>
        <p className="text-gray-600 mb-8">Uma visão geral e estatística dos dados do sistema.</p>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total de Pilotos" value={summaryData.totalPilots} icon={<Users className="text-sky-700" />} />
            <StatCard title="Total de Queixas" value={summaryData.totalComplaints} icon={<FileText className="text-sky-700" />} />
            <StatCard title="Média de Intensidade" value={summaryData.averageIntensity} icon={<Activity className="text-sky-700" />} />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
                <ChartContainer title="Tendência de Queixas por Mês"><Line options={{ responsive: true }} data={monthlyChartData} /></ChartContainer>
            </div>
            <div className="lg:col-span-2">
                <ChartContainer title="Queixas por Região Corporal"><Bar options={chartOptions} data={regionChartData} /></ChartContainer>
            </div>
            <div>
                <ChartContainer title="Distribuição do Impacto no Voo"><Pie options={pieChartOptions} data={impactChartData} /></ChartContainer>
            </div>
            <div>
                <ChartContainer title="Perda de Movimento"><Bar options={horizontalBarOptions} data={lossOfMovementChartData} /></ChartContainer>
            </div>
            <div>
                <ChartContainer title="Uso de Medicamento"><Bar options={horizontalBarOptions} data={medicationUseChartData} /></ChartContainer>
            </div>
            <div>
                <ChartContainer title="Início da Queixa"><Bar options={horizontalBarOptions} data={onsetChartData} /></ChartContainer>
            </div>
        </div>
      </div>
    </main>
  );
}