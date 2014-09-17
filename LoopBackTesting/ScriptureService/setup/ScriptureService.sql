CREATE DATABASE `scripture_service`;

CREATE TABLE `scripture_service`.`day_image` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` int(11) unsigned NOT NULL,
  `image_source` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `day_UNIQUE` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/* CREATE TABLE `scripture_service`.`supported_dbp_version` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version_code` varchar(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `versioncode_UNIQUE` (`version_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8; */

CREATE TABLE `supported_dbp_language` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `language_code` varchar(3) NOT NULL,
  `default_version_code` varchar(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `language_code_UNIQUE` (`language_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

CREATE TABLE `scripture_service`.`supported_dbp_verse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` varchar(4) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `verse_start` int(11) NOT NULL,
  `verse_end` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

