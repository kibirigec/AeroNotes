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
import AutoSignoutTimer from "../components/AutoSignoutTimer";
import { useNotes } from "../../../lib/hooks/useNotes";
import { useDocuments } from "../../../lib/hooks/useDocuments";
import { useGalleryImages } from "../../../lib/hooks/useGalleryImages";
import { useRealtimeSync } from "../../../lib/hooks/useRealtimeSync";
import { useAuth } from "../../../lib/AuthProvider";
import supabase from "../../../lib/supabase";

export default function Dashboard() {
  const { user, signOut, isLoading: isAuthLoading, autoSignout } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("notes");
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);
  const [newContentBadges, setNewContentBadges] = useState({
    notes: false,
    gallery: false,
    documents: false
  });
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

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
    deleteNoteHandler,
    setStoredTexts
  } = useNotes(!!user);

  const {
    documents,
    isLoadingDocuments,
    addDocumentHandler,
    deleteDocumentHandler,
    toggleDocAutoDeleteHandler,
    reloadDocuments,
    setDocuments
  } = useDocuments(!!user);

  const {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler,
    deleteImageHandler,
    toggleImageAutoDeleteHandler: toggleGalleryImageAutoDeleteHandler,
    reloadGalleryImages,
    setGalleryImages
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
    console.log('📁 Dashboard: File added via realtime:', newFile);
    
    // Update badge for appropriate section
    if (newFile.bucket_id === 'images') {
      setBadgeWithTimer("gallery");
      
      // Add a small delay for images to ensure they're accessible
      setTimeout(() => {
        setGalleryImages(prevImages => {
          // Check if image already exists to prevent duplicates
          if (prevImages.some(img => img.id === newFile.id)) {
            console.log('🔄 Dashboard: Image already exists, skipping duplicate');
            return prevImages;
          }
          
          // Generate URL if not present (realtime sync might not include it)
          let imageUrl = newFile.url;
          if (!imageUrl && newFile.file_path && newFile.bucket_id) {
            console.log('🔗 Dashboard: Generating URL for realtime image');
            imageUrl = supabase.storage.from(newFile.bucket_id).getPublicUrl(newFile.file_path).data.publicUrl;
          }
          
          // Ensure the new image has a cache-busted URL
          const imageWithFreshUrl = {
            ...newFile,
            url: imageUrl && imageUrl.includes('?cb=') ? imageUrl : `${imageUrl || ''}?cb=${Date.now()}`,
            isRecent: true
          };
          
          console.log('✅ Dashboard: Adding new image to gallery:', imageWithFreshUrl.file_name);
          return [imageWithFreshUrl, ...prevImages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });
      }, 500); // Small delay to ensure file is accessible
    } else if (newFile.bucket_id === 'aeronotes-documents') {
      setBadgeWithTimer("documents");
      // Add the new document to existing state instead of reloading
      setDocuments(prevDocs => {
        // Check if document already exists to prevent duplicates
        if (prevDocs.some(doc => doc.id === newFile.id)) {
          return prevDocs;
        }
        return [newFile, ...prevDocs];
      });
    }
  }, [setBadgeWithTimer]);

  const handleFileUpdated = useCallback((updatedFile, oldFile) => {
    // Update specific item in state instead of reloading
    if (updatedFile.bucket_id === 'images') {
      setGalleryImages(prevImages => 
        prevImages.map(img => {
          if (img.id === updatedFile.id) {
            // Generate URL if not present
            let imageUrl = updatedFile.url;
            if (!imageUrl && updatedFile.file_path && updatedFile.bucket_id) {
              imageUrl = supabase.storage.from(updatedFile.bucket_id).getPublicUrl(updatedFile.file_path).data.publicUrl;
            }
            
            return {
              ...updatedFile,
              url: imageUrl || img.url // Fallback to existing URL if generation fails
            };
          }
          return img;
        })
      );
    } else if (updatedFile.bucket_id === 'aeronotes-documents') {
      setDocuments(prevDocs => 
        prevDocs.map(doc => doc.id === updatedFile.id ? updatedFile : doc)
      );
    }
  }, []);

  const handleFileDeleted = useCallback((deletedFile) => {
    // Remove specific item from state instead of reloading
    console.log('🗑️ Dashboard: File deleted via realtime:', deletedFile.name);
    console.log('🗑️ Dashboard: File details:', {
      id: deletedFile.id,
      bucket_id: deletedFile.bucket_id,
      user_id: deletedFile.user_id
    });
    
    if (deletedFile.bucket_id === 'images') {
      console.log('🖼️ Dashboard: Removing image from state...');
      setGalleryImages(prevImages => 
        prevImages.filter(img => img.id !== deletedFile.id)
      );
    } else if (deletedFile.bucket_id === 'aeronotes-documents') {
      console.log('📄 Dashboard: Removing document from state...');
      setDocuments(prevDocs => 
        prevDocs.filter(doc => doc.id !== deletedFile.id)
      );
    }
  }, []);

  // Notes sync callbacks
  const handleNoteAdded = useCallback((newNote) => {
    console.log('📝 Dashboard: Note added via realtime:', newNote.title?.substring(0, 30));
    // Update badge for notes section
    setBadgeWithTimer("notes");
    // Add the new note to existing state instead of reloading
    setStoredTexts(prevNotes => {
      // Check if note already exists to prevent duplicates
      if (prevNotes.some(note => note.id === newNote.id)) {
        return prevNotes;
      }
      return [newNote, ...prevNotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });
  }, [setBadgeWithTimer]);

  const handleNoteUpdated = useCallback((updatedNote, oldNote) => {
    // Update specific note in state instead of reloading
    console.log('📝 Dashboard: Note updated via realtime:', updatedNote.title?.substring(0, 30));
    setStoredTexts(prevNotes => 
      prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
  }, []);

  const handleNoteDeleted = useCallback((deletedNote) => {
    // Remove specific note from state instead of reloading
    console.log('🗑️ Dashboard: Note deleted via realtime:', deletedNote.title?.substring(0, 30));
    console.log('🗑️ Dashboard: Note details:', {
      id: deletedNote.id,
      user_id: deletedNote.user_id
    });
    console.log('📝 Dashboard: Removing note from state...');
    
    setStoredTexts(prevNotes => 
      prevNotes.filter(note => note.id !== deletedNote.id)
    );
  }, []);

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
            onRefresh={reloadGalleryImages}
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
      
      {/* Mobile-friendly header layout */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile layout (stacked) */}
        <div className="block lg:hidden">
          {/* Top row: LiveSync status and buttons */}
          <div className="flex justify-between items-center py-2">
            {/* LiveSync Status - compact */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getSyncStatus().color} ${getSyncStatus().glow}`}></div>
              <span className={`text-xs ${getSyncStatus().textColor}`}>
                {getSyncStatus().text}
              </span>
              {/* Simplified info icon for mobile */}
              <button
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="LiveSync info"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
            
            {/* Compact buttons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => router.push('/preferences')} 
                className="p-2 rounded-lg font-medium text-xs shadow-sm transition border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Preferences"
              >
                ⚙️
              </button>
              <button 
                onClick={signOut} 
                className="p-2 rounded-lg font-medium text-xs shadow-sm transition border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Bottom row: Timer (centered) */}
          {autoSignout?.settings?.enabled && (
            <div className="flex items-center justify-center pb-2">
              <AutoSignoutTimer
                enabled={autoSignout?.settings?.enabled}
                timeoutMinutes={autoSignout?.timeoutMinutes}
                isActivelyTyping={autoSignout?.isActivelyTyping}
                lastActivity={autoSignout?.lastActivity}
                isMobile={autoSignout?.isMobile}
                onActivity={autoSignout?.detectActivity}
              />
            </div>
          )}
        </div>
        
        {/* Desktop layout (horizontal) */}
        <div className="hidden lg:flex justify-between items-center py-2">
          {/* Realtime Connection Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getSyncStatus().color} ${getSyncStatus().glow}`}></div>
              <div className="flex items-center">
                <span className={`text-xs ${getSyncStatus().textColor}`}>
                  {getSyncStatus().text}
                </span>
                {/* Info icon with tooltip */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                    onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1"
                    aria-label="LiveSync information"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                  
                  {/* Tooltip */}
                  {showInfoTooltip && (
                    <div className="absolute left-0 top-6 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50 text-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">LiveSync Status</div>
                      <div className="space-y-2 text-gray-700 dark:text-gray-300">
                        <div><span className="font-medium text-green-600 dark:text-green-400">Active:</span> Multiple devices/tabs open - real-time sync enabled</div>
                        <div><span className="font-medium text-amber-600 dark:text-amber-400">Dormant:</span> Single session - sync ready but inactive</div>
                        <div><span className="font-medium text-red-600 dark:text-red-400">Connection lost:</span> Offline or sync unavailable</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                        LiveSync automatically syncs notes, images, and documents across all your devices in real-time.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Center section with Auto Signout Timer */}
          <div className="flex items-center justify-center">
            <AutoSignoutTimer
              enabled={autoSignout?.settings?.enabled}
              timeoutMinutes={autoSignout?.timeoutMinutes}
              isActivelyTyping={autoSignout?.isActivelyTyping}
              lastActivity={autoSignout?.lastActivity}
              isMobile={autoSignout?.isMobile}
              onActivity={autoSignout?.detectActivity}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/preferences')} 
              className="px-4 py-2 rounded-xl font-semibold text-sm shadow transition border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            >
              ⚙️ Preferences
            </button>
            <button 
              onClick={signOut} 
              className="px-4 py-2 rounded-xl font-semibold text-sm shadow transition border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Mobile info tooltip - positioned differently */}
        {showInfoTooltip && (
          <div className="block lg:hidden fixed inset-x-4 top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50 text-xs">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">LiveSync Status</div>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div><span className="font-medium text-green-600 dark:text-green-400">Active:</span> Multiple devices/tabs open - real-time sync enabled</div>
              <div><span className="font-medium text-amber-600 dark:text-amber-400">Dormant:</span> Single session - sync ready but inactive</div>
              <div><span className="font-medium text-red-600 dark:text-red-400">Connection lost:</span> Offline or sync unavailable</div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
              LiveSync automatically syncs notes, images, and documents across all your devices in real-time.
            </div>
            <button 
              onClick={() => setShowInfoTooltip(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
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