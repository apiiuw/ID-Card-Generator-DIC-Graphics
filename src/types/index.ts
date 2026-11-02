export interface IDCard {
  id: string; // unique ID
  title: string; // e.g. "KONTRAKTOR", "OUTSOURCE", "MAGANG"
  name: string; // e.g. "NABILLAH NURJIHAN"
  company: string; // e.g. "PT. KAIZEN GLOBAL INDONESIA"
  idLabel: string; // e.g. "ID KONTRAKTOR", "NOMOR ID", "ID KOPKAR"
  idNumber: string; // e.g. "VDRKRW-26100414"
  photoUrl: string; // Base64 or URL
  codeFormat?: 'qr' | 'barcode'; // default 'qr'
  qrType: 'auto' | 'upload'; // default 'auto'
  qrCodeUrl?: string; // If uploaded
  barcodeType?: 'auto' | 'upload'; // legacy support
  barcodeUrl?: string; // legacy support
  colorTheme?: string; // Theme accent color
  validUntil?: string; // Expiry or validity date
}

export type PageOrientation = 'landscape' | 'portrait';

export interface PrintSettings {
  pageOrientation: PageOrientation; // default 'landscape'
  cardWidthMm: number; // default 54
  cardHeightMm: number; // default 86
  gapFrontBackMm: number; // gap between front and back of each card (default 6mm)
  showCutMarks: boolean;
  showFoldMarks: boolean;
  marginMm: number;
  gapXMm: number;
  gapYMm: number;
  showPageNumbers: boolean;
  cardBackImage: string;
  dicLogoUrl: string;
  k3LogoUrl: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  cards: IDCard[];
  settings?: PrintSettings;
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  name: string;
  role: string;
}
