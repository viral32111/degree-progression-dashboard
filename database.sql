SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE `assignments` (
  `assignmentIdentifier` int(10) UNSIGNED NOT NULL,
  `assignmentModule` int(10) UNSIGNED NOT NULL,
  `assignmentName` varchar(128) NOT NULL,
  `assignmentDue` datetime NOT NULL,
  `assignmentScore` int(11) NOT NULL DEFAULT 0,
  `assignmentMarks` int(11) NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `courses` (
  `courseIdentifier` int(10) UNSIGNED NOT NULL,
  `courseName` varchar(64) NOT NULL,
  `courseDuration` tinyint(4) NOT NULL DEFAULT 2
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `modules` (
  `moduleIdentifier` int(10) UNSIGNED NOT NULL,
  `moduleCourse` int(10) UNSIGNED NOT NULL,
  `moduleName` varchar(64) NOT NULL,
  `moduleStart` datetime NOT NULL,
  `moduleFinish` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `userIdentifier` int(10) UNSIGNED NOT NULL,
  `userCourse` int(10) UNSIGNED NOT NULL,
  `userName` varchar(32) NOT NULL,
  `userPassword` varchar(60) NOT NULL,
  `userTwoFactor` binary(32) DEFAULT NULL,
  `userInitVector` binary(16) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `assignments`
  ADD PRIMARY KEY (`assignmentIdentifier`),
  ADD UNIQUE KEY `UNIQUE` (`assignmentName`),
  ADD KEY `assignmentModule` (`assignmentModule`);

ALTER TABLE `courses`
  ADD PRIMARY KEY (`courseIdentifier`),
  ADD UNIQUE KEY `UNIQUE` (`courseName`);

ALTER TABLE `modules`
  ADD PRIMARY KEY (`moduleIdentifier`),
  ADD UNIQUE KEY `UNIQUE` (`moduleName`),
  ADD KEY `moduleCourse` (`moduleCourse`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`userIdentifier`),
  ADD UNIQUE KEY `UNIQUE` (`userName`),
  ADD UNIQUE KEY `UNIQUE_IV` (`userInitVector`),
  ADD KEY `userCourse` (`userCourse`);

ALTER TABLE `assignments`
  MODIFY `assignmentIdentifier` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `courses`
  MODIFY `courseIdentifier` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `modules`
  MODIFY `moduleIdentifier` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `users`
  MODIFY `userIdentifier` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `assignments`
  ADD CONSTRAINT `assignmentModule` FOREIGN KEY (`assignmentModule`) REFERENCES `modules` (`moduleIdentifier`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `modules`
  ADD CONSTRAINT `moduleCourse` FOREIGN KEY (`moduleCourse`) REFERENCES `courses` (`courseIdentifier`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `userCourse` FOREIGN KEY (`userCourse`) REFERENCES `courses` (`courseIdentifier`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
