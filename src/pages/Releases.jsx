import { useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Calendar, Circle, Plus, Trash2, X, Check, Disc3, Music, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TAGS = ['All', 'Upcoming', 'Released'];

export default function Releases({ releases = [], songs = [], dbActions }) {
  const [activeTab, setActiveTab] = useState('All');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isManageTracksOpen, setIsManageTracksOpen] = useState(false);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [editorData, setEditorData] = useState({ title: '', date: '', status: 'upcoming', tasks: [] });
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const calculateReleaseStatus = (dateString) => {
    if (!dateString) return { label: 'Planning', status: 'planning', days: 0 };
    const releaseDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    releaseDate.setHours(0, 0, 0, 0);

    const diffTime = releaseDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Released', status: 'released', days: 0 };
    if (diffDays === 0) return { label: 'Out Today', status: 'upcoming', days: 0 };
    return { label: `${diffDays} Days Left`, status: 'upcoming', days: diffDays };
  };

  const toggleTask = async (releaseId, taskId) => {
    const release = releases.find(r => r.id === releaseId);
    if (!release) return;

    const updatedTasks = release.tasks.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, completed: !task.completed };
    });

    try {
      await dbActions.update(releaseId, { tasks: updatedTasks });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const addEditorTask = () => {
    const newTask = { id: `t${Date.now()}`, text: 'New Task', completed: false };
    setEditorData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const removeEditorTask = (id) => {
    setEditorData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const updateEditorTaskText = (id, newText) => {
    setEditorData(prev => ({ 
      ...prev, 
      tasks: prev.tasks.map(t => t.id === id ? { ...t, text: newText } : t) 
    }));
  };

  const addSongToRelease = async (releaseId, song) => {
    const release = releases.find(r => r.id === releaseId);
    if (!release) return;

    const alreadyAdded = release.tracks?.some(t => t.id === song.id);
    if (alreadyAdded) return;

    const updatedTracks = [...(release.tracks || []), { id: song.id, title: song.title, duration: '--' }];
    
    try {
      if (selectedRelease?.id === releaseId) {
        setSelectedRelease({ ...release, tracks: updatedTracks });
      }
      await dbActions.update(releaseId, { tracks: updatedTracks });
      setIsSongPickerOpen(false);
    } catch (err) {
      console.error("Error adding song to release:", err);
    }
  };

  const removeTrack = async (releaseId, trackId) => {
    const release = releases.find(r => r.id === releaseId);
    if (!release) return;

    const updatedTracks = (release.tracks || []).filter(t => t.id !== trackId);
    
    try {
      if (selectedRelease?.id === releaseId) {
        setSelectedRelease({ ...release, tracks: updatedTracks });
      }
      await dbActions.update(releaseId, { tracks: updatedTracks });
    } catch (err) {
      console.error("Error removing track:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditorData({ 
      title: '', 
      date: new Date().toISOString().split('T')[0], 
      status: 'upcoming',
      tasks: [
        { id: `t${Date.now()}1`, text: 'Mixes', completed: false },
        { id: `t${Date.now()}2`, text: 'Cover Art', completed: false },
        { id: `t${Date.now()}3`, text: 'Distribution', completed: false }
      ]
    });
    setIsEditingExisting(false);
    setIsDetailsDrawerOpen(true);
  };

  const handleOpenEdit = (release) => {
    setEditorData({ ...release });
    setSelectedRelease(release);
    setIsEditingExisting(true);
    setIsDetailsDrawerOpen(true);
  };

  const handleSaveDetails = async () => {
    if (!editorData.title) {
        alert('Please enter a release title');
        return;
    }

    const d = new Date(editorData.date || Date.now());
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const { status, label, days } = calculateReleaseStatus(editorData.date);

    const updatedFields = {
      ...editorData,
      title: editorData.title || 'Untitled Release',
      date: editorData.date || '2026-12-01',
      month: months[d.getUTCMonth()],
      day: d.getUTCDate().toString().padStart(2, '0'),
      status,
      statusLabel: label,
      days
    };

    setIsDetailsDrawerOpen(false);
    try {
      if (isEditingExisting && selectedRelease) {
        await dbActions.update(selectedRelease.id, updatedFields);
      } else {
        await dbActions.add({
          ...updatedFields,
          tracks: []
        });
      }
    } catch (err) {
      console.error("Error saving release details:", err);
      alert('Failed to save release. Please check your connection.');
    }
  };

  const deleteRelease = async (id) => {
    if (window.confirm('Are you sure you want to delete this release?')) {
        try {
            await dbActions.delete(id);
        } catch (err) {
            console.error("Error deleting release:", err);
            alert('Failed to delete release.');
        }
    }
  };

  const filteredReleases = (releases || []).filter(r => {
    const { status: currentStatus } = calculateReleaseStatus(r.date);
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return currentStatus === 'upcoming';
    if (activeTab === 'Released') return currentStatus === 'released';
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <PageTransition>
      <header className="page-header">
        <h1 className="page-title">Releases</h1>
        <motion.div 
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenCreate}
          style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          <Plus size={20} />
        </motion.div>
      </header>

      <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
        {TAGS.map((tab) => (
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
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {tab}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredReleases.map(release => {
            const { label, status: releaseStatus } = calculateReleaseStatus(release.date);
            return (
              <motion.div 
                layout key={release.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="card" style={{ padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div onClick={() => handleOpenEdit(release)} style={{ cursor: 'pointer' }}>
                    <span style={{ 
                      fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', 
                      color: releaseStatus === 'upcoming' ? '#10b981' : 'var(--text-secondary)',
                      background: releaseStatus === 'upcoming' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 8px', borderRadius: '4px'
                    }}>
                      {label}
                    </span>
                    <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.3rem', fontWeight: '800' }}>{release.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                       <Calendar size={14} />
                       <span>{new Date(release.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div style={{ width: '56px', height: '64px', background: 'var(--surface-highlight)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700' }}>{release.month}</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1.1 }}>{release.day}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Launch Checklist</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '700' }}>
                      {release.tasks.filter(t => t.completed).length}/{release.tasks.length}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                    <motion.div 
                      animate={{ width: `${(release.tasks.filter(t => t.completed).length / release.tasks.length) * 100}%` }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: '2px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {release.tasks.map(task => (
                      <div key={task.id} onClick={() => toggleTask(release.id, task.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <div style={{ color: task.completed ? '#10b981' : 'var(--text-secondary)' }}>
                           {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button 
                    onClick={() => { setSelectedRelease(release); setIsManageTracksOpen(true); }}
                    style={{ flex: 1, background: 'var(--surface-highlight)', border: 'none', padding: '0.7rem', borderRadius: '12px', color: 'white', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  >
                    <Disc3 size={16} /> Manage Tracks
                  </button>
                  <button 
                    onClick={() => deleteRelease(release.id)}
                    style={{ width: '48px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* DETAILS DRAWER */}
      <AnimatePresence>
        {isDetailsDrawerOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1000, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <button onClick={() => setIsDetailsDrawerOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
              <h2 style={{ fontFamily: 'Outfit', margin: 0 }}>{isEditingExisting ? 'Edit Release' : 'Create Release'}</h2>
              <button onClick={handleSaveDetails} style={{ background: 'var(--accent-color)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--accent-glow)' }}><Check size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TITLE</label>
                <input 
                  type="text" value={editorData.title} onChange={(e) => setEditorData({...editorData, title: e.target.value})}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '1.5rem', color: 'white', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>RELEASE DATE</label>
                <input 
                   type="date" value={editorData.date} onChange={(e) => setEditorData({...editorData, date: e.target.value})}
                   style={{ background: 'var(--surface-color)', border: 'none', borderRadius: '12px', padding: '1rem', color: 'white', colorScheme: 'dark', outline: 'none' }}
                />
              </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>LAUNCH CHECKLIST</label>
                  <button onClick={addEditorTask} style={{ background: 'var(--surface-highlight)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', color: 'white', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>+ Add Item</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editorData.tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
                      <input 
                        type="text" value={task.text} onChange={(e) => updateEditorTaskText(task.id, e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                      />
                      <button onClick={() => removeEditorTask(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANAGE TRACKS DRAWER */}
      <AnimatePresence>
        {isManageTracksOpen && selectedRelease && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1000, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button onClick={() => setIsManageTracksOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'Outfit' }}>Manage Tracks</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedRelease.title}</p>
              </div>
              <button onClick={() => setIsManageTracksOpen(false)} style={{ background: 'var(--accent-color)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={20}/></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>TRACK LIST ({selectedRelease.tracks.length})</p>
                 <button onClick={() => setIsSongPickerOpen(true)} style={{ background: 'var(--accent-color)', border: 'none', padding: '0.4rem 1rem', borderRadius: '20px', color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>+ Add Song</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedRelease.tracks.map((track, idx) => (
                  <div key={track.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', fontWeight: '800', fontSize: '0.75rem' }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{track.title}</h4>
                    </div>
                    <button onClick={() => removeTrack(selectedRelease.id, track.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* NESTED SONG PICKER */}
            <AnimatePresence>
              {isSongPickerOpen && (
                <motion.div 
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1100, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setIsSongPickerOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={24}/></button>
                    <h3 style={{ margin: 0, fontFamily: 'Outfit' }}>Library</h3>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {songs.map(song => {
                      const isAdded = selectedRelease.tracks.some(t => t.id === song.id);
                      return (
                        <div key={song.id} onClick={() => !isAdded && addSongToRelease(selectedRelease.id, song)} style={{ padding: '1rem', borderRadius: '16px', background: 'var(--surface-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isAdded ? 0.4 : 1, cursor: 'pointer' }}>
                          <div>
                             <h4 style={{ margin: 0 }}>{song.title}</h4>
                             <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{song.stage}</p>
                          </div>
                          {isAdded ? <Check size={18} color="var(--accent-color)"/> : <Plus size={18} />}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
