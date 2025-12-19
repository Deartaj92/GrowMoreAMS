-- Migration: Seed sample data
-- Date: 2024-01-XX
-- Description: Add 50 random Pakistani students, 10 programs, and schedules

-- Insert 10 Programs
INSERT INTO programs (academy_no, code, name, description, duration, duration_unit, status) VALUES
('1', 'PROG001', 'Islamic Studies', 'Comprehensive Islamic education program', 2, 'years', 'active'),
('1', 'PROG002', 'Quran Memorization', 'Hifz program for Quran memorization', 3, 'years', 'active'),
('1', 'PROG003', 'Arabic Language', 'Arabic language learning program', 1, 'years', 'active'),
('1', 'PROG004', 'Hadith Studies', 'Advanced Hadith studies program', 2, 'years', 'active'),
('1', 'PROG005', 'Fiqh Studies', 'Islamic jurisprudence program', 2, 'years', 'active'),
('1', 'PROG006', 'Tajweed', 'Quran recitation with proper Tajweed', 1, 'years', 'active'),
('1', 'PROG007', 'Islamic History', 'Comprehensive Islamic history program', 1, 'years', 'active'),
('1', 'PROG008', 'Tafsir', 'Quranic exegesis program', 2, 'years', 'active'),
('1', 'PROG009', 'Seerah', 'Prophet Muhammad (PBUH) biography program', 1, 'years', 'active'),
('1', 'PROG010', 'Islamic Ethics', 'Islamic moral and ethical studies', 1, 'years', 'active')
ON CONFLICT (academy_no, code) DO NOTHING;

-- Insert 50 Random Pakistani Students
INSERT INTO students (academy_no, name, phone, admission_date, notification_channel, dob, gender, religion, nationality, status, father_name, father_mobile, father_occupation, qualification_class) VALUES
('1', 'Ahmed Ali', '03001234567', '2024-01-15', 'whatsapp', '2010-05-20', 'Male', 'Muslim', 'Pakistani', 'active', 'Ali Khan', '03001234568', 'Businessman', 'Class 8'),
('1', 'Fatima Hassan', '03001234569', '2024-01-16', 'whatsapp', '2011-03-12', 'Female', 'Muslim', 'Pakistani', 'active', 'Hassan Ahmed', '03001234570', 'Teacher', 'Class 7'),
('1', 'Muhammad Usman', '03001234571', '2024-01-17', 'sms', '2009-08-25', 'Male', 'Muslim', 'Pakistani', 'active', 'Usman Malik', '03001234572', 'Engineer', 'Class 9'),
('1', 'Ayesha Khan', '03001234573', '2024-01-18', 'whatsapp', '2012-01-30', 'Female', 'Muslim', 'Pakistani', 'active', 'Khan Sahab', '03001234574', 'Doctor', 'Class 6'),
('1', 'Hassan Raza', '03001234575', '2024-01-19', 'whatsapp', '2010-11-15', 'Male', 'Muslim', 'Pakistani', 'active', 'Raza Ali', '03001234576', 'Shopkeeper', 'Class 8'),
('1', 'Zainab Abbas', '03001234577', '2024-01-20', 'whatsapp', '2011-07-22', 'Female', 'Muslim', 'Pakistani', 'active', 'Abbas Hussain', '03001234578', 'Farmer', 'Class 7'),
('1', 'Bilal Ahmed', '03001234579', '2024-01-21', 'sms', '2009-12-05', 'Male', 'Muslim', 'Pakistani', 'active', 'Ahmed Shah', '03001234580', 'Driver', 'Class 9'),
('1', 'Maryam Ali', '03001234581', '2024-01-22', 'whatsapp', '2012-04-18', 'Female', 'Muslim', 'Pakistani', 'active', 'Ali Raza', '03001234582', 'Clerk', 'Class 6'),
('1', 'Omar Farooq', '03001234583', '2024-01-23', 'whatsapp', '2010-09-10', 'Male', 'Muslim', 'Pakistani', 'active', 'Farooq Khan', '03001234584', 'Businessman', 'Class 8'),
('1', 'Sana Malik', '03001234585', '2024-01-24', 'whatsapp', '2011-06-28', 'Female', 'Muslim', 'Pakistani', 'active', 'Malik Saeed', '03001234586', 'Teacher', 'Class 7'),
('1', 'Tariq Hussain', '03001234587', '2024-01-25', 'sms', '2009-02-14', 'Male', 'Muslim', 'Pakistani', 'active', 'Hussain Ali', '03001234588', 'Engineer', 'Class 9'),
('1', 'Hira Shah', '03001234589', '2024-01-26', 'whatsapp', '2012-10-05', 'Female', 'Muslim', 'Pakistani', 'active', 'Shah Mehmood', '03001234590', 'Doctor', 'Class 6'),
('1', 'Yusuf Khan', '03001234591', '2024-01-27', 'whatsapp', '2010-01-20', 'Male', 'Muslim', 'Pakistani', 'active', 'Khan Naseem', '03001234592', 'Shopkeeper', 'Class 8'),
('1', 'Amina Raza', '03001234593', '2024-01-28', 'whatsapp', '2011-08-12', 'Female', 'Muslim', 'Pakistani', 'active', 'Raza Ahmed', '03001234594', 'Farmer', 'Class 7'),
('1', 'Hamza Ali', '03001234595', '2024-01-29', 'sms', '2009-05-30', 'Male', 'Muslim', 'Pakistani', 'active', 'Ali Hassan', '03001234596', 'Driver', 'Class 9'),
('1', 'Khadija Abbas', '03001234597', '2024-01-30', 'whatsapp', '2012-03-25', 'Female', 'Muslim', 'Pakistani', 'active', 'Abbas Ali', '03001234598', 'Clerk', 'Class 6'),
('1', 'Ibrahim Malik', '03001234599', '2024-02-01', 'whatsapp', '2010-07-18', 'Male', 'Muslim', 'Pakistani', 'active', 'Malik Usman', '03001234600', 'Businessman', 'Class 8'),
('1', 'Sumayya Khan', '03001234601', '2024-02-02', 'whatsapp', '2011-11-08', 'Female', 'Muslim', 'Pakistani', 'active', 'Khan Tariq', '03001234602', 'Teacher', 'Class 7'),
('1', 'Abdullah Raza', '03001234603', '2024-02-03', 'sms', '2009-04-22', 'Male', 'Muslim', 'Pakistani', 'active', 'Raza Bilal', '03001234604', 'Engineer', 'Class 9'),
('1', 'Ruqayya Hussain', '03001234605', '2024-02-04', 'whatsapp', '2012-09-15', 'Female', 'Muslim', 'Pakistani', 'active', 'Hussain Omar', '03001234606', 'Doctor', 'Class 6'),
('1', 'Zaid Ahmed', '03001234607', '2024-02-05', 'whatsapp', '2010-12-03', 'Male', 'Muslim', 'Pakistani', 'active', 'Ahmed Yusuf', '03001234608', 'Shopkeeper', 'Class 8'),
('1', 'Noor Fatima', '03001234609', '2024-02-06', 'whatsapp', '2011-02-28', 'Female', 'Muslim', 'Pakistani', 'active', 'Fatima Ali', '03001234610', 'Farmer', 'Class 7'),
('1', 'Umar Hassan', '03001234611', '2024-02-07', 'sms', '2009-10-11', 'Male', 'Muslim', 'Pakistani', 'active', 'Hassan Hamza', '03001234612', 'Driver', 'Class 9'),
('1', 'Sara Ali', '03001234613', '2024-02-08', 'whatsapp', '2012-06-20', 'Female', 'Muslim', 'Pakistani', 'active', 'Ali Ibrahim', '03001234614', 'Clerk', 'Class 6'),
('1', 'Talha Khan', '03001234615', '2024-02-09', 'whatsapp', '2010-03-07', 'Male', 'Muslim', 'Pakistani', 'active', 'Khan Abdullah', '03001234616', 'Businessman', 'Class 8'),
('1', 'Layla Malik', '03001234617', '2024-02-10', 'whatsapp', '2011-09-14', 'Female', 'Muslim', 'Pakistani', 'active', 'Malik Zaid', '03001234618', 'Teacher', 'Class 7'),
('1', 'Haris Raza', '03001234619', '2024-02-11', 'sms', '2009-01-26', 'Male', 'Muslim', 'Pakistani', 'active', 'Raza Umar', '03001234620', 'Engineer', 'Class 9'),
('1', 'Aisha Abbas', '03001234621', '2024-02-12', 'whatsapp', '2012-08-09', 'Female', 'Muslim', 'Pakistani', 'active', 'Abbas Talha', '03001234622', 'Doctor', 'Class 6'),
('1', 'Saad Hussain', '03001234623', '2024-02-13', 'whatsapp', '2010-05-17', 'Male', 'Muslim', 'Pakistani', 'active', 'Hussain Haris', '03001234624', 'Shopkeeper', 'Class 8'),
('1', 'Hafsa Shah', '03001234625', '2024-02-14', 'whatsapp', '2011-12-01', 'Female', 'Muslim', 'Pakistani', 'active', 'Shah Saad', '03001234626', 'Farmer', 'Class 7'),
('1', 'Rayyan Ahmed', '03001234627', '2024-02-15', 'sms', '2009-07-23', 'Male', 'Muslim', 'Pakistani', 'active', 'Ahmed Rayyan', '03001234628', 'Driver', 'Class 9'),
('1', 'Mariam Ali', '03001234629', '2024-02-16', 'whatsapp', '2012-04-12', 'Female', 'Muslim', 'Pakistani', 'active', 'Ali Rayyan', '03001234630', 'Clerk', 'Class 6'),
('1', 'Zain Khan', '03001234631', '2024-02-17', 'whatsapp', '2010-11-29', 'Male', 'Muslim', 'Pakistani', 'active', 'Khan Zain', '03001234632', 'Businessman', 'Class 8'),
('1', 'Hania Raza', '03001234633', '2024-02-18', 'whatsapp', '2011-06-06', 'Female', 'Muslim', 'Pakistani', 'active', 'Raza Zain', '03001234634', 'Teacher', 'Class 7'),
('1', 'Fahad Malik', '03001234635', '2024-02-19', 'sms', '2009-09-19', 'Male', 'Muslim', 'Pakistani', 'active', 'Malik Fahad', '03001234636', 'Engineer', 'Class 9'),
('1', 'Zara Hussain', '03001234637', '2024-02-20', 'whatsapp', '2012-01-13', 'Female', 'Muslim', 'Pakistani', 'active', 'Hussain Fahad', '03001234638', 'Doctor', 'Class 6'),
('1', 'Arham Ali', '03001234639', '2024-02-21', 'whatsapp', '2010-08-27', 'Male', 'Muslim', 'Pakistani', 'active', 'Ali Arham', '03001234640', 'Shopkeeper', 'Class 8'),
('1', 'Iqra Abbas', '03001234641', '2024-02-22', 'whatsapp', '2011-03-04', 'Female', 'Muslim', 'Pakistani', 'active', 'Abbas Arham', '03001234642', 'Farmer', 'Class 7'),
('1', 'Daniyal Khan', '03001234643', '2024-02-23', 'sms', '2009-12-16', 'Male', 'Muslim', 'Pakistani', 'active', 'Khan Daniyal', '03001234644', 'Driver', 'Class 9'),
('1', 'Nimra Shah', '03001234645', '2024-02-24', 'whatsapp', '2012-10-02', 'Female', 'Muslim', 'Pakistani', 'active', 'Shah Daniyal', '03001234646', 'Clerk', 'Class 6'),
('1', 'Ehsan Raza', '03001234647', '2024-02-25', 'whatsapp', '2010-02-21', 'Male', 'Muslim', 'Pakistani', 'active', 'Raza Ehsan', '03001234648', 'Businessman', 'Class 8'),
('1', 'Sidra Malik', '03001234649', '2024-02-26', 'whatsapp', '2011-07-30', 'Female', 'Muslim', 'Pakistani', 'active', 'Malik Ehsan', '03001234650', 'Teacher', 'Class 7'),
('1', 'Waleed Hussain', '03001234651', '2024-02-27', 'sms', '2009-04-08', 'Male', 'Muslim', 'Pakistani', 'active', 'Hussain Waleed', '03001234652', 'Engineer', 'Class 9'),
('1', 'Areeba Ali', '03001234653', '2024-02-28', 'whatsapp', '2012-11-24', 'Female', 'Muslim', 'Pakistani', 'active', 'Ali Waleed', '03001234654', 'Doctor', 'Class 6'),
('1', 'Muneeb Khan', '03001234655', '2024-03-01', 'whatsapp', '2010-06-11', 'Male', 'Muslim', 'Pakistani', 'active', 'Khan Muneeb', '03001234656', 'Shopkeeper', 'Class 8'),
('1', 'Hoorain Abbas', '03001234657', '2024-03-02', 'whatsapp', '2011-01-17', 'Female', 'Muslim', 'Pakistani', 'active', 'Abbas Muneeb', '03001234658', 'Farmer', 'Class 7'),
('1', 'Shayan Raza', '03001234659', '2024-03-03', 'sms', '2009-08-03', 'Male', 'Muslim', 'Pakistani', 'active', 'Raza Shayan', '03001234660', 'Driver', 'Class 9'),
('1', 'Alishba Shah', '03001234661', '2024-03-04', 'whatsapp', '2012-05-19', 'Female', 'Muslim', 'Pakistani', 'active', 'Shah Shayan', '03001234662', 'Clerk', 'Class 6'),
('1', 'Usama Malik', '03001234663', '2024-03-05', 'whatsapp', '2010-10-26', 'Male', 'Muslim', 'Pakistani', 'active', 'Malik Usama', '03001234664', 'Businessman', 'Class 8'),
('1', 'Mehak Hussain', '03001234665', '2024-03-06', 'whatsapp', '2011-04-14', 'Female', 'Muslim', 'Pakistani', 'active', 'Hussain Usama', '03001234666', 'Teacher', 'Class 7');

-- Get program IDs for schedule creation (assuming they were just inserted)
-- Note: In production, you might want to use specific IDs or a subquery
DO $$
DECLARE
    prog1_id INTEGER;
    prog2_id INTEGER;
    prog3_id INTEGER;
    prog4_id INTEGER;
    prog5_id INTEGER;
    prog6_id INTEGER;
    prog7_id INTEGER;
    prog8_id INTEGER;
    prog9_id INTEGER;
    prog10_id INTEGER;
BEGIN
    -- Get program IDs
    SELECT id INTO prog1_id FROM programs WHERE academy_no = '1' AND code = 'PROG001';
    SELECT id INTO prog2_id FROM programs WHERE academy_no = '1' AND code = 'PROG002';
    SELECT id INTO prog3_id FROM programs WHERE academy_no = '1' AND code = 'PROG003';
    SELECT id INTO prog4_id FROM programs WHERE academy_no = '1' AND code = 'PROG004';
    SELECT id INTO prog5_id FROM programs WHERE academy_no = '1' AND code = 'PROG005';
    SELECT id INTO prog6_id FROM programs WHERE academy_no = '1' AND code = 'PROG006';
    SELECT id INTO prog7_id FROM programs WHERE academy_no = '1' AND code = 'PROG007';
    SELECT id INTO prog8_id FROM programs WHERE academy_no = '1' AND code = 'PROG008';
    SELECT id INTO prog9_id FROM programs WHERE academy_no = '1' AND code = 'PROG009';
    SELECT id INTO prog10_id FROM programs WHERE academy_no = '1' AND code = 'PROG010';

    -- Insert Schedules for Programs
    -- Program 1: Islamic Studies (Monday, Wednesday, Friday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog1_id, 1, '09:00:00', '10:30:00', 'Quran', 'Maulana Ahmed', 'Room 101', true),
    ('1', prog1_id, 3, '09:00:00', '10:30:00', 'Hadith', 'Maulana Ahmed', 'Room 101', true),
    ('1', prog1_id, 5, '09:00:00', '10:30:00', 'Fiqh', 'Maulana Ahmed', 'Room 101', true);

    -- Program 2: Quran Memorization (Daily)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog2_id, 0, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true),
    ('1', prog2_id, 1, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true),
    ('1', prog2_id, 2, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true),
    ('1', prog2_id, 3, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true),
    ('1', prog2_id, 4, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true),
    ('1', prog2_id, 5, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true),
    ('1', prog2_id, 6, '08:00:00', '10:00:00', 'Hifz', 'Hafiz Muhammad', 'Room 102', true);

    -- Program 3: Arabic Language (Tuesday, Thursday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog3_id, 2, '14:00:00', '15:30:00', 'Arabic Grammar', 'Ustadh Ali', 'Room 103', true),
    ('1', prog3_id, 4, '14:00:00', '15:30:00', 'Arabic Conversation', 'Ustadh Ali', 'Room 103', true);

    -- Program 4: Hadith Studies (Monday, Wednesday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog4_id, 1, '11:00:00', '12:30:00', 'Sahih Bukhari', 'Maulana Hassan', 'Room 104', true),
    ('1', prog4_id, 3, '11:00:00', '12:30:00', 'Sahih Muslim', 'Maulana Hassan', 'Room 104', true);

    -- Program 5: Fiqh Studies (Tuesday, Thursday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog5_id, 2, '11:00:00', '12:30:00', 'Hanafi Fiqh', 'Maulana Usman', 'Room 105', true),
    ('1', prog5_id, 4, '11:00:00', '12:30:00', 'Shafi Fiqh', 'Maulana Usman', 'Room 105', true);

    -- Program 6: Tajweed (Daily)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog6_id, 0, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true),
    ('1', prog6_id, 1, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true),
    ('1', prog6_id, 2, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true),
    ('1', prog6_id, 3, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true),
    ('1', prog6_id, 4, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true),
    ('1', prog6_id, 5, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true),
    ('1', prog6_id, 6, '16:00:00', '17:00:00', 'Tajweed Rules', 'Qari Ahmed', 'Room 106', true);

    -- Program 7: Islamic History (Friday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog7_id, 5, '10:00:00', '11:30:00', 'Early Islamic History', 'Dr. Raza', 'Room 107', true);

    -- Program 8: Tafsir (Monday, Wednesday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog8_id, 1, '15:00:00', '16:30:00', 'Tafsir Ibn Kathir', 'Maulana Bilal', 'Room 108', true),
    ('1', prog8_id, 3, '15:00:00', '16:30:00', 'Tafsir Al-Jalalayn', 'Maulana Bilal', 'Room 108', true);

    -- Program 9: Seerah (Tuesday, Thursday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog9_id, 2, '15:00:00', '16:30:00', 'Prophet Life', 'Maulana Tariq', 'Room 109', true),
    ('1', prog9_id, 4, '15:00:00', '16:30:00', 'Companions Life', 'Maulana Tariq', 'Room 109', true);

    -- Program 10: Islamic Ethics (Friday)
    INSERT INTO schedules (academy_no, program_id, day_of_week, start_time, end_time, subject_name, instructor_name, room_number, is_active) VALUES
    ('1', prog10_id, 5, '14:00:00', '15:30:00', 'Islamic Morals', 'Maulana Yousuf', 'Room 110', true);

END $$;

