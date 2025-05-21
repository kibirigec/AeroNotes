"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import DarkModeToggle from "./components/DarkModeToggle";
import TextInput from "./components/TextInput";
import ImageGallery from "./components/ImageGallery";
import StoredTexts from "./components/StoredTexts";
import Documents from "./components/Documents";
import { useAuth } from "../../lib/AuthContext";
import { 
  fetchDocuments, 
  createDocument, 
  deleteDocument as deleteDocumentService,
  toggleDocumentAutoDelete as toggleDocAutoDeleteService // This service will simply toggle the boolean
} from "../../lib/documentService";
import { 
  fetchNotes, 
  createNote as saveNoteToDb, 
  toggleNoteAutoDelete as toggleNoteAutoDeleteDb, 
  deleteNote as deleteNoteDb 
} from "../../lib/notesService";
import { 
  fetchImageMetadata as fetchGalleryImages, 
  uploadImage as uploadGalleryImage, 
  deleteImage as deleteGalleryImage 
} from "../../lib/imageService"; // Correcting this path, assuming imageService.js is in lib/

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, signOut, supabase } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("notes");
  const [storedTexts, setStoredTexts] = useState([]);
  const [documents, setDocuments] = useState([]); // This will store full doc objects including scheduled_deletion
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isLoadingGalleryImages, setIsLoadingGalleryImages] = useState(true);

  const initialFetchDone = useRef(false);
  const autoDeleteTimersRef = useRef({}); // For notes auto-delete (client-side)

  // Fetch initial data 
  useEffect(() => {
    if (user && !initialFetchDone.current) {
      const loadAllData = async () => {
        setIsLoadingNotes(true);
        setIsLoadingDocuments(true);
        setIsLoadingGalleryImages(true);
        try {
          const [notesData, docsData, galleryData] = await Promise.all([
            fetchNotes(),
            // Ensure fetchDocuments selects 'scheduled_deletion' and 'file_path'
            fetchDocuments(), 
            fetchGalleryImages()
          ]);
          setStoredTexts(notesData.map(n => ({ 
            ...n, 
            content: n.content, 
            autoDelete: n.autoDelete !== undefined ? n.autoDelete : n.auto_delete, 
            createdAt: new Date(n.created_at).getTime() 
          })));
          
          // Ensure docsData contains scheduled_deletion and file_path from the DB query
          setDocuments(docsData.map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
            autoDelete: d.auto_delete, // This is the boolean
            createdAt: new Date(d.created_at).getTime(),
            lastEdited: new Date(d.last_edited).getTime(),
            filePath: d.file_path, // Crucial for manual delete and potentially for display
            scheduledDeletion: d.scheduled_deletion ? new Date(d.scheduled_deletion).toISOString() : null // Store as ISO string or timestamp
          })));
          
          setGalleryImages(galleryData || []);
        } catch (error) {
          console.error("Error fetching initial data:", error);
        } finally {
          setIsLoadingNotes(false);
          setIsLoadingDocuments(false);
          setIsLoadingGalleryImages(false);
          initialFetchDone.current = true;
        }
      };
      loadAllData();
    }
  }, [user]);

  // Client-side timer for StoredTexts (notes) - this remains unchanged
  useEffect(() => {
    Object.values(autoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    autoDeleteTimersRef.current = {};
    storedTexts.forEach((item) => {
      if (item.autoDelete) {
        autoDeleteTimersRef.current[item.id] = setTimeout(() => {
          setStoredTexts(prev => prev.filter(note => note.id !== item.id));
        }, 7000); 
      }
    });
    return () => {
      Object.values(autoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [storedTexts]);

  // Periodically re-fetch documents to reflect backend deletions by cron job
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (user && (activeSection === "documents" || documents.some(d => d.autoDelete))) {
        // console.log("Periodic re-fetch of documents due to potential auto-deletions...");
        try {
          const docsData = await fetchDocuments(); // Ensure this selects scheduled_deletion
          setDocuments(docsData.map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
            autoDelete: d.auto_delete,
            createdAt: new Date(d.created_at).getTime(),
            lastEdited: new Date(d.last_edited).getTime(),
            filePath: d.file_path,
            scheduledDeletion: d.scheduled_deletion ? new Date(d.scheduled_deletion).toISOString() : null
          })));
        } catch (error) {
          console.error("Error during periodic document re-fetch:", error);
        }
      }
    }, 15000); // Re-fetch every 15 seconds for example

    return () => clearInterval(intervalId);
  }, [user, activeSection, documents]); // Add documents to re-evaluate if any are marked for auto-delete

  const handleSaveText = (noteFromInput) => {
    const newNote = {
      id: noteFromInput.id,
      content: noteFromInput.content,
      autoDelete: noteFromInput.autoDelete,
      createdAt: noteFromInput.createdAt
    };
    setStoredTexts(prevTexts => [newNote, ...prevTexts]);
  };

  const handleToggleAutoDelete = async (noteId) => {
    // ... (notes toggle logic remains client-side for now or needs its own backend solution)
    const noteIndex = storedTexts.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    const originalNote = storedTexts[noteIndex];
    const newAutoDeleteState = !originalNote.autoDelete;
    const optimisticNote = { ...originalNote, autoDelete: newAutoDeleteState, createdAt: newAutoDeleteState ? (originalNote.createdAt || Date.now()) : originalNote.createdAt };
    setStoredTexts(prev => prev.map(n => n.id === noteId ? optimisticNote : n));
    try {
      const updatedNoteFromDb = await toggleNoteAutoDeleteDb(noteId, newAutoDeleteState);
      const formattedNote = { ...updatedNoteFromDb, content: updatedNoteFromDb.content, autoDelete: updatedNoteFromDb.autoDelete !== undefined ? updatedNoteFromDb.autoDelete : updatedNoteFromDb.auto_delete, createdAt: new Date(updatedNoteFromDb.created_at).getTime() };
      setStoredTexts(prev => prev.map(n => n.id === noteId ? formattedNote : n));
    } catch (error) {
      console.error("Error toggling note auto-delete, reverting:", error);
      setStoredTexts(prev => prev.map(n => n.id === noteId ? originalNote : n));
    }
  };

  const handleToggleDocAutoDelete = async (docId) => {
    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return;
    const originalDoc = documents[docIndex];
    const newAutoDeleteState = !originalDoc.autoDelete;

    // Optimistic UI update
    const optimisticDoc = { 
      ...originalDoc, 
      autoDelete: newAutoDeleteState, 
      // scheduledDeletion will be updated by backend, so we can clear it or leave as is optimistically
      // For simplicity, let's just toggle autoDelete here. The re-fetch will get the new scheduled_deletion.
      scheduledDeletion: newAutoDeleteState ? "pending..." : null // Indicate pending or clear
    };
    setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? optimisticDoc : d));

    try {
      // This service now just updates the auto_delete boolean. DB triggers handle the rest.
      const updatedDocFromDb = await toggleDocAutoDeleteService(docId, newAutoDeleteState);
      // Re-fetch or update state with the actual scheduled_deletion from DB response
      setDocuments(prevDocs => prevDocs.map(d => 
        d.id === docId ? { 
          ...d, // keep optimistic changes for a moment if needed, or use full updatedDocFromDb
          autoDelete: updatedDocFromDb.auto_delete,
          scheduledDeletion: updatedDocFromDb.scheduled_deletion ? new Date(updatedDocFromDb.scheduled_deletion).toISOString() : null,
          // ensure other fields are also from updatedDocFromDb if they changed
          title: updatedDocFromDb.title, 
          content: updatedDocFromDb.content,
          createdAt: new Date(updatedDocFromDb.created_at).getTime(),
          lastEdited: new Date(updatedDocFromDb.last_edited).getTime(),
          filePath: updatedDocFromDb.file_path,
        } : d
      ));
    } catch (error) {
      console.error("Error toggling document auto-delete, reverting optimistic update:", error);
      setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? originalDoc : d));
    }
  };
  
  // This function now calculates remaining time based on doc.scheduledDeletion
  const getDocRemainingTime = useCallback((doc) => {
    if (!doc.autoDelete || !doc.scheduledDeletion) return 0;
    const deletionTime = new Date(doc.scheduledDeletion).getTime();
    const currentTime = Date.now();
    const remainingMs = Math.max(0, deletionTime - currentTime);
    return Math.floor(remainingMs / 1000); // Convert to seconds
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleAddDocument = async (formData, file) => {
    try {
      const newDocFromDb = await createDocument(formData, file); // Ensure this service returns scheduled_deletion if auto_delete is true
      const formattedDoc = {
        id: newDocFromDb.id,
        title: newDocFromDb.title,
        content: newDocFromDb.content,
        autoDelete: newDocFromDb.auto_delete,
        createdAt: new Date(newDocFromDb.created_at).getTime(),
        lastEdited: new Date(newDocFromDb.last_edited).getTime(),
        filePath: newDocFromDb.file_path,
        scheduledDeletion: newDocFromDb.scheduled_deletion ? new Date(newDocFromDb.scheduled_deletion).toISOString() : null
      };
      setDocuments(prevDocs => [formattedDoc, ...prevDocs]);
    } catch (error) {
      console.error("Error adding document:", error);
      throw error; 
    }
  };
  
  const handleDeleteDocument = async (id) => {
    try {
      // Optimistically remove from UI
      setDocuments(docs => docs.filter(d => d.id !== id));
      await deleteDocumentService(id); // This deletes from DB. Storage file deletion relies on cron job's attempt or manual.
    } catch (error) {
      console.error("Error deleting document:", error);
      // Re-fetch or add back to UI if delete failed? For now, log and rely on periodic re-fetch to correct.
    }
  };

  const handleImageUpload = async (file, altText) => {
    if (!file) return;
    setIsLoadingGalleryImages(true);
    try {
      const newImage = await uploadGalleryImage(file, altText);
      setGalleryImages(prevImages => [newImage, ...prevImages]);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoadingGalleryImages(false);
    }
  };

  const handleDeleteImage = async (imageId, filePath) => {
    setIsLoadingGalleryImages(true);
    try {
      await deleteGalleryImage(imageId, filePath);
      setGalleryImages(prevImages => prevImages.filter(img => img.id !== imageId));
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setIsLoadingGalleryImages(false);
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <TextInput onSaveText={handleSaveText} />
            <StoredTexts texts={storedTexts} onToggleAutoDelete={handleToggleAutoDelete} />
          </div>
        );
      case "gallery":
        return <ImageGallery images={galleryImages} isLoading={isLoadingGalleryImages} onImageUpload={handleImageUpload} onImageDelete={handleDeleteImage} />;
      case "documents":
        return <Documents 
                  documents={documents}
                  isLoadingDocuments={isLoadingDocuments}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onToggleAutoDelete={handleToggleDocAutoDelete}
                  formatLastEdited={formatLastEdited}
                  getDocRemainingTime={getDocRemainingTime} // Use the new backend-driven calculation
                />;
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
        </div>
      );
  }

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 bg-white/70 dark:bg-blue-950/80 backdrop-blur-md shadow-sm border-b border-blue-100 dark:border-blue-900 z-20">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-400 mr-2" />
          <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">AeroNotes</h1>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <span className="text-sm text-blue-700 dark:text-blue-300 hidden sm:inline-block">
              {user.email}
            </span>
          )}
          <DarkModeToggle />
          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              className="rounded-full bg-blue-600 text-white px-4 py-2 font-medium shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition"
            >
              Logout
            </button>
          ) : (
            <button 
              onClick={() => router.push('/login')}
              className="rounded-full bg-blue-600 text-white px-4 py-2 font-medium shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition"
            >
              Login
            </button>
          )}
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-4xl mx-auto">
          <nav className="hidden lg:flex justify-center space-x-6 py-6">
            <button 
              onClick={() => setActiveSection("notes")}
              className={`px-6 py-3 rounded-lg flex items-center font-medium transition ${activeSection === "notes" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Notes
            </button>
            <button 
              onClick={() => setActiveSection("gallery")}
              className={`px-6 py-3 rounded-lg flex items-center font-medium transition ${activeSection === "gallery" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Gallery
            </button>
            <button 
              onClick={() => setActiveSection("documents")}
              className={`px-6 py-3 rounded-lg flex items-center font-medium transition ${activeSection === "documents" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Documents
            </button>
          </nav>
          <div className="lg:hidden flex justify-center border-b border-blue-100 dark:border-blue-900 bg-white/70 dark:bg-blue-950/80">
            <div className="flex space-x-2 p-2">
              <button onClick={() => setActiveSection("notes")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "notes" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}>Notes</button>
              <button onClick={() => setActiveSection("gallery")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "gallery" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}>Gallery</button>
              <button onClick={() => setActiveSection("documents")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "documents" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}>Docs</button>
            </div>
          </div>
          <main className="p-4 lg:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
