-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "rfid_card_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "job_position" TEXT,
    "branch_location" TEXT,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photo_url" TEXT,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "rfid_card_id" TEXT NOT NULL,
    "first_tap_timestamp" TIMESTAMP(3) NOT NULL,
    "tap_timestamps" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_rfid_card_id_key" ON "Guest"("rfid_card_id");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_rfid_card_id_fkey" FOREIGN KEY ("rfid_card_id") REFERENCES "Guest"("rfid_card_id") ON DELETE RESTRICT ON UPDATE CASCADE;
