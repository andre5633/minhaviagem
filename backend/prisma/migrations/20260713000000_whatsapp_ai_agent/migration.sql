-- WhatsApp + agente de IA

CREATE TABLE "whatsapp_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wa_id" TEXT,
    "phone" TEXT,
    "code" TEXT,
    "code_expires_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_links_user_id_key" ON "whatsapp_links"("user_id");
CREATE UNIQUE INDEX "whatsapp_links_wa_id_key" ON "whatsapp_links"("wa_id");
CREATE INDEX "whatsapp_links_code_idx" ON "whatsapp_links"("code");

ALTER TABLE "whatsapp_links" ADD CONSTRAINT "whatsapp_links_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "wa_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wa_message_id" TEXT,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wa_messages_wa_message_id_key" ON "wa_messages"("wa_message_id");
CREATE INDEX "wa_messages_user_id_created_at_idx" ON "wa_messages"("user_id", "created_at");

ALTER TABLE "wa_messages" ADD CONSTRAINT "wa_messages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_settings" (
    "user_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "monthly_message_cap" INTEGER,
    "monthly_cost_cap_usd" DECIMAL(10,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cache_read_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(12,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_usage_user_id_created_at_idx" ON "ai_usage"("user_id", "created_at");

ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
