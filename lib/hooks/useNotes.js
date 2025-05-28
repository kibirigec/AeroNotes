import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotes as fetchNotesService,
  createNote as saveNoteToDbService,
  toggleNoteAutoDelete as toggleNoteAutoDeleteDbService,
  deleteNote as deleteNoteDbService,
} from '../notesService'; // Adjust path as needed

export function useNotes(enabled = true) {
  const [storedTexts, setStoredTexts] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(enabled);

  const loadNotes = useCallback(async () => {
    if (!enabled) {
      setStoredTexts([]);
      setIsLoadingNotes(false);
      return;
    }
    setIsLoadingNotes(true);
    try {
      const notesData = await fetchNotesService();
      setStoredTexts(notesData.map(n => ({
        id: n.id,
        user_id: n.user_id,
        text: n.text,
        autoDelete: n.autoDelete,
        created_at: n.created_at,
        createdAt: new Date(n.created_at).getTime(),
        expiry_date: n.expiry_date,
      })));
    } catch (error) {
      console.error("Error fetching notes in useNotes:", error);
      setStoredTexts([]); // Set to empty on error
    } finally {
      setIsLoadingNotes(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      loadNotes();
    } else {
      setStoredTexts([]);
      setIsLoadingNotes(false);
    }
  }, [loadNotes, enabled]);

  const handleSaveText = useCallback(async (text) => {
    if (!enabled) {
      console.warn("useNotes: Attempted to save note while disabled.");
      return;
    }
    try {
      // The service function createNote already defaults autoDelete to true and sets expiry
      const newNoteFromDb = await saveNoteToDbService(text);
      const newNoteForState = {
        id: newNoteFromDb.id,
        user_id: newNoteFromDb.user_id,
        text: newNoteFromDb.text,
        autoDelete: newNoteFromDb.autoDelete,
        created_at: newNoteFromDb.created_at,
        createdAt: new Date(newNoteFromDb.created_at).getTime(),
        expiry_date: newNoteFromDb.expiry_date,
      };
      setStoredTexts(prevTexts => [newNoteForState, ...prevTexts]);
      return newNoteForState; // Return the new note for any immediate UI updates if needed
    } catch (error) {
      console.error("Error saving note in useNotes:", error);
      throw error; // Re-throw for the component to handle if necessary
    }
  }, [enabled]);

  const handleToggleAutoDelete = useCallback(async (noteId) => {
    if (!enabled) {
      console.warn("useNotes: Attempted to toggle auto-delete while disabled.");
      return;
    }
    const noteIndex = storedTexts.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    const originalNote = storedTexts[noteIndex];
    const newAutoDeleteState = !originalNote.autoDelete;

    // Optimistic update
    const optimisticNote = {
      ...originalNote,
      autoDelete: newAutoDeleteState,
      expiry_date: newAutoDeleteState ? originalNote.expiry_date : null, // Keep existing if turning on, null if off
    };
    setStoredTexts(prev => prev.map(n => (n.id === noteId ? optimisticNote : n)));

    try {
      const updatedNoteFromDb = await toggleNoteAutoDeleteDbService(noteId, newAutoDeleteState);
      const formattedNoteForState = {
        id: updatedNoteFromDb.id,
        user_id: updatedNoteFromDb.user_id,
        text: updatedNoteFromDb.text,
        autoDelete: updatedNoteFromDb.autoDelete,
        created_at: updatedNoteFromDb.created_at,
        createdAt: new Date(updatedNoteFromDb.created_at).getTime(),
        expiry_date: updatedNoteFromDb.expiry_date,
      };
      setStoredTexts(prev => prev.map(n => (n.id === noteId ? formattedNoteForState : n)));
    } catch (error) {
      console.error("Error toggling note auto-delete in useNotes:", error);
      setStoredTexts(prev => prev.map(n => (n.id === noteId ? originalNote : n))); // Revert
    }
  }, [enabled, storedTexts]);

  const handleDeleteNote = useCallback(async (noteId) => {
    if (!enabled) {
      console.warn("useNotes: Attempted to delete note while disabled.");
      return;
    }
    
    // Store original state for potential rollback
    const originalTexts = [...storedTexts];
    
    try {
      // Delete from database first
      await deleteNoteDbService(noteId);
      
      // Then update local state (optimistic update after database success)
      setStoredTexts(prevTexts => prevTexts.filter(note => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note in useNotes:", error);
      // Keep original state if database deletion failed
      setStoredTexts(originalTexts);
      throw error;
    }
  }, [enabled, storedTexts]);

  return {
    storedTexts,
    isLoadingNotes,
    saveNoteHandler: handleSaveText,
    toggleNoteAutoDeleteHandler: handleToggleAutoDelete,
    deleteNoteHandler: handleDeleteNote,
    reloadNotes: loadNotes
  };
} 