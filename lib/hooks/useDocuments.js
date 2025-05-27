import { useState, useEffect, useCallback } from 'react';
import {
  fetchDocuments as fetchDocumentsService,
  createDocument as createDocumentService,
  deleteDocument as deleteDocumentService,
  toggleDocumentAutoDelete as toggleDocumentAutoDeleteService,
} from '../documentService'; // Adjust path as needed

export function useDocuments(enabled = true) {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(enabled);

  const loadDocuments = useCallback(async () => {
    if (!enabled) {
      setDocuments([]);
      setIsLoadingDocuments(false);
      return;
    }
    setIsLoadingDocuments(true);
    try {
      const docsData = await fetchDocumentsService();
      setDocuments(docsData || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching documents in useDocuments:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      loadDocuments();
    } else {
      setDocuments([]);
      setIsLoadingDocuments(false);
    }
  }, [loadDocuments, enabled]);

  const handleAddDocument = useCallback(async (formData) => {
    if (!enabled) {
      console.warn("useDocuments: Attempted to add document while disabled.");
      return;
    }
    try {
      const newDocFromDb = await createDocumentService(formData);
      setDocuments(prevDocs => [newDocFromDb, ...prevDocs]);
      return newDocFromDb;
    } catch (error) {
      console.error("Error adding document in useDocuments:", error);
      throw error;
    }
  }, [enabled]);

  const handleDeleteDocument = useCallback(async (id) => {
    if (!enabled) {
      console.warn("useDocuments: Attempted to delete document while disabled.");
      return;
    }
    const originalDocuments = [...documents];
    setDocuments(docs => docs.filter(d => d.id !== id)); // Optimistic update
    try {
      await deleteDocumentService(id);
    } catch (error) {
      console.error("Error deleting document in useDocuments:", error);
      setDocuments(originalDocuments); // Revert on error
      // Potentially re-throw or notify user
    }
  }, [enabled, documents]);

  const handleToggleDocAutoDelete = useCallback(async (docId, newAutoDeleteState, expiryDays) => {
    if (!enabled) {
      console.warn("useDocuments: Attempted to toggle auto-delete while disabled.");
      return;
    }
    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return;
    const originalDoc = documents[docIndex];

    let optimisticExpiryDate = originalDoc.expiry_date;
    if (newAutoDeleteState && expiryDays) {
      const newExpiry = new Date();
      // Handle different expiry day inputs (e.g., 0.0001 for 10 seconds, 7 for 7 days)
      if (expiryDays < 1) { // Assuming values like 0.0001 for seconds, 0.001 for minutes
        newExpiry.setSeconds(newExpiry.getSeconds() + expiryDays * 24 * 60 * 60);
      } else {
        newExpiry.setDate(newExpiry.getDate() + expiryDays);
      }
      optimisticExpiryDate = newExpiry.toISOString();
    } else if (!newAutoDeleteState) {
      optimisticExpiryDate = null;
    }

    const optimisticDoc = {
      ...originalDoc,
      auto_delete: newAutoDeleteState,
      expiry_date: optimisticExpiryDate,
    };
    setDocuments(prevDocs => prevDocs.map(d => (d.id === docId ? optimisticDoc : d)));

    try {
      const updatedDocFromDb = await toggleDocumentAutoDeleteService(docId, newAutoDeleteState, expiryDays);
      setDocuments(prevDocs => prevDocs.map(d => (d.id === docId ? updatedDocFromDb : d)));
    } catch (error) {
      console.error("Error toggling document auto-delete in useDocuments:", error);
      setDocuments(prevDocs => prevDocs.map(d => (d.id === docId ? originalDoc : d))); // Revert
    }
  }, [enabled, documents]);

  return {
    documents,
    isLoadingDocuments,
    addDocumentHandler: handleAddDocument,
    deleteDocumentHandler: handleDeleteDocument,
    toggleDocAutoDeleteHandler: handleToggleDocAutoDelete,
    reloadDocuments: loadDocuments,
  };
} 