import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleIcon } from '../components/ui/GoogleIcon';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useApp } from '../store/AppContext';

// Fotos padrão do sistema (public/) — as mesmas usadas como capa de viagem
const SLIDES = ['/praia.jpg', '/cidade.jpg', '/montanha.jpg'];

export function Login() {
  const { isAuthed, login } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  // redireciona se já autenticado
  useEffect(() => {
    if (isAuthed) navigate('/trips', { replace: true });
  }, [isAuthed, navigate]);

  // slideshow das fotos
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const handle = () => {
    setLoading(true);
    login(); // redireciona o navegador para o fluxo OAuth do Google
  };

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr] overflow-hidden bg-bg lg:grid-cols-[1.1fr_1fr] lg:grid-rows-1">
      <ThemeToggle className="absolute right-4 top-4 z-40" />

      {/* Arte — slideshow das fotos padrão */}
      <div className="relative overflow-hidden max-lg:m-6 max-lg:mt-16 max-lg:h-[230px] max-lg:rounded-[28px]">
        {/* fotos em cross-fade */}
        {SLIDES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
            style={{ backgroundImage: `url(${src})`, opacity: i === slide ? 1 : 0 }}
          />
        ))}

        {/* overlay para legibilidade do texto */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(239,82,68,.42) 0%, rgba(35,27,55,.82) 85%)' }}
        />

        {/* anéis decorativos */}
        <div className="absolute -right-16 -top-14 h-56 w-56 rounded-full border-2 border-white/20 lg:h-[360px] lg:w-[360px]" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full border-2 border-white/15 lg:h-60 lg:w-60" />

        <img src="/logo-escuro.png" alt="" className="absolute left-7 top-8 z-[2] w-[180px] lg:left-12 lg:top-11 lg:w-[210px]" />

        <div className="absolute inset-x-12 bottom-24 z-[2] hidden lg:block">
          <h2 className="text-[32px] font-extrabold leading-tight tracking-tight text-white drop-shadow">
            Cada real da viagem,
            <br />
            sob controle.
          </h2>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90 drop-shadow">
            Orçamento, despesas por categoria e saldo em tempo real — do planejamento ao último dia.
          </p>
        </div>

        {/* indicadores do slideshow */}
        <div className="absolute bottom-7 left-12 z-[2] hidden gap-2 lg:flex">
          {SLIDES.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Foto ${i + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === slide ? 26 : 8, background: i === slide ? '#fff' : 'rgba(255,255,255,.5)' }}
            />
          ))}
        </div>
      </div>

      {/* Painel */}
      <div className="flex items-end justify-center px-7 pb-10 lg:items-center lg:bg-surface lg:p-10">
        <div className="w-full max-w-sm">
          <div className="mv-brandlogo mb-5 h-20 w-[236px]" role="img" aria-label="Minha Viagem Organizada" />
          <h1 className="mb-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-ink lg:text-3xl">
            Bem-vindo de volta
          </h1>
          <p className="mb-8 text-[15.5px] leading-relaxed text-muted">
            Entre para acompanhar o orçamento das suas viagens.
          </p>
          <Button
            variant="google"
            size="lg"
            block
            loading={loading}
            onClick={handle}
            leftIcon={loading ? undefined : <GoogleIcon size={20} />}
          >
            {loading ? 'Conectando…' : 'Entrar com Google'}
          </Button>
          <p className="mt-5 text-center text-xs leading-relaxed text-faint">
            Ao continuar você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
