"use client";
import { useState, useEffect, useRef } from "react";
import { createNote } from "../../../lib/notesService";
import { useAuth } from "../../../lib/AuthContext";

export default function TextInput({ onNoteCreated }) {
  const [text, setText] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveComplete, setAutosaveComplete] = useState(false);
  const [error, setError] = useState(null);
  const autosaveTimerRef = useRef(null);
  const { supabase } = useAuth();

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
        
        // Save the text to Supabase (createNote defaults to autoDelete=true)
        createNote(text)
          .then(newNoteFromDb => { // newNoteFromDb has id, text, autoDelete, created_at, expiry_date
            // DO NOT call onSaveText here as useNotes will handle updates from DB
            // Instead, signal that a note was created so parent can reload
            if (onNoteCreated) {
              onNoteCreated();
            }
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
  }, [text, onNoteCreated]);

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
        // Save to Supabase (createNote defaults to autoDelete=true)
        const newNoteFromDb = await createNote(text); // newNoteFromDb has id, text, autoDelete, created_at, expiry_date
        
        // DO NOT call onSaveText here as useNotes will handle updates from DB
        // Instead, signal that a note was created so parent can reload
        if (onNoteCreated) {
          onNoteCreated();
        }
        
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
    <div 
      className="w-full flex flex-col bg-slate-50/90 dark:bg-blue-950/70 rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200 dark:border-blue-900"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-blue-100">Enter Your Text</h2>
        
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
        className="w-full mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl bg-white dark:bg-blue-900/40 border border-slate-300 dark:border-blue-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none resize-none text-slate-900 dark:text-blue-50 placeholder-slate-400 dark:placeholder-blue-300/70 transition-all duration-300 min-h-[100px] sm:min-h-[120px]"
      />
      <div className="flex justify-end mt-3 sm:mt-4">
        <button 
          className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold py-2 px-4 sm:px-6 rounded-xl shadow transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim() || isAutosaving}
          onClick={handleSaveText}
        >
          {isAutosaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
} 