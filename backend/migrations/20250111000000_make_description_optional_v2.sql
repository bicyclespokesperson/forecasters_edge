-- Make course condition description optional (v2 with current timestamp)
ALTER TABLE course_conditions ALTER COLUMN description DROP NOT NULL;