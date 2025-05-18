"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import DarkModeToggle from "./components/DarkModeToggle";
import TextInput from "./components/TextInput";
import ImageGallery from "./components/ImageGallery";
import StoredTexts from "./components/StoredTexts";
import { useAuth } from "../../lib/AuthContext";
import { fetchDocuments, createDocument, deleteDocument, toggleDocumentAutoDelete } from "../../lib/documentService";
import { fetchNotes, createNote as saveNoteToDb, toggleNoteAutoDelete as toggleNoteAutoDeleteDb, deleteNote as deleteNoteDb } from "../../lib/notesService";

export default function Home() {
  // Auth state
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const router = useRouter();
  
  // Stored text entries with autoDelete property
  const [storedTexts, setStoredTexts] = useState([]);
  // Refs for auto-delete timers
  const autoDeleteTimersRef = useRef({});
  // Active section
  const [activeSection, setActiveSection] = useState("notes");
  // Documents with autoDelete property
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  // Refs for document auto-delete timers
  const docAutoDeleteTimersRef = useRef({});
  
  // State for loading notes
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  
  // Initial images for the gallery
  const initialImages = [
    { id: 1, url: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538", alt: "Sample image 1" },
    { id: 2, url: "https://images.unsplash.com/photo-1682687220509-61b8a906ca19", alt: "Sample image 2" },
    { id: 3, url: "https://images.unsplash.com/photo-1682687220742-aba19b51f8ad", alt: "Sample image 3" },
    { id: 4, url: "https://images.unsplash.com/photo-1682687220015-a1444e8d41a5", alt: "Sample image 4" },
    { id: 5, url: "https://images.unsplash.com/photo-1682686578707-140b042e8f19", alt: "Sample image 5" },
  ];

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
        .catch(error => {
          console.error("Error fetching initial notes:", error);
        })
        .finally(() => {
          setIsLoadingNotes(false);
        });
    } else {
      setStoredTexts([]);
    }
  }, [isAuthenticated]);

  // Manage auto-delete timers when storedTexts changes
  useEffect(() => {
    // Clear all existing auto-delete timers
    Object.values(autoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    autoDeleteTimersRef.current = {};

    // Set up new timers for each text with autoDelete enabled
    storedTexts.forEach((item, index) => {
      if (item.autoDelete) {
        // Create a timer that will delete the text after 7 seconds
        autoDeleteTimersRef.current[index] = setTimeout(() => {
          // Filter out the text at this index
          setStoredTexts(prev => prev.filter((_, i) => i !== index));
        }, 7000); // 7 seconds
      }
    });

    // Cleanup function
    return () => {
      // Clear all timers when component unmounts or storedTexts changes
      Object.values(autoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [storedTexts]);

  // Manage document auto-delete timers
  useEffect(() => {
    // Clear all existing document auto-delete timers
    Object.values(docAutoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    docAutoDeleteTimersRef.current = {};

    // Set up new timers for each document with autoDelete enabled
    documents.forEach((doc) => {
      if (doc.autoDelete) {
        // Create a timer that will delete the document after 15 seconds
        docAutoDeleteTimersRef.current[doc.id] = setTimeout(() => {
          // Filter out the document with this id
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
        }, 15000);
      }
    });

    // Cleanup function
    return () => {
      // Clear all document timers when component unmounts or documents changes
      Object.values(docAutoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [documents]);

  // Store text and clear input
  const handleSaveText = (noteFromInput) => {
    const newNote = {
      id: noteFromInput.id,
      content: noteFromInput.content,
      autoDelete: noteFromInput.autoDelete,
      createdAt: noteFromInput.createdAt
    };

    setStoredTexts(prevTexts => [newNote, ...prevTexts]);
  };

  // Toggle autoDelete for a specific text entry
  const handleToggleAutoDelete = (index) => {
    const updatedTexts = [...storedTexts];
    updatedTexts[index].autoDelete = !updatedTexts[index].autoDelete;
    setStoredTexts(updatedTexts);
    
    // Clear existing timer for this item if exists
    if (autoDeleteTimersRef.current[index]) {
      clearTimeout(autoDeleteTimersRef.current[index]);
      delete autoDeleteTimersRef.current[index];
    }
    
    // Set up new timer if autoDelete is enabled
    if (updatedTexts[index].autoDelete) {
      autoDeleteTimersRef.current[index] = setTimeout(() => {
        setStoredTexts(prev => prev.filter((_, i) => i !== index));
      }, 7000);
    }
  };

  // Toggle autoDelete for a specific document
  const handleToggleDocAutoDelete = (id) => {
    setDocuments(docs => docs.map(doc => {
      if (doc.id === id) {
        // Toggle autoDelete and update createdAt if enabling
        const updatedDoc = { 
          ...doc, 
          autoDelete: !doc.autoDelete,
          createdAt: !doc.autoDelete ? Date.now() : doc.createdAt 
        };
        
        // Clear existing timer for this document if exists
        if (docAutoDeleteTimersRef.current[id]) {
          clearTimeout(docAutoDeleteTimersRef.current[id]);
          delete docAutoDeleteTimersRef.current[id];
        }
        
        // Set up new timer if autoDelete is being enabled
        if (updatedDoc.autoDelete) {
          docAutoDeleteTimersRef.current[id] = setTimeout(() => {
            setDocuments(prev => prev.filter(d => d.id !== id));
          }, 15000);
        }
        
        return updatedDoc;
      }
      return doc;
    }));
  };
  
  // Calculate remaining time for document auto-delete
  const getDocRemainingTime = (doc) => {
    if (!doc.autoDelete || !doc.createdAt) return null;
    
    const elapsedTime = Date.now() - doc.createdAt;
    const remainingTime = Math.max(0, 15000 - elapsedTime);
    
    // Return as seconds with one decimal place
    return (remainingTime / 1000).toFixed(1);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  // Add a new document
  const handleAddDocument = async () => {
    try {
      // Create a title with timestamp to make it unique
      const title = `Document ${new Date().toLocaleTimeString()}`;
      
      // Create document in Supabase
      const newDoc = await createDocument(title);
      
      // Add to local state with proper formatting
      setDocuments(docs => [
        {
          id: newDoc.id,
          title: newDoc.title,
          lastEdited: 0, // Just created
          autoDelete: newDoc.auto_delete,
          createdAt: newDoc.auto_delete ? new Date(newDoc.created_at).getTime() : null
        },
        ...docs
      ]);
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };
  
  // Delete a document
  const handleDeleteDocument = async (id) => {
    try {
      // Delete from Supabase
      await deleteDocument(id);
      
      // Update local state
      setDocuments(docs => docs.filter(d => d.id !== id));
      
      // Clear any auto-delete timer
      if (docAutoDeleteTimersRef.current[id]) {
        clearTimeout(docAutoDeleteTimersRef.current[id]);
        delete docAutoDeleteTimersRef.current[id];
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // Render content based on active section
  const renderContent = () => {
    if (loading || isLoadingNotes) {
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
            {/* Text Input Area */}
            <TextInput onSaveText={handleSaveText} />

            {/* Stored Texts Component */}
            <StoredTexts texts={storedTexts} onToggleAutoDelete={handleToggleAutoDelete} />
          </div>
        );
      case "gallery":
        return <ImageGallery initialImages={initialImages} />;
      case "documents":
        return (
          <div className="w-full bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Documents</h2>
              <button 
                onClick={handleAddDocument}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow transition text-sm dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Document
              </button>
            </div>
            
            {isLoadingDocuments ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Documents with auto-delete toggle */}
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white/90 dark:bg-blue-900/40 rounded-xl p-4 border border-blue-100 dark:border-blue-800 hover:shadow-md transition">
                    <div className="flex items-start">
                      <div className="bg-blue-100 dark:bg-blue-800/60 p-2 rounded-lg mr-3">
                        <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-blue-800 dark:text-blue-100">{doc.title}</h3>
                          <div className="flex items-center">
                            <div className="flex flex-col items-end mr-2">
                              <label htmlFor={`auto-delete-${doc.id}`} className="text-xs text-blue-700 dark:text-blue-300">
                                Auto-delete
                              </label>
                              {doc.autoDelete && doc.createdAt && (
                                <span className="text-xs text-orange-500 dark:text-orange-300 mt-0.5">
                                  Deleting in {getDocRemainingTime(doc)}s
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleToggleDocAutoDelete(doc.id)}
                              className={`w-8 h-4 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                                doc.autoDelete 
                                  ? 'bg-green-500 dark:bg-green-600' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                              aria-pressed={doc.autoDelete}
                              aria-label={`Toggle auto-delete for ${doc.title}`}
                            >
                              <span
                                className={`bg-white dark:bg-gray-200 w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                                  doc.autoDelete ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                          {doc.lastEdited === 0 
                            ? 'Just created' 
                            : `Last edited ${doc.lastEdited} day${doc.lastEdited !== 1 ? 's' : ''} ago`
                          }
                        </p>
                        <div className="flex mt-3">
                          <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 mr-3">Open</button>
                          <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 mr-3">Share</button>
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!isLoadingDocuments && documents.length === 0 && (
              <div className="flex flex-col items-center justify-center h-60 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-200 dark:border-blue-800">
                <svg className="h-12 w-12 text-blue-300 dark:text-blue-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-blue-500 dark:text-blue-400">No documents yet</p>
                <button 
                  onClick={handleAddDocument}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow transition text-sm dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Create Your First Document
                </button>
              </div>
            )}
          </div>
        );
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
          {/* User info if authenticated */}
          {isAuthenticated && user && (
            <span className="text-sm text-blue-700 dark:text-blue-300 hidden sm:inline-block">
              {user.email}
            </span>
          )}
          
          {/* Dark mode toggle button with animation */}
          <DarkModeToggle />
          
          {/* Login/Logout button */}
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
        {/* Navigation - Visible on all screens, horizontal on large screens */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex justify-center space-x-6 py-6">
            <button 
              onClick={() => setActiveSection("notes")}
              className={`px-6 py-3 rounded-lg flex items-center font-medium transition ${
                activeSection === "notes" 
                  ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" 
                  : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"
              }`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Notes
            </button>
            
            <button 
              onClick={() => setActiveSection("gallery")}
              className={`px-6 py-3 rounded-lg flex items-center font-medium transition ${
                activeSection === "gallery" 
                  ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" 
                  : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"
              }`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Gallery
            </button>
            
            <button 
              onClick={() => setActiveSection("documents")}
              className={`px-6 py-3 rounded-lg flex items-center font-medium transition hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200 ${
                activeSection === "documents" 
                  ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" 
                  : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"
              }`}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Documents
            </button>
          </nav>

          {/* Mobile Navigation - Visible on small screens only */}
          <div className="lg:hidden flex justify-center border-b border-blue-100 dark:border-blue-900 bg-white/70 dark:bg-blue-950/80">
            <div className="flex space-x-2 p-2">
              <button 
                onClick={() => setActiveSection("notes")}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  activeSection === "notes" 
                    ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" 
                    : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"
                }`}
              >
                Notes
              </button>
              
              <button 
                onClick={() => setActiveSection("gallery")}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  activeSection === "gallery" 
                    ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" 
                    : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"
                }`}
              >
                Gallery
              </button>
              
              <button 
                onClick={() => setActiveSection("documents")}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  activeSection === "documents" 
                    ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" 
                    : "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-200"
                }`}
              >
                Docs
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full flex flex-col items-center pt-8 px-4 sm:px-6 z-10 relative">
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
