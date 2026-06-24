-- AddColumn: data do último login do usuário (atualizada a cada login Google)
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMPTZ;
