-- CreateTable: cache global das cotações de moedas
CREATE TABLE "currency_rates" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(14,4) NOT NULL,
    "pct_change" TEXT,
    "fetched_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("code")
);
