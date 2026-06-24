-- AddColumn: marca tarefas semeadas (do template padrão) — não podem ser excluídas
ALTER TABLE "checklist_tasks" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: tarefas existentes em listas padrão que batem com o texto do template viram padrão
UPDATE "checklist_tasks" t
SET "is_default" = true
FROM "checklists" c
WHERE t."checklist_id" = c."id"
  AND c."is_default" = true
  AND t."text" IN (
    'Reservar passagens aéreas',
    'Reservar hospedagem',
    'Contratar seguro viagem',
    'Verificar validade do passaporte (mín. 6 meses)',
    'Solicitar visto (se necessário)',
    'Verificar necessidade de vacinas',
    'Avisar o banco sobre a viagem',
    'Salvar e-mails de confirmação',
    'Adicionar a viagem ao calendário',
    'Fazer check-in online (quando disponível)',
    'Comprar chip ou ativar roaming internacional',
    'Baixar mapas offline do destino',
    'Baixar apps úteis: tradutor, transporte, câmbio',
    'Confirmar todas as reservas',
    'Providenciar moeda estrangeira / cartão internacional',
    'Começar a fazer as malas',
    'Avisar família/amigos sobre a viagem',
    'Rever itinerário e plano diário',
    'Finalizar e fechar as malas',
    'Pesar malas (verificar limite da cia. aérea)',
    'Separar documentos na bagagem de mão',
    'Carregar todos os eletrônicos',
    'Confirmar translado para o aeroporto',
    'Esvaziar geladeira / organizar a casa',
    'Configurar resposta automática no e-mail',
    'Deixar chave com alguém de confiança',
    'Conferir passaporte e documentos de todos',
    'Confirmar portão e horário de embarque'
  );
