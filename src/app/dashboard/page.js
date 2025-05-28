"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import TextInput from "../components/TextInput";
import ImageGallery from "../components/ImageGallery";
import StoredTexts from "../components/StoredTexts";
import Documents from "../components/Documents";
import PageHeader from "../components/PageHeader";
import NavigationTabs from "../components/NavigationTabs";
import NotesView from "../components/NotesView";
import GalleryView from "../components/GalleryView";
import DocumentsView from "../components/DocumentsView";
import { PageLoadingSkeleton, ContentSkeleton } from "../components/Skeletons";
import { useNotes } from "../../../lib/hooks/useNotes";
import { useDocuments } from "../../../lib/hooks/useDocuments";
import { useGalleryImages } from "../../../lib/hooks/useGalleryImages";
import { useRealtimeSync } from "../../../lib/hooks/useRealtimeSync";
import { useAuth } from "../../../lib/AuthProvider";
import supabase from "../../../lib/supabase";

export default function Dashboard() {
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("notes");
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);
  const [newContentBadges, setNewContentBadges] = useState({
    notes: false,
    gallery: false,
    documents: false
  });

  // Refs to track badge auto-clear timers
  const badgeTimers = useRef({
    notes: null,
    gallery: null,
    documents: null
  });

  const { 
    storedTexts, 
    isLoadingNotes, 
    saveNoteHandler, 
    toggleNoteAutoDeleteHandler, 
    reloadNotes, 
    deleteNoteHandler
  } = useNotes(!!user);

  const {
    documents,
    isLoadingDocuments,
    addDocumentHandler,
    deleteDocumentHandler,
    toggleDocAutoDeleteHandler,
    reloadDocuments,
  } = useDocuments(!!user);

  const {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler,
    deleteImageHandler,
    toggleImageAutoDeleteHandler: toggleGalleryImageAutoDeleteHandler,
    reloadGalleryImages,
  } = useGalleryImages(!!user);

  const initialFetchDone = useRef(false);

  // Helper function to set badge with auto-clear timer
  const setBadgeWithTimer = useCallback((section) => {
    // Clear existing timer for this section
    if (badgeTimers.current[section]) {
      clearTimeout(badgeTimers.current[section]);
    }

    // Set the badge to true (glow effect)
    setNewContentBadges(prev => ({
      ...prev,
      [section]: true
    }));

    // Set timer to clear badge after 7 seconds
    badgeTimers.current[section] = setTimeout(() => {
      setNewContentBadges(prev => ({
        ...prev,
        [section]: false
      }));
      badgeTimers.current[section] = null;
    }, 9000);
  }, []);

  // Helper function to clear badge and timer for a section
  const clearBadgeAndTimer = useCallback((section) => {
    if (badgeTimers.current[section]) {
      clearTimeout(badgeTimers.current[section]);
      badgeTimers.current[section] = null;
    }
    setNewContentBadges(prev => ({
      ...prev,
      [section]: false
    }));
  }, []);

  // Realtime sync callbacks
  const handleFileAdded = useCallback((newFile) => {
    // Update badge for appropriate section
    if (newFile.bucket_id === 'images') {
      setBadgeWithTimer("gallery");
      reloadGalleryImages();
    } else if (newFile.bucket_id === 'aeronotes-documents') {
      setBadgeWithTimer("documents");
      reloadDocuments();
    }
  }, [setBadgeWithTimer, reloadGalleryImages, reloadDocuments]);

  const handleFileUpdated = useCallback((updatedFile, oldFile) => {
    // Refresh appropriate data (no badge for updates)
    if (updatedFile.bucket_id === 'images') {
      reloadGalleryImages();
    } else if (updatedFile.bucket_id === 'aeronotes-documents') {
      reloadDocuments();
    }
  }, [reloadGalleryImages, reloadDocuments]);

  const handleFileDeleted = useCallback((deletedFile) => {
    // For deletions, we need to force a reload to ensure sync across devices
    // This is important because optimistic updates may have already removed 
    // the item locally, but we need to sync deletions from other devices
    console.log('🗑️ Dashboard: File deleted via realtime:', deletedFile.name);
    console.log('🗑️ Dashboard: File details:', {
      id: deletedFile.id,
      bucket_id: deletedFile.bucket_id,
      user_id: deletedFile.user_id
    });
    
    if (deletedFile.bucket_id === 'images') {
      console.log('🖼️ Dashboard: Reloading gallery images...');
      // Immediately reload gallery images to sync deletions from other devices
      reloadGalleryImages();
    } else if (deletedFile.bucket_id === 'aeronotes-documents') {
      console.log('📄 Dashboard: Reloading documents...');
      // Immediately reload documents to sync deletions from other devices  
      reloadDocuments();
    }
  }, [reloadGalleryImages, reloadDocuments]);

  // Notes sync callbacks
  const handleNoteAdded = useCallback((newNote) => {
    console.log('📝 Dashboard: Note added via realtime:', newNote.title?.substring(0, 30));
    // Update badge for notes section
    setBadgeWithTimer("notes");
    reloadNotes();
  }, [setBadgeWithTimer, reloadNotes]);

  const handleNoteUpdated = useCallback((updatedNote, oldNote) => {
    // Refresh notes data (no badge for updates)
    console.log('📝 Dashboard: Note updated via realtime:', updatedNote.title?.substring(0, 30));
    reloadNotes();
  }, [reloadNotes]);

  const handleNoteDeleted = useCallback((deletedNote) => {
    // For note deletions, force a reload to ensure sync across devices
    console.log('🗑️ Dashboard: Note deleted via realtime:', deletedNote.title?.substring(0, 30));
    console.log('🗑️ Dashboard: Note details:', {
      id: deletedNote.id,
      user_id: deletedNote.user_id
    });
    console.log('📝 Dashboard: Reloading notes...');
    
    // Immediately reload notes to sync deletions from other devices
    reloadNotes();
  }, [reloadNotes]);

  // Initialize realtime sync
  const { isConnected, activeSessionCount } = useRealtimeSync({
    userId: user?.id,
    onFileAdded: handleFileAdded,
    onFileUpdated: handleFileUpdated,
    onFileDeleted: handleFileDeleted,
    onNoteAdded: handleNoteAdded,
    onNoteUpdated: handleNoteUpdated,
    onNoteDeleted: handleNoteDeleted,
    enabled: !!user,
    currentNotes: storedTexts,
    currentFiles: [...galleryImages, ...documents] // Combine gallery images and documents
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user && !initialFetchDone.current) {
      initialFetchDone.current = true;
    }
    if (!user) {
        initialFetchDone.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      if (activeSection === "documents" || documents.some(d => d.auto_delete)) {
        // ... (documents re-fetch logic - consider using reloadDocuments() from useDocuments)
      }
      if (activeSection === "gallery" || galleryImages.some(img => img.auto_delete)) {
        try {
          // Consider calling reloadGalleryImages() here if periodic refresh is needed from page level
        } catch (error) {
          console.error("Error during periodic image re-fetch:", error);
        }
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, activeSection, documents, galleryImages]);
  
  // Cleanup badge timers on unmount or user change
  useEffect(() => {
    return () => {
      // Clear all badge timers on cleanup
      Object.values(badgeTimers.current).forEach(timer => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    };
  }, [user]);

  const formatLastEdited = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now - date) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderContent = () => {
    if ((activeSection === "notes" && isLoadingNotes) || 
        (activeSection === "gallery" && isLoadingGalleryImages) || 
        (activeSection === "documents" && isLoadingDocuments)) {
      return <ContentSkeleton type={activeSection} />;
    }
    
    switch (activeSection) {
      case "notes":
        return (
          <NotesView 
            storedTexts={storedTexts}
            onSaveText={saveNoteHandler}
            onToggleAutoDelete={toggleNoteAutoDeleteHandler}
            onNoteCreated={reloadNotes}
            onDeleteNote={deleteNoteHandler}
          />
        );
      case "gallery":
        return (
          <GalleryView 
            images={galleryImages}
            isLoading={isLoadingGalleryImages}
            onImageUpload={uploadImageHandler}
            onImageDelete={deleteImageHandler}
            onToggleImageAutoDelete={toggleGalleryImageAutoDeleteHandler}
          />
        );
      case "documents":
        return (
          <DocumentsView 
            documents={documents}
            isLoading={isLoadingDocuments}
            onAddDocument={addDocumentHandler}
            onDeleteDocument={deleteDocumentHandler}
            onToggleAutoDelete={toggleDocAutoDeleteHandler}
            formatLastEdited={formatLastEdited}
          />
        );
      default:
        return <div>Select a section</div>;
    }
  };

  // Clear badge when user switches to a section
  const handleSetSection = useCallback((section) => {
    setActiveSection(section);
    // Clear the badge for the section being viewed
    clearBadgeAndTimer(section);
  }, [clearBadgeAndTimer]);

  // Determine sync status based on connection and session count
  const getSyncStatus = () => {
    if (!isConnected) {
      return { 
        text: 'Connection lost', 
        color: 'bg-red-400', 
        textColor: 'text-red-600 dark:text-red-400',
        glow: 'shadow-lg shadow-red-500/50 animate-pulse'
      };
    }
    if (activeSessionCount > 1) {
      return { 
        text: 'LiveSync Active', 
        color: 'bg-green-500', 
        textColor: 'text-green-600 dark:text-green-400',
        glow: 'shadow-lg shadow-green-500/50 animate-pulse'
      };
    }
    return { 
      text: 'LiveSync Dormant', 
      color: 'bg-amber-500', 
      textColor: 'text-amber-600 dark:text-amber-400',
      glow: 'shadow-md shadow-amber-500/40'
    };
  };

  if (isAuthLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-gray-900 overflow-x-hidden w-full">
      <PageHeader />
      
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-2">
        {/* Realtime Connection Status */}
        <div className="flex items-center space-x-4">
          {/* Connection Status - now permanently visible */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getSyncStatus().color} ${getSyncStatus().glow}`}></div>
            <span className={`text-xs ${getSyncStatus().textColor}`}>
              {getSyncStatus().text}
            </span>
          </div>
        </div>
        
        <button 
          onClick={signOut} 
          className="px-4 py-2 rounded-xl font-semibold text-sm shadow transition border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700"
        >
          Sign Out
        </button>
      </div>
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          <NavigationTabs 
            activeSection={activeSection} 
            onSetSection={handleSetSection}
            newContentBadges={newContentBadges}
          />
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
} 