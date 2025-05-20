"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import DarkModeToggle from "./components/DarkModeToggle";
import TextInput from "./components/TextInput";
import ImageGallery from "./components/ImageGallery";
import StoredTexts from "./components/StoredTexts";
import Documents from "./components/Documents";
import { useAuth } from "../../lib/AuthContext";
import { fetchDocuments, createDocument, deleteDocument, toggleDocumentAutoDelete as toggleDocAutoDeleteService } from "../../lib/documentService";
import { fetchNotes, createNote as saveNoteToDb, toggleNoteAutoDelete as toggleNoteAutoDeleteDb, deleteNote as deleteNoteDb } from "../../lib/notesService";
import { 
  fetchImageMetadata as fetchGalleryImages, 
  uploadImage as uploadGalleryImage, 
  deleteImage as deleteGalleryImage 
} from "../../lib/imageService";

export default function Home() {
  // Auth state
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const router = useRouter();
  
  // Stored text entries with autoDelete property
  const [storedTexts, setStoredTexts] = useState([]);
  const autoDeleteTimersRef = useRef({});
  
  const [activeSection, setActiveSection] = useState("notes");
  
  // Documents state
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const docAutoDeleteTimersRef = useRef({});
  
  // State for loading notes
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  
  // State for gallery images
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoadingGalleryImages, setIsLoadingGalleryImages] = useState(false);

  // Fetch initial notes from DB
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingNotes(true);
      fetchNotes()
        .then(notesFromDb => {
          const formattedNotes = notesFromDb.map(note => ({
            id: note.id,
            content: note.content,
            autoDelete: note.autoDelete !== undefined ? note.autoDelete : note.auto_delete,
            createdAt: new Date(note.created_at).getTime()
          }));
          setStoredTexts(formattedNotes);
        })
        .catch(error => console.error("Error fetching initial notes:", error))
        .finally(() => setIsLoadingNotes(false));
    } else {
      setStoredTexts([]);
    }
  }, [isAuthenticated]);

  // Fetch initial gallery images from DB
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingGalleryImages(true);
      fetchGalleryImages()
        .then(imagesFromDb => setGalleryImages(imagesFromDb))
        .catch(error => console.error("Error fetching gallery images:", error))
        .finally(() => setIsLoadingGalleryImages(false));
    } else {
      setGalleryImages([]);
    }
  }, [isAuthenticated]);

  // Fetch initial documents from DB
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingDocuments(true);
      fetchDocuments()
        .then(docsFromDb => {
          const formattedDocs = docsFromDb.map(doc => ({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            autoDelete: doc.auto_delete,
            createdAt: new Date(doc.created_at).getTime(),
            lastEdited: new Date(doc.last_edited).getTime()
          }));
          setDocuments(formattedDocs);
        })
        .catch(error => console.error("Error fetching documents:", error))
        .finally(() => setIsLoadingDocuments(false));
    } else {
      setDocuments([]);
    }
  }, [isAuthenticated]);

  // Manage auto-delete timers for notes
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

  // Manage document auto-delete timers
  useEffect(() => {
    Object.values(docAutoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    docAutoDeleteTimersRef.current = {};
    documents.forEach((doc) => {
      if (doc.autoDelete) {
        docAutoDeleteTimersRef.current[doc.id] = setTimeout(() => {
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
        }, 15000);
      }
    });
    return () => {
      Object.values(docAutoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [documents]);

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
    const note = storedTexts.find(n => n.id === noteId);
    if (!note) return;
    const newAutoDeleteState = !note.autoDelete;
    try {
      const updatedNoteFromDb = await toggleNoteAutoDeleteDb(noteId, newAutoDeleteState);
      const formattedNote = {
        ...updatedNoteFromDb,
        content: updatedNoteFromDb.content,
        autoDelete: updatedNoteFromDb.autoDelete !== undefined ? updatedNoteFromDb.autoDelete : updatedNoteFromDb.auto_delete,
        createdAt: new Date(updatedNoteFromDb.created_at).getTime(),
      };
      setStoredTexts(prev => prev.map(n => n.id === noteId ? formattedNote : n));
    } catch (error) {
      console.error("Error toggling note auto-delete:", error);
    }
  };

  const handleToggleDocAutoDelete = async (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const newAutoDeleteState = !doc.autoDelete;
    try {
      const updatedDocFromDb = await toggleDocAutoDeleteService(docId, newAutoDeleteState);
      const formattedDoc = {
        id: updatedDocFromDb.id,
        title: updatedDocFromDb.title,
        content: updatedDocFromDb.content,
        autoDelete: updatedDocFromDb.auto_delete,
        createdAt: new Date(updatedDocFromDb.created_at).getTime(),
        lastEdited: new Date(updatedDocFromDb.last_edited).getTime()
      };
      setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? formattedDoc : d));
    } catch (error) {
      console.error("Error toggling document auto-delete:", error);
    }
  };
  
  const getDocRemainingTime = (doc) => {
    if (!doc.autoDelete || !doc.createdAt) return null;
    const elapsedTime = Date.now() - doc.createdAt;
    const remainingTime = Math.max(0, 15000 - elapsedTime);
    return (remainingTime / 1000).toFixed(1);
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
      const formattedDoc = {
        id: newDocFromDb.id,
        title: newDocFromDb.title,
        content: newDocFromDb.content,
        autoDelete: newDocFromDb.auto_delete,
        createdAt: new Date(newDocFromDb.created_at).getTime(),
        lastEdited: new Date(newDocFromDb.last_edited).getTime()
      };
      setDocuments(prevDocs => [formattedDoc, ...prevDocs]);
    } catch (error) {
      console.error("Error adding document:", error);
      throw error; // Re-throw to handle in the component
    }
  };
  
  const handleDeleteDocument = async (id) => {
    try {
      await deleteDocument(id);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
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
    if (loading || 
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
        return <ImageGallery 
                  images={galleryImages} 
                  isLoading={isLoadingGalleryImages}
                  onImageUpload={handleImageUpload}
                  onImageDelete={handleDeleteImage} 
                />;
      case "documents":
        return <Documents 
                  documents={documents}
                  isLoadingDocuments={isLoadingDocuments}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onToggleAutoDelete={handleToggleDocAutoDelete}
                  formatLastEdited={formatLastEdited}
                  getDocRemainingTime={getDocRemainingTime}
                />;
      default:
        return <div>Select a section</div>;
    }
  };

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

      {/* Main Content with Side Navigation */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-4xl mx-auto">
          {/* Desktop Navigation */}
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

          {/* Mobile Navigation */}
          <div className="lg:hidden flex justify-center border-b border-blue-100 dark:border-blue-900 bg-white/70 dark:bg-blue-950/80">
            <div className="flex space-x-2 p-2">
              <button onClick={() => setActiveSection("notes")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "notes" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}>Notes</button>
              <button onClick={() => setActiveSection("gallery")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "gallery" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}>Gallery</button>
              <button onClick={() => setActiveSection("documents")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "documents" ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"}`}>Docs</button>
            </div>
          </div>
        </div>

        <main className="w-full flex flex-col items-center pt-8 px-4 sm:px-6 z-10 relative">
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
