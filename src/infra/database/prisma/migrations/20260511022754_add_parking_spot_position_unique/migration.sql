-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_parking_lot_id_floor_row_column_key" ON "parking_spots"("parking_lot_id", "floor", "row", "column");
