"use client";
import { useState, useEffect, useRef } from "react";
import { createNote } from "../../../lib/notesService";

export default function TextInput({ onSaveText }) {
  const [text, setText] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveComplete, setAutosaveComplete] = useState(false);
  const [error, setError] = useState(null);
  const autosaveTimerRef = useRef(null);

  // Setup autosave timer when text changes
  useEffect(() => {
    if (text.trim()) {
      // Clear any existing timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      
      // Set autosave timer for 5 seconds
      autosaveTimerRef.current = setTimeout(() => {
        setIsAutosaving(true);
        
        // Save the text to Supabase
        createNote(text)
          .then(newNote => {
            // Transform the note object to handle different column names
            const transformedNote = {
              ...newNote,
              // Handle both possible column names
              autoDelete: newNote.autoDelete !== undefined ? newNote.autoDelete : newNote.auto_delete,
              createdAt: newNote.createdAt || new Date(newNote.created_at).getTime(),
            };
            
            // Add the new note to the local state via callback
            onSaveText(transformedNote);
            setText("");
            setIsAutosaving(false);
            setAutosaveComplete(true);
            
            // Reset autosave complete status after 2 seconds
            setTimeout(() => {
              setAutosaveComplete(false);
            }, 2000);
          })
          .catch(err => {
            console.error("Error saving note:", err);
            setError("Failed to save note. Please try again.");
            setIsAutosaving(false);
          });
      }, 5000);
    }
    
    // Cleanup timer on unmount or text change
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [text, onSaveText]);

  // Handle key press in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSaveText();
    }
  };

  // Handle saving text
  const handleSaveText = async () => {
    if (text.trim()) {
      setError(null);
      setIsAutosaving(true);
      
      try {
        // Save to Supabase
        const newNote = await createNote(text);
        
        // Transform the note object to handle different column names
        const transformedNote = {
          ...newNote,
          // Handle both possible column names
          autoDelete: newNote.autoDelete !== undefined ? newNote.autoDelete : newNote.auto_delete,
          createdAt: newNote.createdAt || new Date(newNote.created_at).getTime(),
        };
        
        // Add to local state via callback
        onSaveText(transformedNote);
        setText("");
        setIsAutosaving(false);
        setAutosaveComplete(true);
        
        // Reset autosave complete status after 2 seconds
        setTimeout(() => {
          setAutosaveComplete(false);
        }, 2000);
      } catch (err) {
        console.error("Error saving note:", err);
        setError("Failed to save note. Please try again.");
        setIsAutosaving(false);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Enter Your Text</h2>
        
        {/* Autosave indicator */}
        <div className="flex items-center">
          {isAutosaving && (
            <div className="flex items-center text-blue-500 dark:text-blue-300 text-sm animate-pulse">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          )}
          {autosaveComplete && (
            <div className="flex items-center text-green-500 dark:text-green-300 text-sm">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Saved
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 mb-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Text to paste (press Enter to submit)"
        className="w-full flex-1 mt-4 p-4 rounded-xl bg-white/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none text-blue-900 dark:text-blue-50 placeholder-blue-400 dark:placeholder-blue-300/70 transition-all duration-300 min-h-[100px]"
      />
      <div className="flex justify-end mt-4">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl shadow transition text-md dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim() || isAutosaving}
          onClick={handleSaveText}
        >
          {isAutosaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
} 