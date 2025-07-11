-- Make course condition description optional
ALTER TABLE course_conditions ALTER COLUMN description DROP NOT NULL;