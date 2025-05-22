"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import TextInput from "./components/TextInput";
import ImageGallery from "./components/ImageGallery";
import StoredTexts from "./components/StoredTexts";
import Documents from "./components/Documents";
import PageHeader from "./components/PageHeader";
import NavigationTabs from "./components/NavigationTabs";
import NotesView from "./components/NotesView";
import GalleryView from "./components/GalleryView";
import DocumentsView from "./components/DocumentsView";
import { useAuth } from "../../lib/AuthContext";
import { useNotes } from "../../lib/hooks/useNotes";
import { useDocuments } from "../../lib/hooks/useDocuments";
import { useGalleryImages } from "../../lib/hooks/useGalleryImages";

// Helper function to enforce theme on all elements
const enforceThemeOnAllElements = () => {
  const isDark = document.documentElement.classList.contains('dark');
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  const elements = document.querySelectorAll('.force-theme');
  elements.forEach(el => {
    el.style.colorScheme = isDark ? 'dark' : 'light';
  });
};

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, signOut, supabase } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("notes");
  const { 
    storedTexts, 
    isLoadingNotes, 
    saveNoteHandler, 
    toggleNoteAutoDeleteHandler, 
    reloadNotes
  } = useNotes(user);

  const {
    documents,
    isLoadingDocuments,
    addDocumentHandler,
    deleteDocumentHandler,
    toggleDocAutoDeleteHandler,
  } = useDocuments(user);

  const {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler,
    deleteImageHandler,
    toggleImageAutoDeleteHandler: toggleGalleryImageAutoDeleteHandler,
  } = useGalleryImages(user);

  const initialFetchDone = useRef(false);

  // Set up a theme change observer that will update all components
  useEffect(() => {
    // Apply theme on mount
    enforceThemeOnAllElements();

    // Create an observer to watch for class changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'class'
        ) {
          enforceThemeOnAllElements();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    // Clean up
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user && !initialFetchDone.current) {
      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
      }
    }
  }, [user]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (user && (activeSection === "documents" || documents.some(d => d.auto_delete))) {
        // ... (documents re-fetch logic - consider using reloadDocuments() from useDocuments)
      }
      if (user && (activeSection === "gallery" || galleryImages.some(img => img.auto_delete))) {
        try {
          // Consider calling reloadGalleryImages() here if periodic refresh is needed from page level
        } catch (error) {
          console.error("Error during periodic image re-fetch:", error);
        }
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, activeSection, documents, galleryImages]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
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
    if (authLoading || 
        (activeSection === "notes" && isLoadingNotes) || 
        (activeSection === "gallery" && isLoadingGalleryImages) || 
        (activeSection === "documents" && isLoadingDocuments)) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    switch (activeSection) {
      case "notes":
        return (
          <NotesView 
            storedTexts={storedTexts}
            onSaveText={saveNoteHandler}
            onToggleAutoDelete={toggleNoteAutoDeleteHandler}
            onNoteCreated={reloadNotes}
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && router.asPath !== '/login' && typeof window !== 'undefined' && window.location.pathname !== '/login')) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-900">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col force-theme bg-slate-100 dark:bg-gray-900">
      <PageHeader 
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onLogin={() => router.push('/login')}
      />
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col relative z-10">
        <NavigationTabs 
          activeSection={activeSection} 
          onSetSection={setActiveSection} 
        />
        {renderContent()}
      </main>
    </div>
  );
}
