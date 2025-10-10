'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link'; // Importamos o Link para navegação

// Define o tipo de dado que esperamos para cada parecer
interface AssessmentReport {
  id: number;
  diagnosis: string;
  treatment_plan: string;
  notes: string;
  assessment_date: string;
  complaint_location: string;
  complaint_date: string;
  professional_name: string;
}

export default function MyReportsPage() {
  const { authFetch } = useAuth();
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`);
        if (!response.ok) {
          throw new Error('Falha ao buscar seus pareceres de saúde.');
        }
        const data = await response.json();
        setReports(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [authFetch]);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-gray-500">Carregando seus pareceres...</p>;
    }
    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }
    if (reports.length === 0) {
      return <p className="text-center text-gray-500">Nenhum parecer de saúde disponível no momento.</p>;
    }

    return (
      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-sky-500">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Parecer sobre a queixa em: {report.complaint_location}
                </h2>
                <p className="text-sm text-gray-500">
                  Queixa original de {new Date(report.complaint_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                Avaliado em: {new Date(report.assessment_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-gray-700">Diagnóstico / Hipótese</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md mt-1">{report.diagnosis}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Plano de Tratamento Recomendado</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md mt-1 whitespace-pre-wrap">{report.treatment_plan}</p>
              </div>
              {report.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700">Observações</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md mt-1">{report.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t text-right">
              <p className="text-sm text-gray-500">Avaliado por: <span className="font-medium">{report.professional_name}</span></p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meus Pareceres de Saúde</h1>
        <p className="text-gray-600">Aqui você pode visualizar as avaliações e recomendações da equipe de saúde.</p>
      </div>

      {/* --- CÓDIGO NOVO ADICIONADO AQUI --- */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sky-600 hover:underline font-semibold">
          &larr; Voltar para a Página Principal
        </Link>
      </div>
      {/* --- FIM DO CÓDIGO NOVO --- */}
      
      {renderContent()}
    </main>
  );
}