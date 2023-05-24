-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema bada
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema bada
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `bada` DEFAULT CHARACTER SET utf8 ;
USE `bada` ;

-- -----------------------------------------------------
-- Table `bada`.`AE`
-- -----------------------------------------------------
CREATE TABLE `ae` (
  `ri` varchar(200) NOT NULL,
  `rn` varchar(255) DEFAULT NULL,
  `ty` varchar(45) DEFAULT NULL,
  `pi` varchar(200) DEFAULT NULL,
  `ct` varchar(200) DEFAULT NULL,
  `lt` varchar(200) DEFAULT NULL,
  `et` varchar(200) DEFAULT NULL,
  `lbl` varchar(255) DEFAULT NULL,
  `api` varchar(200) DEFAULT NULL,
  `aei` varchar(200) DEFAULT NULL,
  `rr` varchar(45) DEFAULT NULL,
  `user` varchar(255) NOT NULL,
  PRIMARY KEY (`ri`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- -----------------------------------------------------
-- Table `bada`.`CNT`
-- -----------------------------------------------------
CREATE TABLE `cnt` (
  `ri` varchar(200) NOT NULL,
  `rn` varchar(255) DEFAULT NULL,
  `ty` varchar(45) DEFAULT NULL,
  `pi` varchar(200) DEFAULT NULL,
  `ct` varchar(200) DEFAULT NULL,
  `lt` varchar(200) DEFAULT NULL,
  `et` varchar(200) DEFAULT NULL,
  `lbl` varchar(255) DEFAULT NULL,
  `st` varchar(200) DEFAULT NULL,
  `cr` varchar(200) DEFAULT NULL,
  `cni` varchar(200) DEFAULT NULL,
  `cbs` varchar(200) DEFAULT NULL,
  `mni` varchar(200) DEFAULT NULL,
  `mbs` varchar(200) DEFAULT NULL,
  `mia` varchar(200) DEFAULT NULL,
  `user` varchar(255) NOT NULL,
  `path` varchar(255) DEFAULT NULL,
  `timeseries` varchar(45) DEFAULT NULL,
  `spatialData` varchar(45) DEFAULT NULL,
  `dm` JSON DEFAULT NULL,
  PRIMARY KEY (`ri`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- -----------------------------------------------------
-- Table `bada`.`LatestCIN`
-- -----------------------------------------------------
CREATE TABLE `latestcin` (
  `ri` varchar(200) DEFAULT NULL,
  `rn` varchar(255) DEFAULT NULL,
  `ty` varchar(45) DEFAULT NULL,
  `pi` varchar(200) DEFAULT NULL,
  `ct` varchar(200) DEFAULT NULL,
  `lt` varchar(200) DEFAULT NULL,
  `et` varchar(200) DEFAULT NULL,
  `st` varchar(45) DEFAULT NULL,
  `cr` varchar(45) DEFAULT NULL,
  `cs` varchar(45) DEFAULT NULL,
  `con` longtext,
  `sri` varchar(45) DEFAULT NULL,
  `ae` varchar(200) DEFAULT NULL,
  `cnt` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



-- -----------------------------------------------------
-- Table `bada`.`User`
-- -----------------------------------------------------
CREATE TABLE `user` (
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



-- -----------------------------------------------------
-- Table `bada`.`Dailycount`
-- -----------------------------------------------------
CREATE TABLE `dailycount` (
  `user` varchar(200) NOT NULL,
  `resource_type` varchar(45) DEFAULT NULL,
  `resource_count` int(11) DEFAULT NULL,
  `creation_time` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
