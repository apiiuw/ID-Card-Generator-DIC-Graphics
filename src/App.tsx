import React, { useState, useEffect, useMemo } from 'react';
import { IDCard, PrintSettings, Folder, UserSession } from './types';
import {
  loadFoldersFromStorage,
  saveFoldersToStorage,
  loadUserSession,
  saveUserSession,
  clearUserSession,
  loadActiveFolderIdFromStorage,
  saveActiveFolderIdToStorage,
  exportBackup,
} from './utils/storage';
import {
  fetchFolders,
  createFolder as createFolderApi,
  updateFolder as updateFolderApi,
  deleteFolder as deleteFolderApi,
  syncFolderCards as syncFolderCardsApi,
  fetchPrintSettings as fetchPrintSettingsApi,
  savePrintSettings as savePrintSettingsApi,
  checkServerHealth,
} from './utils/api';
import { INITIAL_CARDS, DEFAULT_PRINT_SETTINGS } from './data/initialData';
import { IDCardItem } from './components/IDCardItem';
import { CardEditor } from './components/CardEditor';
import { A4PrintSheet } from './components/A4PrintSheet';
import { SettingsModal } from './components/SettingsModal';
import { LoginView } from './components/LoginView';
import { FolderListView } from './components/FolderListView';
import { PrintPageModal } from './components/PrintPageModal';
import { generateA4LandscapePDF, PDFGenerationProgress } from './utils/printPdf';
import { getSheetGridLayout } from './utils/sheetLayout';
import {
  Plus,
  Printer,
  Sliders,
  Table,
  RotateCw,
  FileDown,
  LayoutGrid,
  CreditCard,
  Eye,
  CheckCircle,
  FolderOpen,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Database,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Auth state
  const [session, setSession] = useState<UserSession | null>(() => loadUserSession());
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Folders state
  const [folders, setFolders] = useState<Folder[]>(() => loadFoldersFromStorage());
  const [activeFolderId, setActiveFolderId] = useState<string | null>(() => {
    const saved = loadActiveFolderIdFromStorage();
    const initialFolders = loadFoldersFromStorage();
    if (saved && initialFolders.some((f) => f.id === saved)) {
      return saved;
    }
    return initialFolders[0]?.id || null;
  });

  // Active view: 'login' | 'folders' | 'workspace'
  const [appView, setAppView] = useState<'login' | 'folders' | 'workspace'>(() => {
    const sess = loadUserSession();
    if (!sess || !sess.isAuthenticated) return 'login';
    return 'folders';
  });

  // Fetch data from MySQL on mount or when logged in
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        const isHealthy = await checkServerHealth();
        setDbConnected(isHealthy);
        if (isHealthy) {
          const remoteFolders = await fetchFolders();
          if (remoteFolders && remoteFolders.length > 0) {
            setFolders(remoteFolders);
            saveFoldersToStorage(remoteFolders);
          }
          const remoteSettings = await fetchPrintSettingsApi();
          if (remoteSettings) {
            setSettings(remoteSettings);
          }
        }
      } catch (err) {
        console.warn('Backend MySQL syncing error, using local fallback:', err);
        setDbConnected(false);
      }
    };

    loadFromDatabase();
  }, [session?.isAuthenticated]);

  // Current active folder
  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === activeFolderId) || folders[0] || null;
  }, [folders, activeFolderId]);

  // Current workspace cards & settings
  const [cards, setCards] = useState<IDCard[]>(() => activeFolder?.cards || INITIAL_CARDS);
  const [settings, setSettings] = useState<PrintSettings>(() => activeFolder?.settings || DEFAULT_PRINT_SETTINGS);
  const [activeCardId, setActiveCardId] = useState<string>(() => cards[0]?.id || '');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewPage, setPreviewPage] = useState<number>(0);
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter cards by any data field (name, company, idNumber, idLabel, title)
  const filteredCards = useMemo(() => {
    if (!cardSearchQuery.trim()) return cards;
    const q = cardSearchQuery.toLowerCase().trim();
    return cards.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const comp = (c.company || '').toLowerCase();
      const idNum = (c.idNumber || '').toLowerCase();
      const idLbl = (c.idLabel || '').toLowerCase();
      const ttl = (c.title || '').toLowerCase();
      return (
        name.includes(q) ||
        comp.includes(q) ||
        idNum.includes(q) ||
        idLbl.includes(q) ||
        ttl.includes(q)
      );
    });
  }, [cards, cardSearchQuery]);

  // Selected pages for print
  const [pagesToPrint, setPagesToPrint] = useState<number[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<PDFGenerationProgress | null>(null);

  // Keep localStorage updated with folders
  useEffect(() => {
    saveFoldersToStorage(folders);
  }, [folders]);

  // Keep active folder id synced
  useEffect(() => {
    saveActiveFolderIdToStorage(activeFolderId);
  }, [activeFolderId]);

  // When activeFolder changes, reload its cards into workspace (keep global MySQL settings unless folder overrides)
  useEffect(() => {
    if (activeFolder) {
      setCards(activeFolder.cards || []);
      if (activeFolder.settings) {
        setSettings(activeFolder.settings);
      }
      if (activeFolder.cards && activeFolder.cards.length > 0) {
        setActiveCardId(activeFolder.cards[0].id);
      } else {
        setActiveCardId('');
      }
      setPreviewPage(0);
    }
  }, [activeFolderId]);

  // Sync workspace cards changes back to current active folder in folders list
  const updateFolderCards = (newCards: IDCard[]) => {
    setCards(newCards);
    if (!activeFolderId) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === activeFolderId
          ? { ...f, cards: newCards, updatedAt: new Date().toISOString() }
          : f
      )
    );
    // Sync directly to MySQL database
    syncFolderCardsApi(activeFolderId, newCards).catch((err) =>
      console.warn('Failed to sync cards to MySQL:', err)
    );
  };

  // Sync workspace settings changes back to current active folder
  const updateFolderSettings = (newSettings: PrintSettings) => {
    setSettings(newSettings);
    if (!activeFolderId) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === activeFolderId
          ? { ...f, settings: newSettings, updatedAt: new Date().toISOString() }
          : f
      )
    );
    // Save to MySQL
    savePrintSettingsApi(newSettings).catch((err) =>
      console.warn('Failed to save settings to MySQL:', err)
    );
  };

  // Keep active card valid
  useEffect(() => {
    if (!cards.some((c) => c.id === activeCardId) && cards.length > 0) {
      setActiveCardId(cards[0].id);
    }
  }, [cards, activeCardId]);

  const activeCard = useMemo(() => {
    return cards.find((c) => c.id === activeCardId) || cards[0];
  }, [cards, activeCardId]);

  // Compute dynamic sheet grid capacity based on card size & page orientation
  const sheetLayout = useMemo(() => getSheetGridLayout(settings), [settings]);
  const cardsPerPage = sheetLayout.cardsPerPage;

  // Group cards into pages dynamically
  const cardPages = useMemo(() => {
    const pages: IDCard[][] = [];
    for (let i = 0; i < cards.length; i += cardsPerPage) {
      pages.push(cards.slice(i, i + cardsPerPage));
    }
    if (pages.length === 0) {
      pages.push([]);
    }
    return pages;
  }, [cards, cardsPerPage]);

  // Keep previewPage within valid range when cardPages shrinks
  useEffect(() => {
    if (previewPage >= cardPages.length) {
      setPreviewPage(Math.max(0, cardPages.length - 1));
    }
  }, [cardPages.length, previewPage]);

  // Sync @page print rule orientation with current settings
  useEffect(() => {
    const styleId = 'dynamic-print-page-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const orient = sheetLayout.isLandscape ? 'landscape' : 'portrait';
    styleEl.textContent = `@page { size: A4 ${orient}; margin: 0mm; }`;
  }, [sheetLayout.isLandscape]);

  // Update default pagesToPrint
  useEffect(() => {
    setPagesToPrint(Array.from({ length: cardPages.length }, (_, i) => i));
  }, [cardPages.length]);

  // ----------------------------------------------------
  // AUTH HANDLERS
  // ----------------------------------------------------
  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    saveUserSession(newSession);
    setAppView('folders');
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda ingin keluar dari sistem?')) {
      clearUserSession();
      setSession(null);
      setAppView('login');
    }
  };

  // ----------------------------------------------------
  // FOLDER HANDLERS
  // ----------------------------------------------------
  const handleSelectFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    setAppView('workspace');
  };

  const handleCreateFolder = async (newFolder: Folder) => {
    setFolders((prev) => [newFolder, ...prev]);
    try {
      await createFolderApi(newFolder);
    } catch (err) {
      console.warn('Failed to create folder in MySQL:', err);
    }
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const handleUpdateFolder = async (updated: Folder) => {
    setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    try {
      await updateFolderApi(updated);
    } catch (err) {
      console.warn('Failed to update folder in MySQL:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolderId === folderId) {
      const remaining = folders.filter((f) => f.id !== folderId);
      setActiveFolderId(remaining[0]?.id || null);
    }
    try {
      await deleteFolderApi(folderId);
    } catch (err) {
      console.warn('Failed to delete folder from MySQL:', err);
    }
  };

  // ----------------------------------------------------
  // WORKSPACE CARD ACTIONS
  // ----------------------------------------------------
  const handleAddCard = () => {
    // Completely blank inputs as requested by user
    const newCard: IDCard = {
      id: `card-${Date.now()}`,
      title: '',
      name: '',
      company: '',
      idLabel: '',
      idNumber: '',
      photoUrl: '',
      codeFormat: 'qr',
      qrType: 'auto',
      qrCodeUrl: '',
      colorTheme: '#000000',
    };
    const updated = [...cards, newCard];
    updateFolderCards(updated);
    setActiveCardId(newCard.id);
  };

  const handleUpdateActiveCard = (updated: IDCard) => {
    const updatedCards = cards.map((c) => (c.id === updated.id ? updated : c));
    updateFolderCards(updatedCards);
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      alert('Minimal harus ada 1 kartu dalam folder ini.');
      return;
    }
    const filtered = cards.filter((c) => c.id !== id);
    updateFolderCards(filtered);
    if (activeCardId === id && filtered.length > 0) {
      setActiveCardId(filtered[0].id);
    }
  };

  const handleDuplicateCard = (card: IDCard) => {
    const duplicated: IDCard = {
      ...card,
      id: `card-${Date.now()}`,
      name: `${card.name} (Copy)`,
      idNumber: `${card.idNumber}-CPY`,
    };
    const updated = [...cards, duplicated];
    updateFolderCards(updated);
    setActiveCardId(duplicated.id);
  };

  const handleSyncFieldToAll = (field: 'title' | 'company' | 'idLabel') => {
    if (!activeCard) return;
    const value = activeCard[field];
    const updated = cards.map((c) => ({
      ...c,
      [field]: value,
    }));
    updateFolderCards(updated);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } catch (_) {}
  };

  // ----------------------------------------------------
  // PRINT ACTION WITH PAGE SELECTION
  // ----------------------------------------------------
  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  const handleConfirmPrint = (selectedIndices: number[]) => {
    setPagesToPrint(selectedIndices);
    setIsPrintModalOpen(false);

    // Wait for state render, then trigger browser print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintPDF = async (selectedIndices: number[]) => {
    try {
      setPagesToPrint(selectedIndices);
      setIsGeneratingPDF(true);
      setPdfProgress({
        current: 0,
        total: selectedIndices.length,
        status: 'Menyiapkan lembar cetak A4...',
      });

      // Wait for DOM to render selected pages into .print-only container
      await new Promise((resolve) => setTimeout(resolve, 350));

      const printContainer = document.querySelector<HTMLElement>('.print-only');
      if (!printContainer) {
        throw new Error('Container lembar cetak tidak ditemukan.');
      }

      const orient = sheetLayout.isLandscape ? 'landscape' : 'portrait';
      const { blobUrl, pdf } = await generateA4LandscapePDF(printContainer, {
        fileName: `ID_Card_DIC_Graphics_A4_${orient}_${Date.now()}.pdf`,
        orientation: orient,
        onProgress: (p) => setPdfProgress(p),
      });

      setIsGeneratingPDF(false);
      setPdfProgress(null);
      setIsPrintModalOpen(false);

      // Open PDF in new tab (iPad / Safari opens native PDF viewer with exact orientation)
      const newTab = window.open(blobUrl, '_blank');
      if (!newTab) {
        // If popup blocked, download directly
        pdf.save(`ID_Card_DIC_Graphics_A4_${orient}_${Date.now()}.pdf`);
      }
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      setIsGeneratingPDF(false);
      setPdfProgress(null);
      alert('Gagal membuat PDF: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportBackup = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.cards && Array.isArray(parsed.cards)) {
        updateFolderCards(parsed.cards);
        if (parsed.settings) {
          updateFolderSettings(parsed.settings);
        }
        alert('Data berhasil dipulihkan!');
      } else {
        alert('Format file JSON tidak sesuai.');
      }
    } catch (e) {
      alert('Gagal membaca file JSON: ' + String(e));
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Kembalikan kartu di folder ini ke template awal PT DIC Graphics?')) {
      updateFolderCards(INITIAL_CARDS);
      updateFolderSettings(DEFAULT_PRINT_SETTINGS);
      setActiveCardId(INITIAL_CARDS[0].id);
    }
  };

  // =========================================================================
  // VIEW: 1. LOGIN
  // =========================================================================
  if (appView === 'login' || !session) {
    return <LoginView onLogin={handleLogin} />;
  }

  // =========================================================================
  // VIEW: 2. FOLDER LIST
  // =========================================================================
  if (appView === 'folders') {
    return (
      <FolderListView
        userSession={session}
        folders={folders}
        onSelectFolder={handleSelectFolder}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
        onLogout={handleLogout}
      />
    );
  }

  // =========================================================================
  // VIEW: 3. WORKSPACE (CARD GENERATOR & EDITOR)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* =========================================================================
          TOP NAVIGATION HEADER
      ========================================================================== */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Back to Folders Button & Active Folder Badge */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setAppView('folders')}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Kembali ke Daftar Folder"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Folder</span>
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <img
                src={settings.dicLogoUrl || '/logos/dic-logo.jpg'}
                alt="PT DIC Graphics"
                className="h-5 w-auto object-contain"
              />
              <span className="text-xs font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[260px]">
                {activeFolder?.name || 'Folder Aktif'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Editor vs A4 Preview) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau A4
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Pengaturan Ukuran ID Card & Lembar Cetak"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>

            <button
              type="button"
              onClick={handleAddCard}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kartu</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
              title="Pilih halaman dan cetak ke printer/PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak A4</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT AREA
      ========================================================================== */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'editor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* -------------------------------------------------------------
                LEFT COLUMN: Card Selector & Batch Actions (3 cols)
            -------------------------------------------------------------- */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Daftar Kartu
                    </span>
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {cardSearchQuery ? `${filteredCards.length}/${cards.length}` : cards.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded-md transition-colors cursor-pointer"
                    title="Tambah Kartu Baru"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Box - Searches any field in card */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    placeholder="Cari nama, ID, PT, judul..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                  {cardSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCardSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Card List with Compact Info */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredCards.length > 0 ? (
                    filteredCards.map((card, idx) => {
                      const isActive = card.id === activeCardId;
                      return (
                        <div
                          key={card.id}
                          onClick={() => setActiveCardId(card.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                            isActive
                              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/10 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          {/* Mini Photo Thumbnail */}
                          <div className="w-10 h-12 bg-slate-100 border border-slate-200 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                            {card.photoUrl ? (
                              <img
                                src={card.photoUrl}
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">
                                {idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Name & ID */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-bold truncate leading-tight ${
                                isActive ? 'text-blue-950' : 'text-slate-800'
                              }`}
                            >
                              {card.name || 'Tanpa Nama'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                              {card.idNumber || '-'}
                            </p>
                            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                              {card.title || card.company || '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 px-2 text-center text-slate-400 space-y-2">
                      <Search className="w-6 h-6 mx-auto opacity-30 text-slate-400" />
                      <p className="text-xs">
                        Tidak ada kartu yang cocok dengan "<strong>{cardSearchQuery}</strong>"
                      </p>
                      <button
                        type="button"
                        onClick={() => setCardSearchQuery('')}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Reset Pencarian
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Card Button */}
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="w-full mt-3 py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah ID Card Baru
                </button>
              </div>

              {/* Quick Info Box */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  Format Cetak Lembar A4
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800/80">
                  Total <strong>{cards.length} kartu</strong> akan dicetak ke dalam{' '}
                  <strong>{cardPages.length} lembar A4</strong> (masing-masing {cardsPerPage} kartu lengkap Depan & Belakang berdampingan).
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Lihat Pratinjau Lembar A4 &rarr;
                </button>
              </div>
            </div>

            {/* -------------------------------------------------------------
                CENTER & RIGHT COLUMN: Active Card Editor & Live Card Preview (9 cols)
            -------------------------------------------------------------- */}
            <div className="lg:col-span-9">
              {activeCard ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* Live Card Preview (5 cols on xl) */}
                  <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setActiveSide('front')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            activeSide === 'front'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Tampak Depan
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSide('back')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            activeSide === 'back'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Tampak Belakang
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSide((s) => (s === 'front' ? 'back' : 'front'))}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Balik Sisi Kartu"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scaled Preview Box that dynamically fits card mm size */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col items-center justify-center w-full min-h-[380px]">
                      {(() => {
                        const previewScale = (settings.cardHeightMm || 110) > 95 ? 1.0 : 1.25;
                        return (
                          <div
                            className="relative flex items-center justify-center transition-all"
                            style={{
                              width: `calc(${settings.cardWidthMm || 80}mm * ${previewScale})`,
                              height: `calc(${settings.cardHeightMm || 110}mm * ${previewScale})`,
                            }}
                          >
                            <div
                              style={{
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'center center',
                              }}
                              className="shadow-md"
                            >
                              <IDCardItem
                                card={activeCard}
                                settings={settings}
                                side={activeSide}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-xs font-mono text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        {settings.cardWidthMm} × {settings.cardHeightMm} mm
                      </span>
                    </div>
                  </div>

                  {/* Card Form Editor (7 cols on xl) */}
                  <div className="xl:col-span-7">
                    <CardEditor
                      card={activeCard}
                      index={cards.findIndex((c) => c.id === activeCardId)}
                      onUpdate={handleUpdateActiveCard}
                      onDelete={handleDeleteCard}
                      onDuplicate={handleDuplicateCard}
                      onApplyTitleToAll={(title, idLabel) => {
                        const updated = cards.map((c) => ({
                          ...c,
                          title,
                          idLabel,
                        }));
                        updateFolderCards(updated);
                        try {
                          confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
                        } catch (_) {}
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Tidak ada kartu yang dipilih</p>
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Tambah Kartu Sekarang
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* -------------------------------------------------------------
              VIEW: A4 PRINT SHEET PREVIEW
          -------------------------------------------------------------- */
          <div className="space-y-6">
            {/* Top Sheet Toolbar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Left: Responsive Pagination Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                  Halaman:
                </span>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  {/* Prev Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewPage((prev) => Math.max(0, prev - 1))}
                    disabled={previewPage === 0}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dropdown Jump Selector */}
                  <select
                    value={previewPage}
                    onChange={(e) => setPreviewPage(Number(e.target.value))}
                    className="bg-white border border-slate-200 font-bold text-xs text-slate-800 rounded-lg px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {cardPages.map((_page, idx) => {
                      const startNum = idx * cardsPerPage + 1;
                      const endNum = Math.min((idx + 1) * cardsPerPage, cards.length);
                      return (
                        <option key={idx} value={idx}>
                          Lembar {idx + 1} dari {cardPages.length} (Kartu #{startNum} - #{endNum})
                        </option>
                      );
                    })}
                  </select>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewPage((prev) => Math.min(cardPages.length - 1, prev + 1))}
                    disabled={previewPage >= cardPages.length - 1}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Info Badge */}
                <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Menampilkan kartu #{previewPage * cardsPerPage + 1} - #{Math.min((previewPage + 1) * cardsPerPage, cards.length)} dari {cards.length}
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Pengaturan</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPrintModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar A4</span>
                </button>
              </div>
            </div>

            {/* Preview Sheet Viewport */}
            <div className="flex flex-col items-center gap-8 py-4 overflow-x-auto">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-white px-3.5 py-1 rounded-full border border-slate-200 shadow-xs">
                  Pratinjau Lembar {previewPage + 1} dari {cardPages.length} ({cardsPerPage} ID Card Lengkap: Depan & Belakang dalam 1 Halaman)
                </span>
                <div className="transform scale-[0.65] origin-top sm:scale-[0.75] md:scale-[0.85] lg:scale-[0.95] xl:scale-100 transition-transform">
                  <A4PrintSheet
                    cards={cardPages[previewPage] || []}
                    pageIndex={previewPage + 1}
                    totalPages={cardPages.length}
                    settings={settings}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          PRINT-ONLY RENDER CONTAINER
          (Only the pages selected in PrintPageModal will be rendered to printer)
      ========================================================================== */}
      <div className="print-only">
        {pagesToPrint.map((pageIdx) => {
          const pageCards = cardPages[pageIdx];
          if (!pageCards) return null;
          return (
            <A4PrintSheet
              key={pageIdx}
              cards={pageCards}
              pageIndex={pageIdx + 1}
              totalPages={cardPages.length}
              settings={settings}
            />
          );
        })}
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================== */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateFolderSettings}
        onExportBackup={() => exportBackup(cards, settings)}
        onImportBackup={handleImportBackup}
        onResetDefaults={handleResetDefaults}
      />

      <PrintPageModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        totalPages={cardPages.length}
        cardPages={cardPages}
        currentPreviewPage={previewPage}
        cardsPerPage={cardsPerPage}
        pageOrientation={sheetLayout.isLandscape ? 'landscape' : 'portrait'}
        onConfirmPrint={handleConfirmPrint}
        onPrintPDF={handlePrintPDF}
        isGeneratingPDF={isGeneratingPDF}
        pdfProgress={pdfProgress}
      />
    </div>
  );
};

export default App;
