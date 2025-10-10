'use client';

import React, { useState } from 'react';

// Define os tipos para as props do componente
interface BodyMapProps {
  onSelect: (region: string) => void; // Função para ser chamada quando uma região é selecionada
  initialRegion?: string; // Região inicialmente selecionada (para edição)
}

// Lista de regiões corporais para o mapa
const bodyRegions = [
  { id: 'cabeca', name: 'Cabeça', coords: "125,50,40" },
  { id: 'pescoco', name: 'Pescoço', coords: "125,100,20" },
  { id: 'ombro-d', name: 'Ombro Direito', coords: "85,130,25" },
  { id: 'ombro-e', name: 'Ombro Esquerdo', coords: "165,130,25" },
  { id: 'braco-d', name: 'Braço Direito', coords: "55,180,25" },
  { id: 'braco-e', name: 'Braço Esquerdo', coords: "195,180,25" },
  { id: 'cotovelo-d', name: 'Cotovelo Direito', coords: "45,230,20" },
  { id: 'cotovelo-e', name: 'Cotovelo Esquerdo', coords: "205,230,20" },
  { id: 'mao-d', name: 'Mão Direita', coords: "35,290,20" },
  { id: 'mao-e', name: 'Mão Esquerda', coords: "215,290,20" },
  { id: 'torax', name: 'Tórax', coords: "125,160,40" },
  { id: 'lombar', name: 'Coluna Lombar', coords: "125,230,35" },
  { id: 'quadril-d', name: 'Quadril Direito', coords: "95,280,30" },
  { id: 'quadril-e', name: 'Quadril Esquerdo', coords: "155,280,30" },
  { id: 'coxa-d', name: 'Coxa Direita', coords: "95,340,35" },
  { id: 'coxa-e', name: 'Coxa Esquerda', coords: "155,340,35" },
  { id: 'joelho-d', name: 'Joelho Direito', coords: "95,410,25" },
  { id: 'joelho-e', name: 'Joelho Esquerdo', coords: "155,410,25" },
  { id: 'perna-d', name: 'Perna Direita', coords: "95,470,25" },
  { id: 'perna-e', name: 'Perna Esquerda', coords: "155,470,25" },
  { id: 'pe-d', name: 'Pé Direito', coords: "95,530,25" },
  { id: 'pe-e', name: 'Pé Esquerdo', coords: "155,530,25" },
];

const BodyMap = ({ onSelect, initialRegion }: BodyMapProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(initialRegion);

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId);
    onSelect(regionId);
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        {selectedRegion ? `Região Selecionada: ${selectedRegion}` : 'Por favor, clique na região da queixa'}
      </h2>
      <svg width="250" height="600" viewBox="0 0 250 600" xmlns="http://www.w3.org/2000/svg">
        {/* Placeholder para a imagem do corpo humano */}
        <image href="/body-outline.svg" x="0" y="0" height="600" width="250"/>

        {/* Mapeamento das áreas clicáveis */}
        {bodyRegions.map((region) => (
          <circle
            key={region.id}
            cx={region.coords.split(',')[0]}
            cy={region.coords.split(',')[1]}
            r={region.coords.split(',')[2]}
            onClick={() => handleRegionClick(region.name)}
            className={`cursor-pointer transition-all ${
              selectedRegion === region.name
                ? 'fill-red-500 opacity-60' // Estilo da região selecionada
                : 'fill-sky-500 opacity-40 hover:opacity-60' // Estilo da região não selecionada
            }`}
          />
        ))}
      </svg>
    </div>
  );
};

export default BodyMap;