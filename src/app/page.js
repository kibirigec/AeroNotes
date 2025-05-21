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
  toggleDocumentAutoDelete
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
  deleteImage as deleteGalleryImage,
  toggleImageAutoDelete
} from "../../lib/imageService";

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, signOut, supabase } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("notes");
  const [storedTexts, setStoredTexts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isLoadingGalleryImages, setIsLoadingGalleryImages] = useState(true);

  const initialFetchDone = useRef(false);
  const autoDeleteTimersRef = useRef({});

  useEffect(() => {
    if (user && !initialFetchDone.current) {
      const loadAllData = async () => {
        setIsLoadingNotes(true);
        setIsLoadingDocuments(true);
        setIsLoadingGalleryImages(true);
        try {
          const [notesData, docsData, galleryData] = await Promise.all([
            fetchNotes(),
            fetchDocuments(),
            fetchGalleryImages()
          ]);
          setStoredTexts(notesData.map(n => ({ 
            id: n.id,
            user_id: n.user_id,
            text: n.text,
            autoDelete: n.autoDelete,
            created_at: n.created_at,
            createdAt: new Date(n.created_at).getTime(),
            expiry_date: n.expiry_date
          })));
          
          setDocuments(docsData || []);
          
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

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (user && (activeSection === "documents" || documents.some(d => d.auto_delete))) {
        try {
          const docsData = await fetchDocuments();
          setDocuments(docsData || []);
        } catch (error) {
          console.error("Error during periodic document re-fetch:", error);
        }
      }
      if (user && (activeSection === "gallery" || galleryImages.some(img => img.auto_delete))) {
        try {
          const imagesData = await fetchGalleryImages();
          setGalleryImages(imagesData || []);
        } catch (error) {
          console.error("Error during periodic image re-fetch:", error);
        }
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, activeSection, documents, galleryImages]);

  const handleSaveText = (noteFromInput) => {
    const newNoteForState = {
      id: noteFromInput.id,
      user_id: noteFromInput.user_id,
      text: noteFromInput.text,
      autoDelete: noteFromInput.autoDelete,
      created_at: noteFromInput.created_at,
      createdAt: noteFromInput.createdAt,
      expiry_date: noteFromInput.expiry_date
    };
    setStoredTexts(prevTexts => [newNoteForState, ...prevTexts]);
  };

  const handleToggleAutoDelete = async (noteId) => {
    const noteIndex = storedTexts.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    const originalNote = storedTexts[noteIndex];
    const newAutoDeleteState = !originalNote.autoDelete;

    const optimisticNote = {
       ...originalNote, 
       autoDelete: newAutoDeleteState,
       expiry_date: newAutoDeleteState ? originalNote.expiry_date : null
    };
    setStoredTexts(prev => prev.map(n => n.id === noteId ? optimisticNote : n));

    try {
      const updatedNoteFromDb = await toggleNoteAutoDeleteDb(noteId, newAutoDeleteState);
      const formattedNoteForState = {
        id: updatedNoteFromDb.id,
        user_id: updatedNoteFromDb.user_id,
        text: updatedNoteFromDb.text, 
        autoDelete: updatedNoteFromDb.autoDelete, 
        created_at: updatedNoteFromDb.created_at,
        createdAt: new Date(updatedNoteFromDb.created_at).getTime(),
        expiry_date: updatedNoteFromDb.expiry_date
      };
      setStoredTexts(prev => prev.map(n => n.id === noteId ? formattedNoteForState : n));
    } catch (error) {
      console.error("Error toggling note auto-delete, reverting:", error);
      setStoredTexts(prev => prev.map(n => n.id === noteId ? originalNote : n));
    }
  };

  const handleToggleDocAutoDelete = async (docId, newAutoDeleteState, expiryDays) => {
    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return;
    const originalDoc = documents[docIndex];

    let optimisticExpiryDate = originalDoc.expiry_date;
    if (newAutoDeleteState && expiryDays) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + expiryDays);
      optimisticExpiryDate = newExpiry.toISOString();
    } else if (!newAutoDeleteState) {
      optimisticExpiryDate = null;
    }

    const optimisticDoc = {
      ...originalDoc,
      auto_delete: newAutoDeleteState,
      expiry_date: optimisticExpiryDate
    };
    setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? optimisticDoc : d));

    try {
      const updatedDocFromDb = await toggleDocumentAutoDelete(docId, newAutoDeleteState, expiryDays);
      setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? updatedDocFromDb : d));
    } catch (error) {
      console.error("Error toggling document auto-delete, reverting optimistic update:", error);
      setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? originalDoc : d));
    }
  };

  const handleToggleImageAutoDelete = async (imageId, newAutoDeleteState, expiryDays) => {
    const imgIndex = galleryImages.findIndex(img => img.id === imageId);
    if (imgIndex === -1) return;
    const originalImage = galleryImages[imgIndex];

    let optimisticExpiryDate = originalImage.expiry_date;
    if (newAutoDeleteState && expiryDays) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + expiryDays);
      optimisticExpiryDate = newExpiry.toISOString();
    } else if (!newAutoDeleteState) {
      optimisticExpiryDate = null;
    }

    const optimisticImage = {
      ...originalImage,
      auto_delete: newAutoDeleteState,
      expiry_date: optimisticExpiryDate
    };
    setGalleryImages(prevImgs => prevImgs.map(img => img.id === imageId ? optimisticImage : img));

    try {
      const updatedImageFromDb = await toggleImageAutoDelete(imageId, newAutoDeleteState, expiryDays);
      setGalleryImages(prevImgs => prevImgs.map(img => img.id === imageId ? updatedImageFromDb : img));
    } catch (error) {
      console.error("Error toggling image auto-delete, reverting optimistic update:", error);
      setGalleryImages(prevImgs => prevImgs.map(img => img.id === imageId ? originalImage : img));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleAddDocument = async (formData) => {
    try {
      const newDocFromDb = await createDocument(formData);
      setDocuments(prevDocs => [newDocFromDb, ...prevDocs]);
    } catch (error) {
      console.error("Error adding document:", error);
      throw error; 
    }
  };
  
  const handleDeleteDocument = async (id) => {
    try {
      setDocuments(docs => docs.filter(d => d.id !== id));
      await deleteDocumentService(id);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleImageUpload = async (file, altText, autoDelete, expiryDays) => {
    setIsLoadingGalleryImages(true);
    try {
      const newImageFromDb = await uploadGalleryImage(file, altText, autoDelete, expiryDays);
      setGalleryImages(prevImages => [newImageFromDb, ...prevImages]);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoadingGalleryImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      setGalleryImages(imgs => imgs.filter(img => img.id !== imageId));
      await deleteGalleryImage(imageId);
    } catch (error) {
      console.error("Error deleting image:", error);
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
          <div className="flex flex-col gap-6">
            <div className="h-[calc(50vh-120px)] min-h-[250px]">
              <TextInput onSaveText={handleSaveText} />
            </div>
            <div className="h-[calc(50vh-120px)] min-h-[300px]">
              <StoredTexts texts={storedTexts} onToggleAutoDelete={handleToggleAutoDelete} />
            </div>
          </div>
        );
      case "gallery":
        return <ImageGallery images={galleryImages} isLoading={isLoadingGalleryImages} onImageUpload={handleImageUpload} onImageDelete={handleDeleteImage} onToggleImageAutoDelete={handleToggleImageAutoDelete} />;
      case "documents":
        return <Documents 
                  documents={documents}
                  isLoading={isLoadingDocuments}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onToggleAutoDelete={handleToggleDocAutoDelete}
                  formatLastEdited={formatLastEdited}
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-900">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      );
  }

  return (
    <div className="relative min-h-screen flex flex-col z-10">
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
