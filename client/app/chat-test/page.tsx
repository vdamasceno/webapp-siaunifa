'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ChatTestPage() {
    const { authFetch } = useAuth();
    const [complaintId, setComplaintId] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchMessages = async () => {
        if (!complaintId) {
            setError('Por favor, insira um ID de queixa.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setMessages([]);

        try {
            const response = await authFetch(`/api/complaints/${complaintId}/messages`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha ao buscar as mensagens.');
            }
            const data = await response.json();
            setMessages(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Página de Teste da API de Chat</h1>
            <p className="mb-6 text-gray-600">Use esta página para verificar se o backend está retornando o histórico de mensagens de uma queixa.</p>
            
            <div className="flex items-center gap-4 p-4 border rounded-md bg-white">
                <label htmlFor="complaintId" className="font-semibold">ID da Queixa:</label>
                <input
                    type="text"
                    id="complaintId"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md"
                    placeholder="Ex: 66"
                />
                <button
                    onClick={handleFetchMessages}
                    disabled={isLoading}
                    className="bg-sky-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-800 disabled:bg-gray-400"
                >
                    {isLoading ? 'Buscando...' : 'Buscar Mensagens'}
                </button>
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold">Resultado:</h2>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                
                {messages.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md space-y-2">
                        <h3 className="font-bold">Histórico da Conversa (ID da Queixa: {complaintId})</h3>
                        {messages.map(msg => (
                            <div key={msg.id} className="p-2 border-b">
                                <p><strong>{msg.sender_name}</strong> <span className="text-xs text-gray-500">({new Date(msg.created_at).toLocaleString('pt-BR')})</span>:</p>
                                <p>{msg.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && !error && messages.length === 0 && (
                    <p className="text-gray-500 mt-2">Nenhuma mensagem encontrada ou busca ainda não realizada.</p>
                )}
            </div>
        </main>
    );
}