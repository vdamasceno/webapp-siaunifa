'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';

interface Notification {
    id: number;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const { authFetch } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await authFetch('/api/notifications').then(res => res.json());
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };
        fetchNotifications();
    }, [authFetch]);

    const handleNotificationClick = async (notification: Notification) => {
        setIsOpen(false); // Fecha o menu
        router.push(notification.link); // Navega para o link

        // Se a notificação não foi lida, marca como lida
        if (!notification.is_read) {
            try {
                await authFetch(`/api/notifications/${notification.id}/read`, { method: 'POST' });
                // Atualiza o estado local para refletir a mudança imediatamente
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => 
                    n.id === notification.id ? { ...n, is_read: true } : n
                ));
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative">
                <Bell className="text-gray-600 hover:text-sky-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="p-2 font-bold border-b">Notificações</div>
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 ${!n.is_read ? 'font-bold' : ''}`}
                                >
                                    {n.message}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(n.created_at).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Nenhuma notificação.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}