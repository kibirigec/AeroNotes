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

export default function Home() {
  const [activeSection, setActiveSection] = useState("notes");

  const { 
    storedTexts, 
    isLoadingNotes, 
    saveNoteHandler, 
    toggleNoteAutoDeleteHandler, 
    reloadNotes, 
    deleteNoteHandler
  } = useNotes();

  const {
    documents,
    isLoadingDocuments,
    addDocumentHandler,
    deleteDocumentHandler,
    toggleDocAutoDeleteHandler,
  } = useDocuments();

  const {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler,
    deleteImageHandler,
    toggleImageAutoDeleteHandler: toggleGalleryImageAutoDeleteHandler,
  } = useGalleryImages();

  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
    }
  }, []);

  useEffect(() => {
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
  }, [activeSection, documents, galleryImages]);
  
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-gray-900 overflow-x-hidden w-full">
      <PageHeader />
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
