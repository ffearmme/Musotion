import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';

export const useCollection = (collectionName, sortBy = 'createdAt') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), orderBy(sortBy, 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        // Convert Firestore timestamp to JS Date if it exists
        createdAt: doc.data().createdAt?.toDate() || null,
      }));
      setData(results);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, sortBy]);

  const addDocument = async (docData) => {
    try {
      await addDoc(collection(db, collectionName), {
        ...docData,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateDocument = async (id, docData) => {
    try {
      const { id: _, ...dataToUpdate } = docData;
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { data, loading, error, addDocument, updateDocument, deleteDocument };
};
