import { useState, useMemo } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Plus, Search, Music, X, Check, Trash2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = ['All', 'Writing', 'Demo', 'Mixed', 'Mastered'];

export default function Songs({ songs = [], dbActions }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [editorTab, setEditorTab] = useState('Details');
  
  const [formData, setFormData] = useState({
    title: '', stage: 'Writing', bpm: '', key: '', type: 'Demo', lyrics: ''
  });

  const filteredSongs = useMemo(() => {
    return (songs || []).filter(song => {
      const matchesTab = activeTab === 'All' || song.stage === activeTab;
      const matchesSearch = song.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [songs, activeTab, searchQuery]);

  const handleOpenCreate = () => {
    setFormData({ title: '', stage: 'Writing', bpm: '', key: '', type: 'Demo', lyrics: '' });
    setSelectedSong(null);
    setEditorTab('Details');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (song) => {
    setFormData({ ...song, lyrics: song.lyrics || '' });
    setSelectedSong(song);
    setEditorTab(song.stage === 'Writing' ? 'Lyrics' : 'Details');
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a song title');
      return;
    }
    
    setIsEditorOpen(false);
    
    try {
      if (selectedSong) {
        await dbActions.update(selectedSong.id, { 
          ...formData, 
          lastEdited: 'Just now' 
        });
      } else {
        await dbActions.add({ 
          ...formData, 
          lastEdited: 'Just now' 
        });
      }
    } catch (err) {
      console.error("Error saving song:", err);
      alert('Failed to save song: ' + err.message);
    }
  };

  const deleteSong = async (id) => {
    if (window.confirm('Are you sure you want to archive this project?')) {
        setIsEditorOpen(false);
        try {
          await dbActions.delete(id);
        } catch (err) {
          console.error("Error deleting song:", err);
          alert('Failed to archive song: ' + err.message);
        }
    }
  };

  return (
    <PageTransition>
      <header className="page-header">
        <h1 className="page-title">Songs</h1>
        <motion.div 
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenCreate}
          style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          <Plus size={20} />
        </motion.div>
      </header>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{ position: 'absolute', left: '1rem', top: 0, bottom: 0, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search your library..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
        {STAGES.map((tab) => (
          <motion.div 
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: activeTab === tab ? 'var(--text-primary)' : 'var(--surface-color)', 
              color: activeTab === tab ? 'var(--bg-color)' : 'var(--text-secondary)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '20px', 
              fontSize: '0.9rem', 
              fontWeight: '700', 
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {tab}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredSongs.map(song => (
            <motion.div 
              layout
              key={song.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => handleOpenEdit(song)}
              className="card" 
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--surface-highlight), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <Music size={20} color={song.stage === 'Mastered' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{song.title}</h4>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-color)', opacity: 0.8 }}>
                      {song.stage}
                    </span>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{song.bpm} BPM • {song.key}</span>
                  </div>
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>{song.lastEdited}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredSongs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.4 }}>
             <Music size={48} style={{ margin: '0 auto 1rem' }} />
             <p>No songs found in this category</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1000, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button onClick={() => setIsEditorOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
              <div style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '20px', padding: '0.25rem' }}>
                 {['Details', 'Lyrics'].map(tab => (
                   <button 
                    key={tab} onClick={() => setEditorTab(tab)}
                    style={{ padding: '0.4rem 1rem', borderRadius: '18px', border: 'none', background: editorTab === tab ? 'var(--accent-color)' : 'transparent', color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                   >
                     {tab}
                   </button>
                 ))}
              </div>
              <button onClick={handleSave} style={{ background: 'var(--accent-color)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--accent-glow)' }}><Check size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
               <AnimatePresence mode="wait">
                 {editorTab === 'Details' ? (
                   <motion.div 
                    key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                   >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em' }}>TRACK TITLE</label>
                        <input 
                          autoFocus type="text" placeholder="Dream Machine" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '1.8rem', color: 'white', outline: 'none', fontFamily: 'Outfit', fontWeight: '800' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em' }}>BPM</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--surface-color)', padding: '0.8rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Activity size={18} color="var(--accent-color)" />
                            <input 
                              type="number" placeholder="128" value={formData.bpm} onChange={(e) => setFormData({...formData, bpm: e.target.value})}
                              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '1.1rem', fontWeight: '700' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em' }}>KEY</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--surface-color)', padding: '0.8rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Music size={18} color="var(--accent-color)" />
                            <input 
                              type="text" placeholder="Cm" value={formData.key} onChange={(e) => setFormData({...formData, key: e.target.value})}
                              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '1.1rem', fontWeight: '700' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em' }}>CURRENT STAGE</label>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {STAGES.filter(s => s !== 'All').map(stage => (
                              <div 
                                key={stage}
                                onClick={() => setFormData({...formData, stage})}
                                style={{ 
                                  padding: '0.6rem 1.2rem', 
                                  borderRadius: '12px', 
                                  background: formData.stage === stage ? 'var(--accent-color)' : 'var(--surface-highlight)',
                                  color: 'white', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)'
                                }}
                              >
                                {stage}
                              </div>
                            ))}
                        </div>
                      </div>

                      {selectedSong && (
                        <button 
                          onClick={() => deleteSong(selectedSong.id)}
                          style={{ marginTop: '2rem', background: 'rgba(239, 68, 68, 0.05)', border: 'none', padding: '1rem', borderRadius: '16px', color: '#ef4444', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                          Archive Project
                        </button>
                      )}
                   </motion.div>
                 ) : (
                   <motion.div 
                    key="lyrics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                   >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                         <h2 style={{ fontFamily: 'Outfit', margin: 0, fontSize: '1.5rem' }}>Lyrics</h2>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-saving local copy...</span>
                      </div>
                      <textarea 
                        value={formData.lyrics}
                        onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                        placeholder="Start writing the next hit..."
                        style={{ width: '100%', flex: 1, background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', fontSize: '1.2rem', lineHeight: '1.8', outline: 'none', padding: '1.5rem', borderRadius: '24px', fontFamily: 'Inter, sans-serif', resize: 'none', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)' }}
                      />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
