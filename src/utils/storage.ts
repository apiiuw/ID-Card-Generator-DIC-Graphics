import { IDCard, PrintSettings, Folder, UserSession } from '../types';
import { INITIAL_CARDS, DEFAULT_PRINT_SETTINGS } from '../data/initialData';
import allExtractedCards from '../data/allExtractedCards.json';

const STORAGE_KEY_AUTH = 'PT_DIC_AUTH_SESSION_v1';
const STORAGE_KEY_FOLDERS = 'PT_DIC_FOLDERS_v2';
const STORAGE_KEY_ACTIVE_FOLDER = 'PT_DIC_ACTIVE_FOLDER_v1';
const STORAGE_KEY_CARDS_LEGACY = 'PT_DIC_ID_CARDS_v1';
const STORAGE_KEY_SETTINGS_LEGACY = 'PT_DIC_PRINT_SETTINGS_v1';

// Default initial folders
export const DEFAULT_INITIAL_FOLDERS: Folder[] = [
  {
    id: 'folder-krw-terbaru',
    name: 'ID Card Kontraktor KRW Terbaru',
    description: 'Seluruh data 74 ID Card lengkap dari file template ID CARD KONTRAKTOR KRW 26090378-26100414 - Rev 1.xlsx',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: allExtractedCards as IDCard[],
    settings: DEFAULT_PRINT_SETTINGS,
  },
  {
    id: 'folder-kontraktor-utama',
    name: 'Batch Kontraktor Kaizen & Riken',
    description: 'Data kartu kontraktor PT Kaizen Global Indonesia & PT Riken Engineering',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: INITIAL_CARDS,
    settings: DEFAULT_PRINT_SETTINGS,
  },
  {
    id: 'folder-kopkar-staff',
    name: 'Karyawan & Staff Koperasi (Kopkar)',
    description: 'ID Card anggota dan pengurus koperasi PT DIC Graphics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [
      {
        id: 'card-kopkar-1',
        title: 'KOPKAR',
        name: 'IMAM ASEP SAEPUDIN',
        company: 'KOPKAR PT DIC',
        idLabel: 'ID KOPKAR',
        idNumber: 'KKS26006',
        photoUrl: '/logos/image11.jpeg',
        codeFormat: 'qr',
        qrType: 'auto',
        qrCodeUrl: '',
        colorTheme: '#000000',
      },
    ],
    settings: DEFAULT_PRINT_SETTINGS,
  },
  {
    id: 'folder-visitor-tamu',
    name: 'Tamu Perusahaan & Visitor K3',
    description: 'Kartu tanda pengenal visitor khusus area pabrik DIC Karawang',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [
      {
        id: 'card-vis-1',
        title: 'VISITOR',
        name: 'TAMU AUDITOR ISO',
        company: 'PT. TUV RHEINLAND INDONESIA',
        idLabel: 'ID VISITOR',
        idNumber: 'VIS-202611-01',
        photoUrl: '',
        codeFormat: 'qr',
        qrType: 'auto',
        qrCodeUrl: '',
        colorTheme: '#000000',
      },
    ],
    settings: DEFAULT_PRINT_SETTINGS,
  },
];

// ==========================================
// AUTH SESSION MANAGEMENT
// ==========================================
export function loadUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isAuthenticated) {
        return parsed as UserSession;
      }
    }
  } catch (e) {
    console.error('Failed to load user session:', e);
  }
  return null;
}

export function saveUserSession(session: UserSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch (e) {
    console.error('Failed to save user session:', e);
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch (e) {
    console.error('Failed to clear user session:', e);
  }
}

// ==========================================
// FOLDERS MANAGEMENT
// ==========================================
export function loadFoldersFromStorage(): Folder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((folder: Folder) => ({
          ...folder,
          cards: (folder.cards || []).map((c: IDCard) => ({
            ...c,
            codeFormat: 'qr',
            qrType: c.qrType || (c as unknown as { barcodeType?: string }).barcodeType || 'auto',
            qrCodeUrl: c.qrCodeUrl || (c as unknown as { barcodeUrl?: string }).barcodeUrl || '',
          })),
        }));
      }
    }

    // Migration from legacy cards storage if available
    const legacyCards = localStorage.getItem(STORAGE_KEY_CARDS_LEGACY);
    if (legacyCards) {
      const parsedLegacy = JSON.parse(legacyCards);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const migratedFolders: Folder[] = [
          {
            id: 'folder-migrated-1',
            name: 'Batch ID Card Kontraktor',
            description: 'Data kartu yang telah tersimpan sebelumnya',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            cards: parsedLegacy,
            settings: DEFAULT_PRINT_SETTINGS,
          },
          ...DEFAULT_INITIAL_FOLDERS.slice(1),
        ];
        saveFoldersToStorage(migratedFolders);
        return migratedFolders;
      }
    }
  } catch (e) {
    console.error('Failed to load folders from localStorage:', e);
  }

  saveFoldersToStorage(DEFAULT_INITIAL_FOLDERS);
  return DEFAULT_INITIAL_FOLDERS;
}

export function saveFoldersToStorage(folders: Folder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.error('Failed to save folders to localStorage:', e);
  }
}

export function loadActiveFolderIdFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_FOLDER);
  } catch {
    return null;
  }
}

export function saveActiveFolderIdToStorage(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_FOLDER, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_FOLDER);
    }
  } catch (e) {
    console.error('Failed to save active folder id:', e);
  }
}

// ==========================================
// LEGACY COMPATIBILITY HELPERS
// ==========================================
export function loadCardsFromStorage(): IDCard[] {
  const folders = loadFoldersFromStorage();
  const activeId = loadActiveFolderIdFromStorage();
  const folder = folders.find((f) => f.id === activeId) || folders[0];
  return folder ? folder.cards : INITIAL_CARDS;
}

export function saveCardsToStorage(cards: IDCard[]): void {
  const folders = loadFoldersFromStorage();
  const activeId = loadActiveFolderIdFromStorage();
  const folderIndex = folders.findIndex((f) => f.id === activeId);
  if (folderIndex >= 0) {
    folders[folderIndex].cards = cards;
    folders[folderIndex].updatedAt = new Date().toISOString();
    saveFoldersToStorage(folders);
  }
}

export function loadPrintSettingsFromStorage(): PrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS_LEGACY);
    if (raw) {
      return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
  return DEFAULT_PRINT_SETTINGS;
}

export function savePrintSettingsToStorage(settings: PrintSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS_LEGACY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function exportBackup(cards: IDCard[], settings: PrintSettings): void {
  const data = {
    appName: 'ID Card Generator PT DIC Graphics Karawang',
    exportedAt: new Date().toISOString(),
    cards,
    settings,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-id-card-dic-karawang-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
