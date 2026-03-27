-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 11, 2026 at 09:02 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `school_management`
--
-- ============================================================
-- DEFAULT LOGIN CREDENTIALS
-- ============================================================
-- SUPERADMIN (System-wide access):
--   Email: superadmin@school.com
--   Password: superadmin123
--   Role: super_admin (role_001)
--   schoolId: NULL (can access all schools)
--
-- ADMIN (School-specific access):
--   Email: admin@school.com
--   Password: admin123
--   Role: school_admin (role_002)
--   schoolId: school_001 (manages only Demo School)
--
-- ADMIN (Alternative):
--   Email: admin@demoschool.com
--   Password: admin123
--   Role: school_admin (role_002)
--   schoolId: school_001 (manages only Demo School)
-- ============================================================
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'general',
  `targetAudience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`targetAudience`)),
  `priority` varchar(191) NOT NULL DEFAULT 'normal',
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(191) NOT NULL,
  `remarks` varchar(191) DEFAULT NULL,
  `markedBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `oldValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`oldValues`)),
  `newValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`newValues`)),
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `book_issues`
--

CREATE TABLE `book_issues` (
  `id` varchar(191) NOT NULL,
  `bookId` varchar(191) NOT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `staffId` varchar(191) DEFAULT NULL,
  `issueDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `dueDate` datetime(3) NOT NULL,
  `returnDate` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'issued',
  `fineAmount` decimal(10,2) DEFAULT 0.00,
  `remarks` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `level` int(11) DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 40,
  `classTeacherId` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `schoolId`, `name`, `level`, `capacity`, `classTeacherId`, `status`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('class_001', 'school_001', 'Grade 1', 1, 40, NULL, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('class_002', 'school_001', 'Grade 2', 2, 40, NULL, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('class_003', 'school_001', 'Grade 3', 3, 40, NULL, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `exams`
--

CREATE TABLE `exams` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'scheduled',
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_results`
--

CREATE TABLE `exam_results` (
  `id` varchar(191) NOT NULL,
  `examId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `subjectId` varchar(191) NOT NULL,
  `marksObtained` decimal(5,2) NOT NULL,
  `maxMarks` decimal(5,2) NOT NULL,
  `grade` varchar(191) DEFAULT NULL,
  `remarks` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fees`
--

CREATE TABLE `fees` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `frequency` varchar(191) NOT NULL DEFAULT 'monthly',
  `classId` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fees`
--

INSERT INTO `fees` (`id`, `schoolId`, `name`, `description`, `amount`, `frequency`, `classId`, `isActive`, `dueDate`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('fee_001', 'school_001', 'Tuition Fee', 'Monthly tuition fee', 500.00, 'monthly', NULL, 1, NULL, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('fee_002', 'school_001', 'Admission Fee', 'One-time admission fee', 1000.00, 'one_time', NULL, 1, NULL, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('fee_003', 'school_001', 'Grade 1 Fee', 'Grade 1 specific fee', 300.00, 'monthly', 'class_001', 1, NULL, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `library_books`
--

CREATE TABLE `library_books` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `isbn` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `author` varchar(191) NOT NULL,
  `publisher` varchar(191) DEFAULT NULL,
  `category` varchar(191) DEFAULT NULL,
  `edition` varchar(191) DEFAULT NULL,
  `totalCopies` int(11) NOT NULL DEFAULT 1,
  `availableCopies` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) DEFAULT NULL,
  `shelfNumber` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'available',
  `coverImage` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `occupation` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `relation` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent_students`
--

CREATE TABLE `parent_students` (
  `id` varchar(191) NOT NULL,
  `parentId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `relation` varchar(191) NOT NULL DEFAULT 'parent',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `feeId` varchar(191) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `paymentMethod` varchar(191) NOT NULL,
  `transactionId` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'pending',
  `remarks` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `displayName` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `displayName`, `description`, `permissions`, `isSystem`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('role_001', 'super_admin', 'Super Admin', 'Full system access', '[\"super_admin:all\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_002', 'school_admin', 'School Admin', 'School administrator', '[\"school:read\", \"school:update\", \"user:create\", \"user:read\", \"user:update\", \"user:delete\", \"student:create\", \"student:read\", \"student:update\", \"student:delete\", \"staff:create\", \"staff:read\", \"staff:update\", \"staff:delete\", \"class:create\", \"class:read\", \"class:update\", \"class:delete\", \"subject:create\", \"subject:read\", \"subject:update\", \"subject:delete\", \"exam:create\", \"exam:read\", \"exam:update\", \"exam:delete\", \"result:create\", \"result:read\", \"result:update\", \"result:delete\", \"attendance:create\", \"attendance:read\", \"attendance:update\", \"fee:create\", \"fee:read\", \"fee:update\", \"fee:delete\", \"payment:create\", \"payment:read\", \"payment:update\", \"library:create\", \"library:read\", \"library:update\", \"library:delete\", \"transport:create\", \"transport:read\", \"transport:update\", \"transport:delete\", \"announcement:create\", \"announcement:read\", \"announcement:update\", \"announcement:delete\", \"report:read\", \"report:export\", \"settings:read\", \"settings:update\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_003', 'principal', 'Principal', 'Principal role', '[\"student:read\", \"staff:read\", \"class:read\", \"subject:read\", \"exam:read\", \"result:read\", \"attendance:read\", \"fee:read\", \"payment:read\", \"announcement:create\", \"announcement:read\", \"announcement:update\", \"report:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_004', 'teacher', 'Teacher', 'Teacher role', '[\"student:read\", \"class:read\", \"subject:read\", \"exam:create\", \"exam:read\", \"exam:update\", \"result:create\", \"result:read\", \"result:update\", \"attendance:create\", \"attendance:read\", \"attendance:update\", \"announcement:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_005', 'student', 'Student', 'Student role', '[\"student:read\", \"class:read\", \"subject:read\", \"exam:read\", \"result:read\", \"attendance:read\", \"fee:read\", \"payment:read\", \"library:read\", \"announcement:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_006', 'parent', 'Parent', 'Parent role', '[\"student:read\", \"exam:read\", \"result:read\", \"attendance:read\", \"fee:read\", \"payment:read\", \"announcement:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_007', 'accountant', 'Accountant', 'Accountant role', '[\"student:read\", \"fee:create\", \"fee:read\", \"fee:update\", \"fee:delete\", \"payment:create\", \"payment:read\", \"payment:update\", \"report:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_008', 'hr_manager', 'HR Manager', 'HR Manager role', '[\"staff:create\", \"staff:read\", \"staff:update\", \"staff:delete\", \"attendance:read\", \"report:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_009', 'librarian', 'Librarian', 'Librarian role', '[\"library:create\", \"library:read\", \"library:update\", \"library:delete\", \"student:read\", \"staff:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('role_010', 'transport_manager', 'Transport Manager', 'Transport Manager role', '[\"transport:create\", \"transport:read\", \"transport:update\", \"transport:delete\", \"student:read\"]', 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `zipCode` varchar(191) DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `subscriptionPlan` varchar(191) NOT NULL DEFAULT 'free',
  `subscriptionEnds` datetime(3) DEFAULT NULL,
  `maxUsers` int(11) NOT NULL DEFAULT 50,
  `maxStudents` int(11) NOT NULL DEFAULT 500,
  `primaryColor` varchar(191) NOT NULL DEFAULT '#3b82f6',
  `secondaryColor` varchar(191) NOT NULL DEFAULT '#8b5cf6',
  `accentColor` varchar(191) NOT NULL DEFAULT '#10b981',
  `logoUrl` varchar(191) DEFAULT NULL,
  `faviconUrl` varchar(191) DEFAULT NULL,
  `defaultLanguage` varchar(191) NOT NULL DEFAULT 'en',
  `supportedLanguages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '["en", "es", "fr", "de", "hi", "ar"]' CHECK (json_valid(`supportedLanguages`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `subscriptionPlanId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`id`, `name`, `slug`, `email`, `phone`, `address`, `city`, `state`, `country`, `zipCode`, `logo`, `website`, `status`, `subscriptionPlan`, `subscriptionEnds`, `maxUsers`, `maxStudents`, `primaryColor`, `secondaryColor`, `accentColor`, `logoUrl`, `faviconUrl`, `defaultLanguage`, `supportedLanguages`, `createdAt`, `updatedAt`, `deletedAt`, `subscriptionPlanId`) VALUES
('school_001', 'Demo School', 'demo-school', 'info@demoschool.com', '+1234567890', '123 Education Street', 'New York', 'NY', 'USA', '10001', NULL, NULL, 'active', 'premium', NULL, 1000, 10000, '#3b82f6', '#8b5cf6', '#10b981', NULL, NULL, 'en', '[\"en\", \"es\", \"fr\", \"de\", \"hi\", \"ar\"]', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `capacity` int(11) NOT NULL DEFAULT 40,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `classId`, `name`, `capacity`, `status`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('section_001', 'class_001', 'A', 40, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('section_002', 'class_001', 'B', 40, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('section_003', 'class_002', 'A', 40, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('section_004', 'class_002', 'B', 40, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `employeeId` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `phone` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `designation` varchar(191) NOT NULL,
  `department` varchar(191) DEFAULT NULL,
  `joiningDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `salary` decimal(10,2) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `photo` varchar(191) DEFAULT NULL,
  `qualifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`qualifications`)),
  `experience` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_attendances`
--

CREATE TABLE `staff_attendances` (
  `id` varchar(191) NOT NULL,
  `staffId` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(191) NOT NULL,
  `checkIn` datetime(3) DEFAULT NULL,
  `checkOut` datetime(3) DEFAULT NULL,
  `remarks` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `admissionNumber` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `dateOfBirth` datetime(3) NOT NULL,
  `gender` varchar(191) NOT NULL,
  `bloodGroup` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `zipCode` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `parentPhone` varchar(191) DEFAULT NULL,
  `parentEmail` varchar(191) DEFAULT NULL,
  `photo` varchar(191) DEFAULT NULL,
  `enrollmentDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `classId` varchar(191) DEFAULT NULL,
  `sectionId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `schoolId`, `userId`, `admissionNumber`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `bloodGroup`, `address`, `city`, `state`, `country`, `zipCode`, `phone`, `email`, `parentPhone`, `parentEmail`, `photo`, `enrollmentDate`, `status`, `classId`, `sectionId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('student_001', 'school_001', NULL, 'DEM2024001', 'John', 'Doe', '2015-05-15 00:00:00.000', 'male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-06 20:49:25.000', 'active', 'class_001', 'section_001', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('student_002', 'school_001', NULL, 'DEM2024002', 'Jane', 'Smith', '2015-08-20 00:00:00.000', 'female', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-06 20:49:25.000', 'active', 'class_001', 'section_001', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('student_003', 'school_001', NULL, 'DEM2024003', 'Mike', 'Johnson', '2014-03-10 00:00:00.000', 'male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-06 20:49:25.000', 'active', 'class_002', 'section_003', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_transports`
--

CREATE TABLE `student_transports` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `routeId` varchar(191) NOT NULL,
  `pickupPoint` varchar(191) DEFAULT NULL,
  `dropPoint` varchar(191) DEFAULT NULL,
  `fare` decimal(10,2) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `startDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `endDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `classId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `teacherId` varchar(191) DEFAULT NULL,
  `credits` int(11) DEFAULT 1,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `schoolId`, `classId`, `name`, `code`, `description`, `teacherId`, `credits`, `status`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('subject_001', 'school_001', 'class_001', 'Mathematics', 'MATH101', NULL, NULL, 1, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('subject_002', 'school_001', 'class_001', 'English', 'ENG101', NULL, NULL, 1, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('subject_003', 'school_001', 'class_001', 'Science', 'SCI101', NULL, NULL, 1, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('subject_004', 'school_001', 'class_002', 'Mathematics', 'MATH201', NULL, NULL, 1, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
('subject_005', 'school_001', 'class_002', 'English', 'ENG201', NULL, NULL, 1, 'active', '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `tagline` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `monthlyPrice` decimal(10,2) NOT NULL,
  `yearlyPrice` decimal(10,2) NOT NULL,
  `originalMonthlyPrice` decimal(10,2) DEFAULT NULL,
  `originalYearlyPrice` decimal(10,2) DEFAULT NULL,
  `discount` int(11) DEFAULT 0,
  `isPopular` tinyint(1) DEFAULT 0,
  `badge` varchar(100) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `sortOrder` int(11) DEFAULT 0,
  `maxSchools` int(11) DEFAULT NULL,
  `maxStudents` int(11) DEFAULT NULL,
  `maxStaff` int(11) DEFAULT NULL,
  `storageGB` int(11) DEFAULT NULL,
  `modules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`modules`)),
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `supportLevel` varchar(50) DEFAULT 'email',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `slug`, `tagline`, `description`, `monthlyPrice`, `yearlyPrice`, `originalMonthlyPrice`, `originalYearlyPrice`, `discount`, `isPopular`, `badge`, `isActive`, `sortOrder`, `maxSchools`, `maxStudents`, `maxStaff`, `storageGB`, `modules`, `features`, `supportLevel`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('plan_001', 'Basic', 'basic', 'Perfect for small schools getting started', 'Ideal for small schools just starting their digital journey. Includes essential modules for student and staff management.', 999.00, 9590.40, 2999.00, 28790.40, 67, 0, NULL, 1, 1, 1, 500, 50, 10, '[\"student\", \"staff\", \"class\", \"subject\", \"attendance\", \"basic_reports\"]', '[\"Free SSL Certificate\", \"Weekly Auto Backups\", \"Free Site Migration\", \"Email Support\", \"Basic Reports\"]', 'email', '2026-02-09 19:26:01', '2026-02-09 19:31:59', NULL),
('plan_002', 'Premium', 'premium', 'Everything you need for growing schools', 'Comprehensive solution for growing schools. Includes all essential modules plus advanced features for better management.', 1999.00, 19190.40, 4999.00, 47990.40, 60, 1, 'MOST POPULAR', 1, 2, 3, 2000, 200, 50, '[\"student\", \"staff\", \"class\", \"subject\", \"attendance\", \"exam\", \"result\", \"fee\", \"payment\", \"library\", \"transport\", \"announcements\", \"advanced_reports\"]', '[\"Everything in Basic, plus:\", \"Free Domain for 1 year\", \"Daily Auto Backups\", \"Priority Email Support\", \"Advanced Reports & Analytics\", \"Multi-language Support\", \"Custom Branding\", \"API Access\"]', 'priority', '2026-02-09 19:26:01', '2026-02-09 19:31:59', NULL),
('plan_003', 'Business', 'business', 'Advanced features for established institutions', 'Perfect for established schools and institutions that need advanced features, custom integrations, and dedicated support.', 3999.00, 38390.40, 9999.00, 95990.40, 60, 0, NULL, 1, 3, 10, 10000, 1000, 200, '[\"student\", \"staff\", \"class\", \"subject\", \"attendance\", \"exam\", \"result\", \"fee\", \"payment\", \"library\", \"transport\", \"announcements\", \"advanced_reports\", \"custom_reports\", \"ai_analytics\", \"advanced_permissions\", \"multi_branch\", \"custom_workflows\", \"api_webhooks\", \"third_party_integrations\"]', '[\"Everything in Premium, plus:\", \"Daily & On-demand Backups\", \"Dedicated Account Manager\", \"Custom Integrations\", \"White-label Solution\", \"Advanced Security\", \"SLA Guarantee\", \"Training & Onboarding\"]', 'dedicated', '2026-02-09 19:26:01', '2026-02-09 19:31:59', NULL),
('plan_004', 'Enterprise', 'enterprise', 'Unlimited power for large organizations', 'Ultimate solution for large organizations and multi-school systems. Unlimited resources with premium support and custom development options.', 9999.00, 95990.40, 24999.00, 239990.40, 60, 0, NULL, 1, 4, NULL, NULL, NULL, NULL, '[\"student\", \"staff\", \"class\", \"subject\", \"attendance\", \"exam\", \"result\", \"fee\", \"payment\", \"library\", \"transport\", \"announcements\", \"advanced_reports\", \"custom_reports\", \"ai_analytics\", \"advanced_permissions\", \"multi_branch\", \"custom_workflows\", \"api_webhooks\", \"third_party_integrations\"]', '[\"Everything in Business, plus:\", \"Unlimited Everything\", \"Dedicated Server Option\", \"Custom Development\", \"On-premise Deployment\", \"Advanced Security Suite\", \"Compliance Support\", \"Unlimited Training\"]', 'premium', '2026-02-09 19:26:01', '2026-02-09 19:31:59', NULL),
('plan_005', 'Starter', 'starter', 'Free plan to get you started', 'Free plan with limited features to help you get started with school management.', 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 1, 0, 1, 100, 10, 5, '[\"student\", \"staff\", \"class\", \"attendance\"]', '[\"Basic Student Management\", \"Basic Staff Management\", \"Class Management\", \"Attendance Tracking\", \"Community Support\"]', 'email', '2026-02-09 19:31:59', '2026-02-09 19:31:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transport_routes`
--

CREATE TABLE `transport_routes` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `routeNumber` varchar(191) NOT NULL,
  `startPoint` varchar(191) NOT NULL,
  `endPoint` varchar(191) NOT NULL,
  `stops` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stops`)),
  `distance` decimal(8,2) DEFAULT NULL,
  `fare` decimal(10,2) DEFAULT NULL,
  `vehicleId` varchar(191) DEFAULT NULL,
  `driverId` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `schoolId` varchar(191) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `roleId` varchar(191) NOT NULL,
  `language` varchar(191) NOT NULL DEFAULT 'en',
  `timezone` varchar(191) NOT NULL DEFAULT 'UTC',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `emailVerified` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--
-- IMPORTANT: Default Login Credentials
-- ====================================
-- SUPERADMIN (System-wide access, no schoolId):
--   Email: superadmin@school.com
--   Password: superadmin123
--   Role: super_admin (role_001)
--   Access: Full system access, can manage all schools
--
-- ADMIN (School-specific access, has schoolId):
--   Email: admin@school.com
--   Password: admin123
--   Role: school_admin (role_002)
--   Access: Manages only assigned school (school_001)
--
-- ADMIN (Alternative):
--   Email: admin@demoschool.com
--   Password: admin123
--   Role: school_admin (role_002)
--   Access: Manages only assigned school (school_001)
-- ====================================

INSERT INTO `users` (`id`, `schoolId`, `email`, `password`, `firstName`, `lastName`, `phone`, `avatar`, `roleId`, `language`, `timezone`, `isActive`, `lastLoginAt`, `emailVerified`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
-- Super Admin (System Administrator - No schoolId, can access all schools)
('user_001', NULL, 'superadmin@school.com', '$2a$12$CXXLWKL75SuhhIP/aXlMH.CCYYjCrQTE8qC3DeNZ4lMOWozV8u2Ua', 'Super', 'Admin', NULL, NULL, 'role_001', 'en', 'UTC', 1, NULL, 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
-- School Admin (School-specific administrator - Has schoolId, manages only assigned school)
('user_002', 'school_001', 'admin@school.com', '$2a$12$jmVGOwVYCX34QdXYhaHRnuARRu1Z48QpZJ4SsmXoCEsLUibXWjgKO', 'School', 'Admin', NULL, NULL, 'role_002', 'en', 'UTC', 1, NULL, 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL),
-- School Admin (Alternative - admin@demoschool.com)
('user_003', 'school_001', 'admin@demoschool.com', '$2a$12$6PTTb6YQCIOterRROKWqFe62p8dUfrN1LkA4NTLLkbo1MOsZz/qOS', 'School', 'Admin', NULL, NULL, 'role_002', 'en', 'UTC', 1, NULL, 1, '2026-01-06 20:49:25.000', '2026-01-06 20:49:25.000', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcements_isPublished_idx` (`isPublished`),
  ADD KEY `announcements_schoolId_idx` (`schoolId`),
  ADD KEY `announcements_type_idx` (`type`);

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendances_studentId_date_key` (`studentId`,`date`),
  ADD KEY `attendances_date_idx` (`date`),
  ADD KEY `attendances_schoolId_idx` (`schoolId`),
  ADD KEY `attendances_studentId_idx` (`studentId`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_createdAt_idx` (`createdAt`),
  ADD KEY `audit_logs_entityType_idx` (`entityType`),
  ADD KEY `audit_logs_schoolId_idx` (`schoolId`),
  ADD KEY `audit_logs_userId_idx` (`userId`);

--
-- Indexes for table `book_issues`
--
ALTER TABLE `book_issues`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_issues_staffId_fkey` (`staffId`),
  ADD KEY `book_issues_bookId_idx` (`bookId`),
  ADD KEY `book_issues_status_idx` (`status`),
  ADD KEY `book_issues_studentId_idx` (`studentId`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `classes_schoolId_name_key` (`schoolId`,`name`),
  ADD KEY `classes_classTeacherId_fkey` (`classTeacherId`),
  ADD KEY `classes_schoolId_idx` (`schoolId`);

--
-- Indexes for table `exams`
--
ALTER TABLE `exams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `exams_classId_idx` (`classId`),
  ADD KEY `exams_schoolId_idx` (`schoolId`),
  ADD KEY `exams_status_idx` (`status`);

--
-- Indexes for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `exam_results_examId_studentId_subjectId_key` (`examId`,`studentId`,`subjectId`),
  ADD KEY `exam_results_subjectId_fkey` (`subjectId`),
  ADD KEY `exam_results_examId_idx` (`examId`),
  ADD KEY `exam_results_studentId_idx` (`studentId`);

--
-- Indexes for table `fees`
--
ALTER TABLE `fees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fees_classId_idx` (`classId`),
  ADD KEY `fees_schoolId_idx` (`schoolId`);

--
-- Indexes for table `library_books`
--
ALTER TABLE `library_books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `library_books_isbn_idx` (`isbn`),
  ADD KEY `library_books_schoolId_idx` (`schoolId`),
  ADD KEY `library_books_status_idx` (`status`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `parents_userId_key` (`userId`),
  ADD KEY `parents_email_idx` (`email`),
  ADD KEY `parents_phone_idx` (`phone`);

--
-- Indexes for table `parent_students`
--
ALTER TABLE `parent_students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `parent_students_parentId_studentId_key` (`parentId`,`studentId`),
  ADD KEY `parent_students_parentId_idx` (`parentId`),
  ADD KEY `parent_students_studentId_idx` (`studentId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_feeId_idx` (`feeId`),
  ADD KEY `payments_paymentDate_idx` (`paymentDate`),
  ADD KEY `payments_schoolId_idx` (`schoolId`),
  ADD KEY `payments_status_idx` (`status`),
  ADD KEY `payments_studentId_idx` (`studentId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_key` (`name`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `schools_slug_key` (`slug`),
  ADD KEY `schools_slug_idx` (`slug`),
  ADD KEY `schools_status_idx` (`status`),
  ADD KEY `idx_subscriptionPlan` (`subscriptionPlan`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sections_classId_name_key` (`classId`,`name`),
  ADD KEY `sections_classId_idx` (`classId`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `staff_schoolId_employeeId_key` (`schoolId`,`employeeId`),
  ADD UNIQUE KEY `staff_userId_key` (`userId`),
  ADD KEY `staff_designation_idx` (`designation`),
  ADD KEY `staff_schoolId_idx` (`schoolId`),
  ADD KEY `staff_status_idx` (`status`);

--
-- Indexes for table `staff_attendances`
--
ALTER TABLE `staff_attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `staff_attendances_staffId_date_key` (`staffId`,`date`),
  ADD KEY `staff_attendances_date_idx` (`date`),
  ADD KEY `staff_attendances_staffId_idx` (`staffId`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_schoolId_admissionNumber_key` (`schoolId`,`admissionNumber`),
  ADD UNIQUE KEY `students_userId_key` (`userId`),
  ADD KEY `students_sectionId_fkey` (`sectionId`),
  ADD KEY `students_classId_idx` (`classId`),
  ADD KEY `students_schoolId_idx` (`schoolId`),
  ADD KEY `students_status_idx` (`status`);

--
-- Indexes for table `student_transports`
--
ALTER TABLE `student_transports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_transports_studentId_key` (`studentId`),
  ADD KEY `student_transports_routeId_idx` (`routeId`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subjects_schoolId_code_key` (`schoolId`,`code`),
  ADD KEY `subjects_teacherId_fkey` (`teacherId`),
  ADD KEY `subjects_classId_idx` (`classId`),
  ADD KEY `subjects_schoolId_idx` (`schoolId`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_isActive` (`isActive`),
  ADD KEY `idx_sortOrder` (`sortOrder`);

--
-- Indexes for table `transport_routes`
--
ALTER TABLE `transport_routes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transport_routes_schoolId_routeNumber_key` (`schoolId`,`routeNumber`),
  ADD KEY `transport_routes_schoolId_idx` (`schoolId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_schoolId_email_key` (`schoolId`,`email`),
  ADD KEY `users_email_idx` (`email`),
  ADD KEY `users_roleId_idx` (`roleId`),
  ADD KEY `users_schoolId_idx` (`schoolId`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `book_issues`
--
ALTER TABLE `book_issues`
  ADD CONSTRAINT `book_issues_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `library_books` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `book_issues_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `book_issues_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_classTeacherId_fkey` FOREIGN KEY (`classTeacherId`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `classes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `exams`
--
ALTER TABLE `exams`
  ADD CONSTRAINT `exams_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `exams_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD CONSTRAINT `exam_results_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `exam_results_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `exam_results_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `fees`
--
ALTER TABLE `fees`
  ADD CONSTRAINT `fees_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `library_books`
--
ALTER TABLE `library_books`
  ADD CONSTRAINT `library_books_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `parents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `parent_students`
--
ALTER TABLE `parent_students`
  ADD CONSTRAINT `parent_students_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `parent_students_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_feeId_fkey` FOREIGN KEY (`feeId`) REFERENCES `fees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `staff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `staff_attendances`
--
ALTER TABLE `staff_attendances`
  ADD CONSTRAINT `staff_attendances_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `students_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `students_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `student_transports`
--
ALTER TABLE `student_transports`
  ADD CONSTRAINT `student_transports_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `transport_routes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `student_transports_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `subjects_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `subjects_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `transport_routes`
--
ALTER TABLE `transport_routes`
  ADD CONSTRAINT `transport_routes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
