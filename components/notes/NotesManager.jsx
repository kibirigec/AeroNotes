/**
 * Notes Manager Component
 * Demonstrates frontend integration with the new API architecture
 */

import React, { useState, useEffect } from 'react';
import { useNotes } from '../../lib/hooks/useApi.js';

const NotesManager = () => {
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [autoDelete, setAutoDelete] = useState(true);
  const [expiryHours, setExpiryHours] = useState(1);

  const {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    loading,
    error,
    clearError,
  } = useNotes();

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const result = await getNotes();
      setNotes(result.notes);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      await createNote(newNoteText, { autoDelete, expiryHours });
      setNewNoteText('');
      await loadNotes(); // Refresh notes list
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleUpdateNote = async (noteId, text) => {
    try {
      await updateNote(noteId, { text });
      setEditingNote(null);
      await loadNotes(); // Refresh notes list
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(noteId);
      await loadNotes(); // Refresh notes list
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleToggleAutoDelete = async (noteId, currentAutoDelete) => {
    try {
      await updateNote(noteId, { autoDelete: !currentAutoDelete });
      await loadNotes(); // Refresh notes list
    } catch (err) {
      console.error('Failed to toggle auto-delete:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiryDate) => {
    return expiryDate && new Date(expiryDate) < new Date();
  };

  return (
    <div className="notes-manager">
      <div className="notes-header">
        <h2>My Notes</h2>
        <button onClick={loadNotes} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* Create Note Form */}
      <form onSubmit={handleCreateNote} className="create-note-form">
        <div className="form-group">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write your note here..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-options">
          <label>
            <input
              type="checkbox"
              checked={autoDelete}
              onChange={(e) => setAutoDelete(e.target.checked)}
            />
            Auto-delete
          </label>

          {autoDelete && (
            <div className="expiry-options">
              <label>
                Expires in:
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={168}>1 week</option>
                </select>
              </label>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || !newNoteText.trim()}>
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </form>

      {/* Notes List */}
      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="no-notes">No notes found. Create your first note above!</p>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className={`note-item ${isExpired(note.expiryDate) ? 'expired' : ''}`}
            >
              <div className="note-content">
                {editingNote === note.id ? (
                  <EditNoteForm
                    note={note}
                    onSave={(text) => handleUpdateNote(note.id, text)}
                    onCancel={() => setEditingNote(null)}
                    loading={loading}
                  />
                ) : (
                  <>
                    <p className="note-text">{note.text}</p>
                    <div className="note-metadata">
                      <span className="created-at">
                        Created: {formatDate(note.createdAt)}
                      </span>
                      {note.autoDelete && (
                        <span className="expiry-date">
                          {isExpired(note.expiryDate) ? (
                            <span className="expired">Expired</span>
                          ) : (
                            `Expires: ${formatDate(note.expiryDate)}`
                          )}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="note-actions">
                {editingNote !== note.id && (
                  <>
                    <button
                      onClick={() => setEditingNote(note.id)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAutoDelete(note.id, note.autoDelete)}
                      disabled={loading}
                      className={note.autoDelete ? 'auto-delete-on' : 'auto-delete-off'}
                    >
                      {note.autoDelete ? 'Disable Auto-Delete' : 'Enable Auto-Delete'}
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={loading}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Edit Note Form Component
const EditNoteForm = ({ note, onSave, onCancel, loading }) => {
  const [text, setText] = useState(note.text);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-note-form">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={loading}
      />
      <div className="edit-actions">
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default NotesManager; 