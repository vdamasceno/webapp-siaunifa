'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useComplaint } from '@/context/ComplaintContext';

export default function NewComplaintPage() {
  const router = useRouter();
  const { resetComplaintData } = useComplaint();

  // Este hook é executado assim que a página carrega
  useEffect(() => {
    // A ação mais importante: limpamos qualquer dado de uma queixa anterior.
    // Isso garante que todo novo registro comece do zero.
    resetComplaintData();
  }, [resetComplaintData]);

  const handleStart = () => {
    // Envia o usuário para o Passo 2 para começar a preencher
    router.push('/complaint/new/step2');
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '80vh' }}>
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Registro de Nova Queixa Musculoesquelética
        </h1>
        <p className="text-gray-600 mb-8">
          Você será guiado por algumas etapas para registrar sua queixa. O processo é rápido e suas informações são confidenciais.
        </p>
        <button
          onClick={handleStart}
          className="bg-sky-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-sky-700 transition-colors shadow-lg"
        >
          Iniciar Registro
        </button>
      </div>
    </main>
  );
}