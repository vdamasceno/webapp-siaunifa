'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PILOT');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Pegamos a função de login do contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao registrar.');
      }

      // ★★★ MUDANÇA AQUI ★★★
      if (data.token) {
        // 1. Usamos a função login do nosso contexto para autenticar o usuário
        login(data.token);
        
        // 2. Avisamos e redirecionamos para a nova Etapa 2
        alert('Usuário registrado com sucesso! Agora, por favor, complete seu perfil.');
        router.push('/register/step2'); // <-- Redirecionamento para a nova página
      } else {
        throw new Error('Ocorreu um erro inesperado. Tente fazer o login manualmente.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      
      {/* Container Principal */}
      <div className="p-8 bg-card rounded-xl shadow-lg border border-border w-full max-w-md">
        
        {/* Logos */}
        <div className="flex justify-center items-center gap-6 mb-8">
          <Image 
            src="/logo-unifa.png" // <-- VERIFIQUE O NOME DO ARQUIVO
            alt="Logo da UNIFA" 
            width={80} 
            height={80}
            priority 
          />
          <Image 
            src="/logo-ppgdho.png" // <-- VERIFIQUE O NOME DO ARQUIVO
            alt="Logo PPGDHO" 
            width={80} 
            height={80}
            priority 
          />
        </div>

        <h1 className="text-2xl font-bold mb-1 text-center text-text-main">Criar Nova Conta</h1>
        <p className="text-text-muted text-center mb-6">Preencha os campos para se registrar.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="name" className="block text-text-main mb-2 font-semibold">Nome Completo</label>
            <input
              type="text" id="name" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent" required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-text-main mb-2 font-semibold">Email</label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent" required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-text-main mb-2 font-semibold">Senha</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent" required
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-text-main mb-2 font-semibold">Tipo de Conta</label>
            <select
              id="role" value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="PILOT">Piloto</option>
              <option value="HEALTH_PROFESSIONAL">Profissional de Saúde</option>
            </select>
          </div>
          
          {error && <p className="text-danger text-center bg-danger/10 p-3 rounded-lg">{error}</p>}
          
          <div className="pt-2">
            <button
              type="submit" disabled={isLoading}
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-primary/50"
            >
              {isLoading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6">
            <Link href="/login" className="text-sm text-primary hover:underline">
                Já tem uma conta? Faça o login
            </Link>
        </div>
      </div>

      <div className="mt-6 text-center text-text-muted text-xs max-w-md">
          <p>Este instrumento é fruto da Dissertação de Mestrado do Programa de Pós-Graduação em Desempenho Humano Operacional (PPGDHO) da Universidade da Força Aérea (UNIFA).</p>
      </div>
    </div>
  );
}