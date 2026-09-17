-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'India',
    "gst_number" TEXT NOT NULL DEFAULT '',
    "contact_person" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "company_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "logo_path" TEXT NOT NULL DEFAULT '/assets/careyu-logo.png',
    "default_gst" DECIMAL(5,2) NOT NULL,
    "default_quotation_validity" TEXT NOT NULL,
    "default_payment_terms" TEXT NOT NULL,
    "default_warranty" TEXT NOT NULL,
    "default_amc_note" TEXT NOT NULL,
    "default_software_development" TEXT NOT NULL,
    "signature_name" TEXT NOT NULL,
    "signature_designation" TEXT NOT NULL,
    "footer_tagline" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "quotation_date" DATE NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_location" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_company" TEXT NOT NULL,
    "customer_id" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "freight" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "installation_charge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gst_percentage" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "gst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_in_words" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "company_snapshot" JSONB NOT NULL,
    "pdf_path" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "serial_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_terms" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "software_development" TEXT NOT NULL,
    "quotation_validity" TEXT NOT NULL,
    "payment_terms" TEXT NOT NULL,
    "warranty" TEXT NOT NULL,
    "general_terms" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "liability" TEXT NOT NULL,
    "sales_terms" TEXT NOT NULL,
    "insurance" TEXT NOT NULL,
    "arbitration" TEXT NOT NULL,
    "amc_note" TEXT NOT NULL,

    CONSTRAINT "quotation_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_quotation_date_idx" ON "quotations"("quotation_date");

-- CreateIndex
CREATE INDEX "quotations_client_company_idx" ON "quotations"("client_company");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_terms_quotation_id_key" ON "quotation_terms"("quotation_id");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_terms" ADD CONSTRAINT "quotation_terms_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

