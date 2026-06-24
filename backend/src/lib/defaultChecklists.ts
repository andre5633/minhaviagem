// Template das 3 listas padrão criadas em toda viagem (base: PDF "Checklist da Viagem").
// O responsável vem como sugestão e pode ser editado pelo usuário.

export interface DefaultTask {
  text: string;
  responsible: string;
}
export interface DefaultChecklist {
  title: string;
  tasks: DefaultTask[];
}

export const DEFAULT_CHECKLISTS: DefaultChecklist[] = [
  {
    title: 'Na Reserva',
    tasks: [
      { text: 'Reservar passagens aéreas', responsible: 'Eu' },
      { text: 'Reservar hospedagem', responsible: 'Eu' },
      { text: 'Contratar seguro viagem', responsible: 'Eu' },
      { text: 'Verificar validade do passaporte (mín. 6 meses)', responsible: 'Eu' },
      { text: 'Solicitar visto (se necessário)', responsible: 'Eu' },
      { text: 'Verificar necessidade de vacinas', responsible: 'Eu' },
      { text: 'Avisar o banco sobre a viagem', responsible: 'Todos' },
      { text: 'Salvar e-mails de confirmação', responsible: 'Eu' },
      { text: 'Adicionar a viagem ao calendário', responsible: 'Eu' },
    ],
  },
  {
    title: '7 Dias Antes da Partida',
    tasks: [
      { text: 'Fazer check-in online (quando disponível)', responsible: 'Eu' },
      { text: 'Comprar chip ou ativar roaming internacional', responsible: 'Eu' },
      { text: 'Baixar mapas offline do destino', responsible: 'Todos' },
      { text: 'Baixar apps úteis: tradutor, transporte, câmbio', responsible: 'Todos' },
      { text: 'Confirmar todas as reservas', responsible: 'Eu' },
      { text: 'Providenciar moeda estrangeira / cartão internacional', responsible: 'Eu' },
      { text: 'Começar a fazer as malas', responsible: 'Todos' },
      { text: 'Avisar família/amigos sobre a viagem', responsible: 'Eu' },
      { text: 'Rever itinerário e plano diário', responsible: 'Eu' },
    ],
  },
  {
    title: '1 Dia Antes da Partida',
    tasks: [
      { text: 'Finalizar e fechar as malas', responsible: 'Todos' },
      { text: 'Pesar malas (verificar limite da cia. aérea)', responsible: 'Todos' },
      { text: 'Separar documentos na bagagem de mão', responsible: 'Todos' },
      { text: 'Carregar todos os eletrônicos', responsible: 'Todos' },
      { text: 'Confirmar translado para o aeroporto', responsible: 'Eu' },
      { text: 'Esvaziar geladeira / organizar a casa', responsible: 'Eu' },
      { text: 'Configurar resposta automática no e-mail', responsible: 'Eu' },
      { text: 'Deixar chave com alguém de confiança', responsible: 'Eu' },
      { text: 'Conferir passaporte e documentos de todos', responsible: 'Todos' },
      { text: 'Confirmar portão e horário de embarque', responsible: 'Todos' },
    ],
  },
];
