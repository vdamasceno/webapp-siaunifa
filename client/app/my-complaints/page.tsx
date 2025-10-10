'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, FileText, CheckCircle, Clock } from 'lucide-react';

// Tipo para organizar os dados que recebemos da API
interface MyComplaint {
  id: number;
  main_complaint: string;
  submission_date: string;
  assessment_status: 'Parecer Disponível' | 'Aguardando Avaliação';
}

export default function MyComplaintsPage() {
  const { authFetch } = useAuth();
  const [complaints, setComplaints] = useState<MyComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch('/api/my-complaints');
        if (!response.ok) {
          throw new Error('Falha ao buscar suas queixas.');
        }
        const data = await response.json();
        setComplaints(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyComplaints();
  }, [authFetch]);

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-sky-700 hover:underline mb-6">
          <ChevronLeft size={20} />
          Voltar ao Painel
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Minhas Queixas Registradas</h1>
        <p className="text-gray-600 mb-8">Acompanhe o status de cada queixa que você enviou e veja os pareceres dos profissionais de saúde.</p>
        
        {isLoading && <p className="text-center">Carregando suas queixas...</p>}
        {error && <p className="text-center text-red-500">Erro: {error}</p>}

        {!isLoading && !error && (
          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map(complaint => (
                <Link key={complaint.id} href={`/my-complaints/${complaint.id}`} className="block bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:border-sky-500 border border-transparent transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <FileText className="text-sky-700 mr-3" size={20}/>
                        <span className="font-bold text-lg text-gray-800">{complaint.main_complaint}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Enviada em: {new Date(complaint.submission_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      complaint.assessment_status === 'Parecer Disponível' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.assessment_status === 'Parecer Disponível' ? 
                        <CheckCircle size={14} className="mr-2"/> : 
                        <Clock size={14} className="mr-2"/>
                      }
                      {complaint.assessment_status}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-md">Você ainda não registrou nenhuma queixa.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
