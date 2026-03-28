import { useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Calendar, Circle, Plus, Trash2, X, Check, Disc3, Music, CheckCircle2, Rocket, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '../components/LoadingScreen';
const TAGS = ['All', 'Upcoming', 'Released'];

const ROLLOUT_TEMPLATE = [
  { day: 1, title: 'Day 1: Content Creation Planning Day', notes: 'References of content. Cool/creative locations. Shoot for 60-90 min. 3-5 songs. 3-4 outfit variations.', platform: 'All Platforms' },
  { day: 2, title: 'Day 2: The Shoot', notes: 'Take speaker for playback! Sing with it. Record whole song. Film full song visualizer (landscape).', platform: 'All Platforms' },
  { day: 3, title: 'Day 3: Edit & Ecosystem', notes: 'Take TIME to edit. Check Linktree/Komi, Bio, Highlights, Pinned content. Check Spotify Bio.', platform: 'All Platforms' },
  { day: 4, title: 'Day 4: Posting and Ads', notes: 'Start posting. Don’t boost.', platform: 'All Platforms' },
  { day: 5, title: 'Day 5: Press and PR', notes: 'Use AI to research/write. Research who to send press release to and start sending.', platform: 'All Platforms' },
  { day: 6, title: 'Day 6: Data Analysis and Shoot Plan', notes: 'What worked? NEW content shoot plan based on data!', platform: 'All Platforms' },
  { day: 7, title: 'Day 7: Shoot Day 2', notes: 'Apply changes from data analysis.', platform: 'All Platforms' },
  { day: 8, title: 'Day 8: Test New Features', notes: 'Go live on TikTok? Carousel of 10-15 pics telling a story. Look after people!', platform: 'All Platforms' },
  { day: 9, title: 'Day 9: One to One', notes: 'Reach out to community directly. Talk about new release. "Not about me but we".', platform: 'All Platforms' },
  { day: 10, title: 'Day 10: Playlists', notes: 'Drive traffic through my playlist. Goal: Spotify Radio.', platform: 'All Platforms' },
  { day: 11, title: 'Day 11: Radio', notes: 'Find DJs looking for new artists. Use AI to find and reach out.', platform: 'All Platforms' },
  { day: 12, title: 'Day 12: Content Day 3', notes: 'Do what is working. More landscape/long form.', platform: 'All Platforms' },
  { day: 13, title: 'Day 13: Preparation Day', notes: 'Find best content. Upload long form to YT. Set alarm early!', platform: 'All Platforms' },
  { day: 14, title: 'Day 14: RELEASE DAY (G-Day)', notes: 'Check everything. Post early on Reels. Over post stories! Go live. "New song TODAY".', platform: 'All Platforms' },
  { day: 15, title: 'Day 15: Don’t Stop', notes: 'Go live again. Keep posting reels.', platform: 'All Platforms' },
  { day: 16, title: 'Day 16-20: Refine the Machine', notes: 'Building the machine, not just a single. Figure out the flow. KEEP looking after people!', platform: 'All Platforms' }
];

export default function Releases({ releases = [], songs = [], content = [], dbActions, isLoading, contentActions }) {
  const [activeTab, setActiveTab] = useState('All');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isManageTracksOpen, setIsManageTracksOpen] = useState(false);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [isCreatorSongPickerOpen, setIsCreatorSongPickerOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [editorData, setEditorData] = useState({ title: '', date: '', status: 'upcoming', tasks: [] });
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showRolloutConfirm, setShowRolloutConfirm] = useState(false);
  const [releaseToDeleteId, setReleaseToDeleteId] = useState(null);

  const applyRolloutTemplate = () => {
    if (!editorData.date) {
      alert("Please set a release date first.");
      return;
    }
    setShowRolloutConfirm(true);
  };

  const confirmAndGenerateRollout = async () => {
    setIsGeneratingPlan(true);
    setShowRolloutConfirm(false);
    try {
      const gDay = new Date(editorData.date);
      
      for (const item of ROLLOUT_TEMPLATE) {
        const targetDate = new Date(gDay);
        targetDate.setDate(gDay.getDate() - (14 - item.day));
        const isoDate = targetDate.toISOString().split('T')[0];

        await contentActions.add({
          title: item.title,
          notes: item.notes,
          platform: item.platform,
          date: isoDate,
          stage: 'Ideation',
          type: 'Rollout',
          linkedId: selectedRelease?.id || null
        });
      }
      setIsDetailsDrawerOpen(false);
    } catch (err) {
      console.error("Error applying rollout template:", err);
      alert("Failed to generate rollout plan: " + err.message);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

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

  const handleCreateFromSong = (song) => {
    setEditorData({ 
      title: song.title, 
      date: new Date().toISOString().split('T')[0], 
      status: 'upcoming',
      tracks: [{ id: song.id, title: song.title, duration: '--' }],
      tasks: [
        { id: `t${Date.now()}1`, text: 'Mixes', completed: false },
        { id: `t${Date.now()}2`, text: 'Cover Art', completed: false },
        { id: `t${Date.now()}3`, text: 'Distribution', completed: false }
      ]
    });
    setIsEditingExisting(false);
    setIsCreatorSongPickerOpen(false);
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
          tracks: editorData.tracks || []
        });
      }
    } catch (err) {
      console.error("Error saving release details:", err);
      alert('Failed to save release. Please check your connection.');
    }
  };

  const deleteRelease = async () => {
    const id = releaseToDeleteId;
    if (!id) return;

    try {
      // Find and delete linked content posts (Cascading Deletion)
      const linkedPosts = content.filter(p => p.linkedId === id);
      for (const post of linkedPosts) {
        await contentActions.remove(post.id);
      }

      await dbActions.delete(id);
      setReleaseToDeleteId(null);
    } catch (err) {
      console.error("Error deleting release:", err);
      alert('Failed to delete release.');
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCreatorSongPickerOpen(true)}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Music size={20} />
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={handleOpenCreate}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px var(--accent-glow)' }}
          >
            <Plus size={20} />
          </motion.div>
        </div>
      </header>

      {isLoading ? (
        <LoadingScreen message="Loading your release schedule..." />
      ) : (
        <>
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

                {releaseToDeleteId === release.id ? (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                     style={{ display: 'flex', gap: '0.5rem', flex: 1, marginTop: '1.25rem' }}
                   >
                     <button 
                       onClick={() => setReleaseToDeleteId(null)}
                       style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.75rem', borderRadius: '12px', color: 'white', fontWeight: '700' }}
                     >
                       No, Cancel
                     </button>
                     <button 
                       onClick={deleteRelease}
                       style={{ flex: 1, background: '#ef4444', border: 'none', padding: '0.75rem', borderRadius: '12px', color: 'white', fontWeight: '800', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
                     >
                       Yes, Delete All
                     </button>
                   </motion.div>
                 ) : (
                   <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button 
                      onClick={() => { setSelectedRelease(release); setIsManageTracksOpen(true); }}
                      style={{ flex: 1, background: 'var(--surface-highlight)', border: 'none', padding: '0.7rem', borderRadius: '12px', color: 'white', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                      <Disc3 size={16} /> Manage Tracks
                    </button>
                    <button 
                      onClick={() => setReleaseToDeleteId(release.id)}
                      style={{ width: '48px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                 )}
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

              {isEditingExisting && (
                <div style={{ marginTop: '0.5rem' }}>
                  {!showRolloutConfirm ? (
                    <button 
                      onClick={applyRolloutTemplate}
                      disabled={isGeneratingPlan}
                      style={{ 
                        background: 'rgba(139, 92, 246, 0.1)', 
                        border: '1px solid rgba(139, 92, 246, 0.2)', 
                        padding: '1rem', 
                        borderRadius: '16px', 
                        color: 'var(--accent-color)', 
                        fontWeight: '800', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.75rem',
                        cursor: isGeneratingPlan ? 'not-allowed' : 'pointer',
                        opacity: isGeneratingPlan ? 0.6 : 1,
                        fontFamily: 'Outfit',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    >
                      <Rocket size={20} />
                      <span>{isGeneratingPlan ? 'Generating Plan...' : 'Apply 14-Day Rollout Plan'}</span>
                    </button>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.3)', textAlign: 'center' }}
                    >
                      <p style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Auto-generate 16 content posts based on your release date?
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button 
                          onClick={() => setShowRolloutConfirm(false)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.75rem', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={confirmAndGenerateRollout}
                          style={{ background: 'var(--accent-color)', border: 'none', padding: '0.75rem', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px var(--accent-glow)' }}
                        >
                          Yes, Do It
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

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
      {/* GLOBAL SONG PICKER (To Create a new release from a song) */}
      <AnimatePresence>
        {isCreatorSongPickerOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1200, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <button 
                onClick={() => setIsCreatorSongPickerOpen(false)} 
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <X size={24}/>
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit' }}>Turn Song to Release</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select a song to start a new campaign</p>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {songs.map(song => (
                <motion.div 
                  key={song.id} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCreateFromSong(song)} 
                  className="card"
                  style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>{song.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{song.stage}</p>
                  </div>
                  <ChevronRight size={20} color="var(--text-secondary)" />
                </motion.div>
              ))}
              {songs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.4 }}>
                  <Music size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>No songs found in your library.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
      )}
    </PageTransition>
  );
}
