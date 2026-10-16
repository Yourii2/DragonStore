export interface LicenseData {
  hwid: string;
  program_name: string;
  program_version: string;
  company?: string;
  phone?: string;
  license_type: 'تجريبية' | 'كاملة' | string;
  status: 'active' | 'expired' | 'blocked' | 'unregistered' | string;
  end_date: string;
  is_expired: boolean;
  last_verified_at: string;
  last_online_verified_at?: string;
  server_time?: string;
  message?: string;
}

export declare function getHardwareId(): string;
export declare function saveEncryptedLicense(license: LicenseData): void;
export declare function loadEncryptedLicense(): LicenseData | null;
export declare function verifyLicenseOnline(licenseKey?: string): Promise<{ success: boolean; license: LicenseData; message: string }>;
export declare function getLicenseStatus(): LicenseData;
