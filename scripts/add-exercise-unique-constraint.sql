-- Add unique constraint for exercise deduplication
ALTER TABLE exercise_library 
ADD CONSTRAINT exercise_unique_name_equipment_gender 
UNIQUE (name, equipment, gender);
