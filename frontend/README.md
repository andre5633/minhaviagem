# Minha Viagem Organizada — Frontend

Controle financeiro de viagens. SPA responsiva (mobile-first, com layout desktop) construída em **React + Vite + TypeScript + Tailwind CSS**, com tema **claro/escuro** seguindo o manual de marca _Leva Meu Guia_.

> Os dados são **mockados em memória** — o app roda imediatamente, sem backend. A camada de API (endpoints abaixo) é fácil de plugar depois.

## Stack

- **React 18** + **Vite 5** + **TypeScript**
- **Tailwind CSS 3** (tokens de tema via CSS variables)
- **React Router v6** (rotas protegidas)
- **lucide-react** (ícones)
- **Recharts** (gráficos: rosca de categorias + barras por dia)

## Rodando

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. Na tela de login, clique em **Entrar com Google** (mock) para acessar.

Scripts:

| Script              | O que faz                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | servidor de desenvolvimento (HMR)  |
| `npm run build`     | build de produção em `dist/`       |
| `npm run preview`   | serve o build local                |
| `npm run typecheck` | checagem de tipos (tsc --noEmit)   |

## Estrutura

```
frontend/
├── public/                 # logos da marca (claro/escuro)
├── index.html              # aplica o tema salvo antes do React montar
└── src/
    ├── main.tsx
    ├── App.tsx             # React Router + rotas protegidas
    ├── index.css           # tokens de tema (claro/escuro) + utilitários
    ├── types.ts            # tipos de domínio
    ├── data/
    │   └── mockData.ts     # usuário, viagens e despesas (datas relativas a hoje)
    ├── lib/
    │   ├── formatters.ts   # BRL, datas, máscara de moeda
    │   ├── summary.ts      # computeSummary (= GET /trips/:id/summary)
    │   ├── categories.ts   # categorias + capas (cores/ícones da marca)
    │   └── cn.ts           # helpers de classe/cor
    ├── store/
    │   └── AppContext.tsx  # estado global (auth, viagens, despesas, tema, toasts, sheet)
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useTrips.ts
    │   └── useExpenses.ts
    ├── components/
    │   ├── ui/             # Button, Card, Badge, Spinner, Skeleton, Avatar,
    │   │                   # ToastStack, EmptyState, OverlaySheet, GoogleIcon
    │   ├── layout/         # AppShell, Sidebar, BottomTabBar, FAB, ThemeToggle, ProtectedRoute
    │   ├── domain/         # TripCard, TripCover, CoverPicker, TripHeader, MetricCard,
    │   │                   # BudgetProgress, ExpenseItem, CategoryChip, ExpenseForm
    │   └── charts/         # CategoryDonut, DailyBars (Recharts)
    └── pages/
        ├── Login.tsx
        ├── TripList.tsx
        ├── TripForm.tsx
        ├── TripDashboard.tsx
        ├── ExpenseList.tsx
        └── Profile.tsx
```

## Responsividade

Layout único e adaptativo (breakpoint `lg` = 1024px):

- **Mobile:** barra de abas inferior (Painel / Despesas / Perfil), FAB, despesas em cards, "lançar despesa" como _bottom sheet_.
- **Desktop:** sidebar de navegação, despesas em tabela, "lançar despesa" como _modal_ centralizado.

## Tema (claro/escuro)

- Tokens definidos em `src/index.css` sob `[data-theme="light"]` e `[data-theme="dark"]`, expostos ao Tailwind em `tailwind.config.js` (`bg-surface`, `text-ink`, `text-primary`, etc.).
- Regra do manual de marca: **fundo claro → acento Sunset (#EF5244)**; **fundo escuro → acento Sunny (#FEAC3A)**. As logos trocam automaticamente via a variável `--mv-logo`.
- O tema é persistido em `localStorage` (`mv-theme`) e aplicado antes do React montar (sem flash). Alterne pelo botão **Claro/Escuro** (sidebar no desktop, Perfil no mobile).

## Rotas

| Rota                  | Tela                         |
| --------------------- | ---------------------------- |
| `/login`              | Login (Google mock)          |
| `/trips`              | Lista de viagens             |
| `/trips/new`          | Criar viagem (2 passos)      |
| `/trips/:id`          | Dashboard da viagem          |
| `/trips/:id/edit`     | Editar viagem                |
| `/trips/:id/expenses` | Lista de despesas            |
| `/profile`            | Perfil                       |

## Plugando a API real

O estado vive em `src/store/AppContext.tsx` e é exposto pelos hooks `useAuth` / `useTrips` / `useExpenses`. Para integrar o backend:

1. Crie `src/services/api.ts` (instância Axios/fetch com interceptor de JWT).
2. Substitua as ações do `AppContext` (ou os hooks) por chamadas reais — sugerido **TanStack Query** para cache/loading:

```
POST   /auth/google          → JWT
GET    /auth/me
GET    /trips                 GET /trips/:id   POST /trips   PUT /trips/:id   DELETE /trips/:id
GET    /trips/:id/expenses    POST /trips/:id/expenses   PUT /expenses/:id   DELETE /expenses/:id
GET    /trips/:id/summary     → ver computeSummary() em src/lib/summary.ts
```

3. Os tipos em `src/types.ts` usam camelCase; mapeie de/para o snake_case do backend (`start_date` ↔ `startDate`, `total_budget` ↔ `totalBudget`, `expense_date` ↔ `expenseDate`) na camada de serviço.

---

Feito a partir do protótipo aprovado · marca _Leva Meu Guia / Minha Viagem Organizada_.
