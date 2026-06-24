-- CreateTable: listas globais (modelo por usuário)
CREATE TABLE "global_checklists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable: itens das listas globais
CREATE TABLE "global_checklist_items" (
    "id" TEXT NOT NULL,
    "global_checklist_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "responsible" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "global_checklists_user_id_idx" ON "global_checklists"("user_id");
CREATE INDEX "global_checklist_items_global_checklist_id_idx" ON "global_checklist_items"("global_checklist_id");

-- AddForeignKey
ALTER TABLE "global_checklists" ADD CONSTRAINT "global_checklists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global_checklist_items" ADD CONSTRAINT "global_checklist_items_global_checklist_id_fkey" FOREIGN KEY ("global_checklist_id") REFERENCES "global_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recriação: zera os checklists das viagens existentes para que sejam
-- regenerados a partir dos modelos globais (decisão: recriar a partir dos globais).
DELETE FROM "checklists";
