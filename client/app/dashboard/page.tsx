'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogOut, User, FileText, FilePlus, ShieldCheck, Activity, BrainCircuit, ArrowRight, BarChart3, LayoutDashboard } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell'; // ★★★ IMPORTAÇÃO DO NOVO COMPONENTE ★★★

// Componente de Card de Ação (você já deve ter um parecido)
const DashboardActionCard = ({ href, icon: Icon, title, description, notificationCount }: { href: string, icon: React.ElementType, title: string, description: string, notificationCount?: number }) => (
  <Link href={href} className="relative block p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:border-sky-500 border border-transparent transition-all">
    <div className="flex items-center">
      <div className="bg-sky-100 p-3 rounded-full mr-4">
        <Icon className="text-sky-700" size={24} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="absolute top-4 right-4 text-gray-400" size={20} />
      {notificationCount && notificationCount > 0 && (
         <span className="absolute top-2 right-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {notificationCount}
         </span>
      )}
    </div>
  </Link>
);


export default function DashboardPage() {
  const { user, isAuthenticated, logout, authFetch } = useAuth();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Busca a contagem de pareceres não lidos para o piloto
  useEffect(() => {
      if (user?.role === 'PILOT') {
          authFetch('/api/notifications/count')
              .then(res => res.json())
              .then(data => {
                  setNotificationCount(data.unreadCount);
              })
              .catch(err => console.error("Falha ao buscar contagem de pareceres:", err));
      }
  }, [user, authFetch]);

  if (!user) {
    return <div className="text-center p-10">Carregando...</div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* ★★★ CABEÇALHO COM MENSAGEM DE BOAS-VINDAS E SINO ★★★ */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bem-vindo(a) de volta, {user.name}!</h1>
            <p className="text-gray-500">Seu perfil de acesso é: <span className="font-semibold capitalize">{user.role.toLowerCase().replace('_', ' ')}</span></p>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <button onClick={logout} className="flex items-center text-sm text-gray-500 hover:text-red-600">
              <LogOut size={16} className="mr-1" />
              Sair
            </button>
          </div>
        </div>

        {/* Painel do Piloto */}
        {user.role === 'PILOT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardActionCard 
                    href="/complaint/new" 
                    icon={FilePlus} 
                    title="Registrar Nova Queixa" 
                    description="Inicie um novo registro de queixa." 
                />
                <DashboardActionCard 
                    href="/my-complaints" 
                    icon={FileText} 
                    title="Ver Minhas Queixas" 
                    description="Acompanhe seus registros e pareceres." 
                    notificationCount={notificationCount} 
                />
                <DashboardActionCard 
                    href="/profile" 
                    icon={User} 
                    title="Meu Perfil" 
                    description="Atualize seus dados pessoais e profissionais." 
                />
                {/* ★★★ NOVO CARD ADICIONADO AQUI ★★★ */}
                <DashboardActionCard 
                    href="/my-health-dashboard" 
                    icon={LayoutDashboard} 
                    title="Painel de Saúde Pessoal" 
                    description="Visualize seu histórico e análises." 
                />
            </div>
        )}

        {/* Painel do Profissional de Saúde */}
        {user.role === 'HEALTH_PROFESSIONAL' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardActionCard href="/health-dashboard" icon={ShieldCheck} title="Painel de Saúde" description="Ver e gerenciar todas as queixas." />
                <DashboardActionCard href="/reports" icon={BarChart3} title="Relatórios e Gráficos" description="Visualize dados e tendências do sistema." />
                <DashboardActionCard href="/profile" icon={User} title="Meu Perfil" description="Gerencie seus dados e informações." />
            </div>
        )}

      </div>
    </main>
  );
}