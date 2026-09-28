-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: maintronic_iot
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `maintronic_iot`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `maintronic_iot` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `maintronic_iot`;

--
-- Table structure for table `alarmas`
--

DROP TABLE IF EXISTS `alarmas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alarmas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int NOT NULL,
  `tipo` enum('ENCENDIDO_SP','MODO_CONEXION','SOBRECARGA','FLUJO','EMERGENCIA','NIVEL_CRITICO','TEMP_CRITICA','BATERIA_BAJA','VOLTAJE_BAJO','VOLTAJE_ALTO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  `modo_conexion` enum('WIFI','BLUETOOTH') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notificado` tinyint(1) DEFAULT '0',
  `registrado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `resuelta_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dispositivo_id` (`dispositivo_id`),
  KEY `idx_fecha` (`registrado_en`),
  KEY `idx_activa` (`activa`),
  KEY `idx_tipo` (`tipo`),
  CONSTRAINT `alarmas_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dispositivos`
--

DROP TABLE IF EXISTS `dispositivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositivos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `planta_id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mac_address` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_asignada` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `planta_id` (`planta_id`),
  CONSTRAINT `dispositivos_ibfk_1` FOREIGN KEY (`planta_id`) REFERENCES `plantas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mediciones_caldero`
--

DROP TABLE IF EXISTS `mediciones_caldero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mediciones_caldero` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int NOT NULL,
  `temperatura` decimal(6,2) DEFAULT NULL,
  `nivel` decimal(6,2) DEFAULT NULL,
  `registrado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha` (`registrado_en`),
  KEY `idx_dispositivo` (`dispositivo_id`),
  CONSTRAINT `mediciones_caldero_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6613 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mediciones_industrial`
--

DROP TABLE IF EXISTS `mediciones_industrial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mediciones_industrial` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int NOT NULL,
  `voltaje_l1` decimal(8,2) DEFAULT '0.00',
  `voltaje_l2` decimal(8,2) DEFAULT '0.00',
  `voltaje_l3` decimal(8,2) DEFAULT '0.00',
  `corriente_l1` decimal(8,3) DEFAULT '0.000',
  `corriente_l2` decimal(8,3) DEFAULT '0.000',
  `corriente_l3` decimal(8,3) DEFAULT '0.000',
  `potencia_activa` decimal(10,3) DEFAULT '0.000',
  `potencia_reactiva` decimal(10,3) DEFAULT '0.000',
  `potencia_aparente` decimal(10,3) DEFAULT '0.000',
  `factor_potencia` decimal(5,3) DEFAULT '0.000',
  `frecuencia` decimal(6,3) DEFAULT '0.000',
  `energia_kwh` decimal(12,3) DEFAULT '0.000',
  `registrado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `dispositivo_id` (`dispositivo_id`),
  CONSTRAINT `mediciones_industrial_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mediciones_solar`
--

DROP TABLE IF EXISTS `mediciones_solar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mediciones_solar` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int NOT NULL,
  `voltaje_panel` decimal(8,3) DEFAULT NULL,
  `voltaje_bateria` decimal(8,3) DEFAULT NULL,
  `voltaje_inversor` decimal(8,3) DEFAULT NULL,
  `corriente_panel` decimal(8,3) DEFAULT NULL,
  `corriente_bateria` decimal(8,3) DEFAULT NULL,
  `corriente_inversor` decimal(8,3) DEFAULT NULL,
  `potencia_entrada` decimal(10,3) DEFAULT NULL,
  `potencia_salida` decimal(10,3) DEFAULT NULL,
  `energia_kwh` decimal(10,4) DEFAULT NULL,
  `registrado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha` (`registrado_en`),
  KEY `idx_dispositivo` (`dispositivo_id`),
  CONSTRAINT `mediciones_solar_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plantas`
--

DROP TABLE IF EXISTS `plantas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resumen_diario_solar`
--

DROP TABLE IF EXISTS `resumen_diario_solar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resumen_diario_solar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int NOT NULL,
  `fecha` date NOT NULL,
  `energia_total_kwh` decimal(10,4) DEFAULT '0.0000',
  `potencia_max_w` decimal(10,3) DEFAULT '0.000',
  `potencia_min_w` decimal(10,3) DEFAULT '0.000',
  `potencia_prom_w` decimal(10,3) DEFAULT '0.000',
  `registros_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_disp_fecha` (`dispositivo_id`,`fecha`),
  CONSTRAINT `resumen_diario_solar_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resumen_mensual_solar`
--

DROP TABLE IF EXISTS `resumen_mensual_solar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resumen_mensual_solar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int NOT NULL,
  `anio` year NOT NULL,
  `mes` tinyint NOT NULL,
  `energia_total_kwh` decimal(12,4) DEFAULT '0.0000',
  `costo_estimado` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_disp_mes` (`dispositivo_id`,`anio`,`mes`),
  CONSTRAINT `resumen_mensual_solar_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-27 19:34:20
