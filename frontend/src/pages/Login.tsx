import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, MapPin, Palmtree } from 'lucide-react';
import { GoogleIcon } from '../components/ui/GoogleIcon';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useApp } from '../store/AppContext';

export function Login() {
  const { isAuthed, login } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // redireciona se já autenticado
  useEffect(() => {
    if (isAuthed) navigate('/trips', { replace: true });
  }, [isAuthed, navigate]);

  const handle = () => {
    setLoading(true);
    setTimeout(() => {
      login();
      navigate('/trips', { replace: true });
    }, 1000);
  };

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr] overflow-hidden bg-bg lg:grid-cols-[1.1fr_1fr] lg:grid-rows-1">
      <ThemeToggle className="absolute right-4 top-4 z-40" />

      {/* Arte */}
      <div
        className="relative overflow-hidden max-lg:m-6 max-lg:mt-16 max-lg:h-[230px] max-lg:rounded-[28px]"
        style={{ background: 'linear-gradient(135deg, var(--mv-primary), #43346A)' }}
      >
        <img src="/logo-escuro.png" alt="" className="absolute left-7 top-8 z-[2] w-[180px] lg:left-12 lg:top-11 lg:w-[210px]" />
        <div className="absolute -right-16 -top-14 h-56 w-56 rounded-full border-2 border-white/25 lg:h-[360px] lg:w-[360px]" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full border-2 border-white/20 lg:h-60 lg:w-60" />
        <Palmtree size={64} color="rgba(255,255,255,.9)" className="absolute left-8 top-24 lg:left-[70px] lg:top-44" style={{ transform: 'rotate(-10deg)' }} />
        <Plane size={40} color="rgba(255,255,255,.95)" className="absolute right-10 top-28 lg:right-24 lg:top-44" />
        <MapPin size={30} color="rgba(255,255,255,.85)" className="absolute bottom-16 right-24 hidden lg:block" />
        <div className="absolute inset-x-12 bottom-24 hidden lg:block">
          <h2 className="text-[32px] font-extrabold leading-tight tracking-tight text-white">
            Cada real da viagem,
            <br />
            sob controle.
          </h2>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90">
            Orçamento, despesas por categoria e saldo em tempo real — do planejamento ao último dia.
          </p>
        </div>
        <span className="absolute bottom-3 left-4 rounded-md bg-black/20 px-2 py-[3px] font-mono text-[10px] font-semibold text-white/75 lg:bottom-8 lg:left-10">
          [ ilustração: viagem ]
        </span>
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
