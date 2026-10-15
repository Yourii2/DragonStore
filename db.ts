import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'db_config.json');

export interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  charset?: string;
}

export interface SystemConfig {
  isInstalled: boolean;
  installedAt?: string;
  dbConfig?: DBConfig;
  businessConfig?: {
    companyNameAr: string;
    companyNameEn: string;
    currency: string;
    currencySymbol: string;
    country: string;
    taxNumber?: string;
    commercialRecord?: string;
    shopUnitName: string;
    freelanceUnitName: string;
    defaultSharedShopRatio: number;
    defaultSharedFreelanceRatio: number;
  };
  adminAccount?: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    role: string;
  };
}

let pool: mysql.Pool | null = null;

export function loadConfigFile(): SystemConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db_config.json:', err);
  }
  return { isInstalled: false };
}

export function saveConfigFile(config: SystemConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getPool(): mysql.Pool | null {
  if (pool) return pool;

  const config = loadConfigFile();
  if (config.isInstalled && config.dbConfig) {
    pool = mysql.createPool({
      host: config.dbConfig.host || 'localhost',
      port: config.dbConfig.port || 3306,
      database: config.dbConfig.database || 'dragon_erp_production',
      user: config.dbConfig.user || 'root',
      password: config.dbConfig.password || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }
  return pool;
}

export function resetPool(): void {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
}
