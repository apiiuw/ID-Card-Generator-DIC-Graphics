import { Folder, IDCard, PrintSettings, UserSession } from '../types';

const API_BASE = '/api';

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function loginUser(username: string, password: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Nama pengguna atau kata sandi salah.');
  }

  return data as UserSession;
}

export async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch(`${API_BASE}/folders`);
  if (!res.ok) {
    throw new Error('Gagal mengambil data folder dari MySQL.');
  }
  return await res.json();
}

export async function createFolder(newFolder: Folder): Promise<Folder> {
  const res = await fetch(`${API_BASE}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newFolder),
  });
  if (!res.ok) {
    throw new Error('Gagal membuat folder di MySQL.');
  }
  return await res.json();
}

export async function updateFolder(folder: Folder): Promise<void> {
  const res = await fetch(`${API_BASE}/folders/${folder.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folder.name, description: folder.description }),
  });
  if (!res.ok) {
    throw new Error('Gagal memperbarui folder di MySQL.');
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/folders/${folderId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Gagal menghapus folder dari MySQL.');
  }
}

export async function syncFolderCards(folderId: string, cards: IDCard[]): Promise<void> {
  const res = await fetch(`${API_BASE}/folders/${folderId}/cards/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  });
  if (!res.ok) {
    throw new Error('Gagal menyimpan kartu ke MySQL.');
  }
}

export async function fetchPrintSettings(): Promise<PrintSettings | null> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.cardWidthMm ? data : null;
  } catch {
    return null;
  }
}

export async function savePrintSettings(settings: PrintSettings): Promise<void> {
  try {
    await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch (err) {
    console.error('Failed to save settings to MySQL:', err);
  }
}

