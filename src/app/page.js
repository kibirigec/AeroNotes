"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import TextInput from "./components/TextInput";
import ImageGallery from "./components/ImageGallery";
import StoredTexts from "./components/StoredTexts";
import Documents from "./components/Documents";
import PageHeader from "./components/PageHeader";
import NavigationTabs from "./components/NavigationTabs";
import NotesView from "./components/NotesView";
import GalleryView from "./components/GalleryView";
import DocumentsView from "./components/DocumentsView";
import { PageLoadingSkeleton, ContentSkeleton } from "./components/Skeletons";
import { useNotes } from "../../lib/hooks/useNotes";
import { useDocuments } from "../../lib/hooks/useDocuments";
import { useGalleryImages } from "../../lib/hooks/useGalleryImages";

// Auth imports
import { useAuth } from "../../lib/AuthProvider";
import SignUpForm from './components/auth/SignUpForm';
import LoginForm from './components/auth/LoginForm';

export default function Home() {
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("notes");

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
  } = useDocuments(!!user);

  const {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler,
    deleteImageHandler,
    toggleImageAutoDeleteHandler: toggleGalleryImageAutoDeleteHandler,
  } = useGalleryImages(!!user);

  const initialFetchDone = useRef(false);

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

  if (isAuthLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-8">
          <div>
            <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
          </div>
          <SignUpForm />
          <hr className="my-6 border-gray-300 dark:border-gray-700" />
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-gray-900 overflow-x-hidden w-full">
      <PageHeader />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end py-2">
        <button 
          onClick={signOut} 
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          <NavigationTabs 
            activeSection={activeSection} 
            onSetSection={setActiveSection} 
          />
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
