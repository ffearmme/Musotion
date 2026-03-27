import { useState, useMemo } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Search, Edit3, X, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_NOTES = [
  { id: 1, title: 'Lyric Ideas for "Neon"', content: 'Walking through the empty streets, feeling the rhythm of the night. Neon signs flashing like a heartbeat in the dark.', tag: 'Lyrics', time: '2h ago' },
  { id: 2, title: 'Studio Gear Wishlist', content: '1. Universal Audio Apollo Twin\n2. Shure SM7B\n3. KRK Rokit 5 Monitors', tag: 'Gear', time: 'Yesterday' },
  { id: 3, title: 'Marketing Strategy 2027', content: 'Focus on short-form content. 3 reels a week minimum. Engage with fans in comments. Run targeted ads for the new EP.', tag: 'Business', time: 'Oct 1' },
];

const TAGS = ['All', 'Lyrics', 'Ideas', 'Business', 'Gear'];

export default function Notes({ notes = [], dbActions }) {
  const [activeTag, setActiveTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const filteredNotes = useMemo(() => {
    return (notes || []).filter(note => {
      const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = activeTag === 'All' || note.tag === activeTag;
      return matchesSearch && matchesTag;
    });
  }, [notes, activeTag, searchQuery]);

  const handleCreateNew = () => {
    setEditingNote({ title: '', content: '', tag: 'Lyrics' });
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editingNote.title && !editingNote.content) {
      setIsEditorOpen(false);
      return;
    }

    setIsEditorOpen(false);

    try {
      if (editingNote.id) {
        await dbActions.update(editingNote.id, { 
          ...editingNote, 
          time: 'Just now' 
        });
      } else {
        await dbActions.add({ 
          ...editingNote, 
          time: 'Just now' 
        });
      }
    } catch (err) {
      console.error("Error saving note:", err);
      alert('Failed to save note.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
        setIsEditorOpen(false);
        try {
          await dbActions.delete(id);
        } catch (err) {
          console.error("Error deleting note:", err);
          alert('Failed to delete note.');
        }
    }
  };

  return (
    <PageTransition>
      <header className="page-header">
        <h1 className="page-title">Notes</h1>
        <motion.div 
          whileTap={{ scale: 0.9 }}
          onClick={handleCreateNew}
          style={{ width: '44px', height: '44px', borderRadius: '22px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--accent-glow)', cursor: 'pointer' }}
        >
          <Edit3 size={20} color="white" />
        </motion.div>
      </header>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{ position: 'absolute', left: '1rem', top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
           <Search size={18} color="var(--text-secondary)" />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lyrics, ideas, lists..." 
          style={{ 
            width: '100%', 
            padding: '1rem 1rem 1rem 3rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.05)', 
            background: 'var(--surface-color)', 
            color: 'white',
            fontFamily: 'Inter',
            fontSize: '0.95rem',
            outline: 'none'
          }} 
        />
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
        {TAGS.map((tag) => (
          <motion.div 
            key={tag} 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTag(tag)}
            style={{ 
              background: activeTag === tag ? 'var(--text-primary)' : 'var(--surface-color)', 
              color: activeTag === tag ? 'var(--bg-color)' : 'var(--text-secondary)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '20px', 
              fontSize: '0.85rem', 
              fontWeight: activeTag === tag ? '700' : '500',
              whiteSpace: 'nowrap', 
              cursor: 'pointer',
              border: activeTag === tag ? 'none' : '1px solid rgba(255,255,255,0.05)',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            {tag}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <AnimatePresence>
          {filteredNotes.map(note => (
            <motion.div 
              layout
              key={note.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card" 
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => {
                setEditingNote(note);
                setIsEditorOpen(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '700', letterSpacing: '0.05em' }}>{note.tag.toUpperCase()}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{note.time}</span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '700' }}>{note.title || 'Untitled Note'}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.8 }}>
                {note.content}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Full-screen Editor Drawer */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'var(--bg-color)', 
              zIndex: 1000, 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button 
                onClick={() => setIsEditorOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <X size={20} />
              </button>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editingNote?.id && (
                  <button 
                    onClick={() => handleDelete(editingNote.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  style={{ background: 'var(--accent-color)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px var(--accent-glow)' }}
                >
                  <Check size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                {TAGS.filter(t => t !== 'All').map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setEditingNote({...editingNote, tag})}
                    style={{ 
                      background: editingNote.tag === tag ? 'var(--accent-color)' : 'var(--surface-color)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '0.4rem 1rem', 
                      borderRadius: '15px', 
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <input 
                autoFocus
                type="text" 
                placeholder="Note Title"
                value={editingNote.title}
                onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                style={{ background: 'transparent', border: 'none', fontSize: '1.75rem', fontWeight: '800', color: 'white', outline: 'none', fontFamily: 'Outfit' }}
              />
              <textarea 
                placeholder="Start writing..."
                value={editingNote.content}
                onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', color: 'var(--text-secondary)', outline: 'none', flex: 1, resize: 'none', fontFamily: 'Inter', lineHeight: '1.6' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
