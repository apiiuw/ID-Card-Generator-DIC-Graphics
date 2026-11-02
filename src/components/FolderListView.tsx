import React, { useState } from 'react';
import { Folder, UserSession } from '../types';
import {
  FolderPlus,
  FolderOpen,
  Edit3,
  Trash2,
  Copy,
  CreditCard,
  Calendar,
  LogOut,
  Search,
  Sparkles,
  ShieldCheck,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { INITIAL_CARDS, DEFAULT_PRINT_SETTINGS } from '../data/initialData';

interface FolderListViewProps {
  userSession: UserSession;
  folders: Folder[];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (newFolder: Folder) => void;
  onUpdateFolder: (updatedFolder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onLogout: () => void;
}

export const FolderListView: React.FC<FolderListViewProps> = ({
  userSession,
  folders,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [initialTemplate, setInitialTemplate] = useState<'default' | 'empty'>('default');

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openCreateModal = () => {
    setModalMode('create');
    setEditingFolderId(null);
    setFolderName('');
    setFolderDesc('');
    setInitialTemplate('default');
  };

  const openEditModal = (folder: Folder) => {
    setModalMode('edit');
    setEditingFolderId(folder.id);
    setFolderName(folder.name);
    setFolderDesc(folder.description || '');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingFolderId(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (modalMode === 'create') {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name: folderName.trim(),
        description: folderDesc.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cards: initialTemplate === 'default' ? INITIAL_CARDS.map(c => ({ ...c, id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })) : [],
        settings: DEFAULT_PRINT_SETTINGS,
      };
      onCreateFolder(newFolder);
    } else if (modalMode === 'edit' && editingFolderId) {
      const target = folders.find((f) => f.id === editingFolderId);
      if (target) {
        onUpdateFolder({
          ...target,
          name: folderName.trim(),
          description: folderDesc.trim(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    closeModal();
  };

  const handleDuplicate = (folder: Folder) => {
    const duplicated: Folder = {
      ...folder,
      id: `folder-${Date.now()}`,
      name: `${folder.name} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: folder.cards.map((c) => ({
        ...c,
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    onCreateFolder(duplicated);
  };

  const handleDelete = (folder: Folder) => {
    if (folders.length <= 1) {
      alert('Minimal harus ada 1 folder di sistem.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus folder "${folder.name}" beserta ${folder.cards.length} kartu di dalamnya?`)) {
      onDeleteFolder(folder.id);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-20 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                <img
                  src="/logos/dic-logo.jpg"
                  alt="DIC"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="h-9 w-9 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                <img
                  src="/logos/k3-logo.jpg"
                  alt="K3"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                PT DIC GRAPHICS KARAWANG
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Portal Manajemen Folder ID Card
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{userSession.name}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Banner / Actions Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
            <CreditCard className="w-72 h-72 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs text-blue-100 font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Batch ID Card Generator PT DIC Graphics
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pilih Folder Kumpulan ID Card
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Setiap folder menyimpan kumpulan data kartu yang terpisah (misalnya kontraktor proyek, staf koperasi, atau visitor). Klik salah satu folder untuk masuk ke editor dan pratinjau cetak A4.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-800 font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-50 shadow-md transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-blue-600" />
                Tambah Folder Baru
              </button>
              <span className="text-xs text-blue-200">
                Total <strong>{folders.length}</strong> folder tersedia
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari folder berdasarkan nama..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <p className="text-xs text-slate-500 self-end sm:self-center">
            Menampilkan <strong>{filteredFolders.length}</strong> dari <strong>{folders.length}</strong> folder
          </p>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFolders.map((folder) => {
            const cardCount = folder.cards?.length || 0;
            return (
              <div
                key={folder.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Folder Top Bar */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(folder)}
                        title="Edit nama folder"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(folder)}
                        title="Duplikat folder"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(folder)}
                        title="Hapus folder"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                    {folder.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {folder.description || 'Tidak ada deskripsi tambahan.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>{cardCount} Kartu ID</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(folder.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Open Folder Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Buka & Kelola Kartu</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick Create Card Button */}
          <button
            type="button"
            onClick={openCreateModal}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-3 transition-all">
              <FolderPlus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
              + Tambah Folder Baru
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Buat kategori batch ID Card baru dengan data terpisah
            </span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          PT DIC Graphics Karawang Factory • Sistem ID Card Kontraktor & Visitor Standar K3
        </div>
      </footer>

      {/* Create / Edit Folder Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">
                  {modalMode === 'create' ? 'Buat Folder Baru' : 'Edit Nama Folder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Folder <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Contoh: Batch Kontraktor Proyek Kaizen"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deskripsi / Catatan (Opsional)
                </label>
                <textarea
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  placeholder="Contoh: Kumpulan ID Card kontraktor periode November 2026"
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Data Kartu Awal
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label
                      className={`p-3 border rounded-xl cursor-pointer flex flex-col gap-1 transition-all ${
                        initialTemplate === 'default'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        checked={initialTemplate === 'default'}
                        onChange={() => setInitialTemplate('default')}
                        className="sr-only"
                      />
                      <span>Isi Template Awal</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        Memuat 4 kartu kontraktor contoh PT DIC
                      </span>
                    </label>

                    <label
                      className={`p-3 border rounded-xl cursor-pointer flex flex-col gap-1 transition-all ${
                        initialTemplate === 'empty'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        checked={initialTemplate === 'empty'}
                        onChange={() => setInitialTemplate('empty')}
                        className="sr-only"
                      />
                      <span>Folder Kosong</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        Mulai dari 0 kartu baru
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {modalMode === 'create' ? 'Buat Folder' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

