'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext'; // Mantemos a autenticação

// --- NOVOS TIPOS DE DADOS BASEADOS NO SEU INPUT ---

// Passo 2: Localização
interface Step2Data {
  location?: string;
}

// Passo 3: Detalhes
interface Step3Data {
  intensity?: number; // 1 a 10
  duration?: string;
  flightImpact?: string;
  concentrationImpact?: string;
  daysMissed?: number;
  lossOfMovement?: boolean;
  medicationUsed?: boolean;
}

// Passo 4: Início e Histórico
interface Step4Data {
  onset?: 'súbito' | 'gradual' | 'crônico';
  history?: 'primeira_vez' | 'contínua' | 'recorrente';
}

// Passo 5: Detalhes Qualitativos
interface Step5Data {
  qualitativeDetails?: string;
}

// Interface principal que une todos os dados
export interface ComplaintFormData {
  step2_location?: Step2Data;
  step3_details?: Step3Data;
  step4_history?: Step4Data;
  step5_qualitative?: Step5Data;
}

// --- FIM DOS NOVOS TIPOS ---


interface ComplaintContextType {
  complaintData: ComplaintFormData;
  setComplaintData: React.Dispatch<React.SetStateAction<ComplaintFormData>>;
  handleSubmit: () => Promise<void>;
  resetComplaintData: () => void;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

const initialData: ComplaintFormData = {
  step2_location: {},
  step3_details: {},
  step4_history: {},
  step5_qualitative: {},
};

export const ComplaintProvider = ({ children }: { children: ReactNode }) => {
  const [complaintData, setComplaintData] = useState<ComplaintFormData>(initialData);
  const { authFetch } = useAuth();

  // Assumindo que o backend continua em localhost:3001
  const handleSubmit = async () => {
  console.log("DADOS FINAIS PARA ENVIO:", complaintData);
  try {
    const response = await authFetch('http://localhost:3001/api/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha no envio da queixa.');
    }
    // ★★★ Linha 1 adicionada/modificada ★★★
    const responseData = await response.json(); // Pega a resposta completa do servidor.
    console.log("Queixa enviada com sucesso!", responseData);
    // ★★★ Linha 2 adicionada/modificada ★★★
    return responseData; // Retorna os dados da queixa criada (incluindo o ID).
  } catch (error) {
    console.error("Erro ao submeter queixa:", error);
    throw error; 
  }
};

  const resetComplaintData = () => {
    setComplaintData(initialData);
  }

  return (
    <ComplaintContext.Provider value={{ complaintData, setComplaintData, handleSubmit, resetComplaintData }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaint = () => {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaint deve ser usado dentro de um ComplaintProvider');
  }
  return context;
};