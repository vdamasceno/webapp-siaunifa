import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    // Aplicando as cores do nosso tema
    <main className="bg-background flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          {/* TROCANDO O LOGO DA FAB PELO DA UNIFA */}
          <Image
            src="/logo-unifa.png" // <-- VERIFIQUE SE ESTE É O NOME CORRETO DO ARQUIVO
            alt="Logo da Universidade da Força Aérea"
            width={150}
            height={150}
            priority
            className="mx-auto"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
          Bem-vindo ao SIA-QME FAB
        </h1>
        <p className="text-lg text-text-muted mb-10">
          O Sistema Integrado de Acompanhamento de Queixas Musculoesqueléticas é uma ferramenta dedicada à saúde e ao bem-estar da nossa tripulação.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/login" 
            className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors shadow-lg text-lg"
          >
            Acessar Sistema
          </Link>
          <Link 
            href="/register" 
            className="bg-text-main text-white font-bold py-3 px-8 rounded-lg hover:bg-text-main/90 transition-colors shadow-lg text-lg"
          >
            Registrar-se
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-4 text-text-muted text-sm">
        <p>© 2025 Prof. Dr. Vinicius Damasceno. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}