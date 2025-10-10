'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, RefreshCw } from 'lucide-react';

interface Message {
    id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    created_at: string;
}

interface ChatBoxProps {
    complaintId: string;
}

export default function ChatBox({ complaintId }: ChatBoxProps) {
    const { authFetch, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`/api/complaints/${complaintId}/messages`);
            if (!response.ok) throw new Error("Falha ao carregar mensagens.");
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (complaintId) {
            fetchMessages();
        }
    }, [complaintId, authFetch]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const response = await authFetch(`/api/complaints/${complaintId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content: newMessage }),
            });
            if (!response.ok) throw new Error("Falha ao enviar mensagem.");
            
            setNewMessage(''); // Limpa o campo de texto
            fetchMessages(); // Busca as mensagens novamente para incluir a nova
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-800">Mensagens da Queixa #{complaintId}</h2>
                <button onClick={fetchMessages} disabled={isLoading} className="p-2 hover:bg-gray-100 rounded-full">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''}/>
                </button>
            </div>

            <div className="h-96 overflow-y-auto flex flex-col gap-4 pr-4">
                {isLoading ? (
                    <p className="text-center text-gray-500">Carregando mensagens...</p>
                ) : messages.length > 0 ? (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="font-bold text-sm">{msg.sender_name}</p>
                                <p className="text-base">{msg.content}</p>
                                <p className="text-xs text-right opacity-75 mt-1">{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">Nenhuma mensagem nesta conversa ainda. Seja o primeiro a enviar!</p>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-4">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md resize-none"
                    placeholder="Digite sua mensagem..."
                    rows={2}
                    disabled={isSending}
                />
                <button type="submit" disabled={isSending} className="bg-sky-700 text-white font-bold p-3 rounded-lg self-end hover:bg-sky-800 disabled:bg-gray-400">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}