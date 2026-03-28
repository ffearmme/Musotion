import { useState, useMemo, useRef, useEffect } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Camera, Tv, Plus, X, Check, Trash2, Calendar, LayoutGrid, Search, Play, Music, ChevronLeft, ChevronRight, Disc3, CalendarDays, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '../components/LoadingScreen';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'All Platforms'];
const STAGES = ['Ideation', 'To Shoot', 'Editing', 'Scheduled', 'Posted'];

// Helper to format date consistent with HTML input date (Proper Local Date)
const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Content({ content = [], dbActions, songs = [], releases = [], isLoading }) {
  const [selectedDate, setSelectedDate] = useState(formatDateToISO(new Date()));
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMonthView, setIsMonthView] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', platform: 'Instagram', date: formatDateToISO(new Date()), stage: 'Ideation', type: 'Reel', linkedId: null, notes: ''
  });

  const dateStripRef = useRef(null);
  const isFirstMount = useRef(true);

  // Auto-scroll to selected date on mount or change
  useEffect(() => {
    const performScroll = () => {
      if (dateStripRef.current) {
        const selectedEl = dateStripRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ 
            behavior: isFirstMount.current ? 'auto' : 'smooth', 
            block: 'nearest', 
            inline: 'center' 
          });
          isFirstMount.current = false;
        }
      }
    };

    if (isFirstMount.current) {
      setTimeout(performScroll, 100);
    } else {
      performScroll();
    }
  }, [selectedDate, isLoading]); // Re-run when loading finishes to ensure elements exist

  const jumpToToday = () => {
    setSelectedDate(formatDateToISO(new Date()));
  };

  // Generate 60 days around current date for the strip (increased range for better planning)
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = -14; i < 45; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        iso: formatDateToISO(d),
        day: d.getDate(),
        weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
        month: d.toLocaleDateString(undefined, { month: 'short' }),
        isToday: formatDateToISO(d) === formatDateToISO(today)
      });
    }
    return arr;
  }, []);

  // Filter content & releases for current day
  const dayItems = useMemo(() => {
    const posts = (content || []).filter(post => post.date === selectedDate);
    const dayReleases = (releases || []).filter(rel => rel.date === selectedDate);
    return { posts, releases: dayReleases };
  }, [content, releases, selectedDate]);

  // Format date for display without UTC shifts
  const displayDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }, [selectedDate]);

  // Aggregate items for month-view dots
  const itemsByDate = useMemo(() => {
    const map = {};
    (content || []).forEach(post => {
      if (!map[post.date]) map[post.date] = [];
      map[post.date].push({ type: 'post', color: 'var(--accent-color)' });
    });
    (releases || []).forEach(rel => {
      if (!map[rel.date]) map[rel.date] = [];
      map[rel.date].push({ type: 'release', color: '#10b981' });
    });
    return map;
  }, [content, releases]);

  // Unified projects list (merge songs and releases)
  const projects = useMemo(() => {
    // 1. Get all release track IDs
    const trackIds = new Set();
    releases.forEach(rel => {
      (rel.tracks || []).forEach(t => trackIds.add(t.id));
    });

    // 2. Filter songs that are already in a release
    const unlinkedSongs = songs.filter(s => !trackIds.has(s.id));

    // 3. Combine
    return [
      ...releases.map(r => ({ ...r, isRelease: true })),
      ...unlinkedSongs.map(s => ({ ...s, isSong: true }))
    ].sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, releases]);

  const handleOpenCreate = () => {
    setFormData({ 
      title: '', 
      platform: 'Instagram', 
      date: selectedDate, 
      stage: 'Ideation', 
      type: 'Reel', 
      linkedId: null,
      notes: '' 
    });
    setSelectedPost(null);
    setIsDeleting(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post) => {
    setFormData({ 
      title: '', 
      platform: 'Instagram', 
      date: '', 
      stage: 'Ideation', 
      type: 'Reel', 
      linkedId: null, 
      notes: '',
      ...post 
    });
    setSelectedPost(post);
    setIsDeleting(false);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;
    setIsEditorOpen(false);
    try {
      if (selectedPost) {
        await dbActions.update(selectedPost.id, { ...formData });
      } else {
        await dbActions.add({ ...formData });
      }
    } catch (err) {
      console.error("Error saving content:", err);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = () => {
    setIsDeleting(true);
  };

  const confirmDelete = async (id) => {
    if (!id) return;
    
    // Immediate UI update for smooth feel
    setIsEditorOpen(false);
    setSelectedPost(null);
    setIsDeleting(false);
    
    try {
      await dbActions.remove(id);
    } catch (err) {
      console.error("Error deleting content:", err);
      alert('Failed to delete post: ' + err.message);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'Instagram': return <Camera size={18} color="#e1306c" />;
      case 'YouTube': return <Play size={18} color="#ff0000" />;
      case 'TikTok': return <Tv size={18} color="#00f2ea" />;
      case 'All Platforms': return <LayoutGrid size={18} color="var(--accent-color)" />;
      default: return <Camera size={18} color="var(--text-secondary)" />;
    }
  };

  return (
    <PageTransition>
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Plan your rollout</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={jumpToToday}
            style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
          >
            Today
          </button>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={handleOpenCreate}
            style={{ width: '44px', height: '44px', borderRadius: '22px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 8px 16px var(--accent-glow)' }}
          >
            <Plus size={22} />
          </motion.div>
        </div>
      </header>

      {isLoading ? (
        <LoadingScreen message="Visualizing your timeline..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* DATE STRIP NAVIGATION */}
          <div style={{ position: 'relative' }}>
            <div 
              ref={dateStripRef}
              style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {dates.map((d) => {
                const isSelected = d.iso === selectedDate;
                const hasItems = itemsByDate[d.iso];
                
                return (
                  <motion.div
                    key={d.iso}
                    data-selected={isSelected}
                    onClick={() => setSelectedDate(d.iso)}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      minWidth: '58px',
                      height: '76px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent-color)' : 'var(--surface-color)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      position: 'relative',
                      transition: 'background 0.2s, color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', opacity: isSelected ? 0.9 : 0.6 }}>{d.weekday}</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{d.day}</span>
                    
                    {/* Activity Dots */}
                    {hasItems && (
                      <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '2px' }}>
                        {hasItems.slice(0, 3).map((item, i) => (
                          <div key={i} style={{ width: '4px', height: '4px', borderRadius: '2px', background: isSelected ? 'white' : item.color }} />
                        ))}
                      </div>
                    )}
                    
                    {d.isToday && !isSelected && (
                      <div style={{ position: 'absolute', top: '4px', background: 'var(--accent-color)', width: '4px', height: '4px', borderRadius: '2px' }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
            {/* Soft fade edges */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, transparent, var(--bg-color))', pointerEvents: 'none' }} />
          </div>

          {/* DAY VIEW SECTION */}
          <div style={{ flex: 1 }}>
             <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <CalendarDays size={20} color="var(--accent-color)" />
               {displayDate}
             </h2>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AnimatePresence mode="popLayout">
                  {/* Releases First */}
                  {dayItems.releases.map(release => (
                    <motion.div 
                      key={release.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="card" style={{ padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Rocket size={24} color="#10b981" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Release Day</div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{release.title}</h4>
                        </div>
                        <Disc3 className="spinning" size={24} color="rgba(16, 185, 129, 0.3)" />
                      </div>
                    </motion.div>
                  ))}

                  {/* Content Posts Second */}
                  {dayItems.posts.map(post => {
                    const linkedItem = songs.find(s => s.id === post.linkedId) || releases.find(r => r.id === post.linkedId);
                    
                    return (
                      <motion.div 
                        key={post.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleOpenEdit(post)}
                        className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {getPlatformIcon(post.platform)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{post.title}</h4>
                            {post.notes && <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-glow)' }} />}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '2px' }}>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{post.platform} • {post.type || 'Reel'}</span>
                             {linkedItem && (
                               <>
                                 <span style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>•</span>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                   <Music size={10} /> {linkedItem.title}
                                 </span>
                               </>
                             )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ 
                             fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '6px', 
                             background: post.stage === 'Posted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                             color: post.stage === 'Posted' ? '#10b981' : 'var(--text-secondary)',
                             border: '1px solid rgba(255,255,255,0.05)'
                           }}>
                             {post.stage}
                           </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Empty State */}
                  {dayItems.posts.length === 0 && dayItems.releases.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}
                    >
                      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', opacity: 0.3 }}>
                        <Calendar size={48} strokeWidth={1} />
                      </div>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No content planned for this day</h3>
                      <button 
                        onClick={handleOpenCreate}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.5rem', cursor: 'pointer' }}
                      >
                        + Create a post
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      )}

      {/* STYLES FOR SPINNING ICON & SCROLLBAR HIDING */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin-slow 10s linear infinite;
        }
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* PLANNER DRAWER (Keeping sync with existing functionality) */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1000, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button onClick={() => setIsEditorOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
              <h2 style={{ fontFamily: 'Outfit', margin: 0 }}>Plan Post</h2>
              <button onClick={handleSave} style={{ background: 'var(--accent-color)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--accent-glow)' }}><Check size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>TITLE</label>
                <input 
                  autoFocus type="text" placeholder="Tour Announcement" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '1.5rem', color: 'white', outline: 'none', fontFamily: 'Outfit', fontWeight: '800' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>PLATFORM</label>
                  <select 
                    value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    style={{ background: 'var(--surface-color)', border: 'none', borderRadius: '12px', padding: '1rem', color: 'white', outline: 'none', appearance: 'none' }}
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>DATE</label>
                  <input 
                    type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                    style={{ background: 'var(--surface-color)', border: 'none', borderRadius: '12px', padding: '1rem', color: 'white', colorScheme: 'dark', outline: 'none' }}
                  />
                </div>
              </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                 <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>STAGE</label>
                 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {STAGES.map(s => (
                      <div 
                        key={s} onClick={() => setFormData({...formData, stage: s})}
                        style={{ 
                          padding: '0.5rem 1rem', borderRadius: '10px', background: formData.stage === s ? 'var(--accent-color)' : 'var(--surface-highlight)',
                          color: 'white', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        {s}
                      </div>
                    ))}
                 </div>
              </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>CREATIVE NOTES / INSTRUCTIONS</label>
                <textarea 
                  placeholder="e.g. 3-4 outfit variations, record full song..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ background: 'var(--surface-color)', border: 'none', borderRadius: '16px', padding: '1rem', color: 'white', outline: 'none', fontFamily: 'Inter', fontSize: '0.9rem', resize: 'none', minHeight: '120px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>LINK TO PROJECT</label>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {projects.map(item => (
                       <div 
                        key={item.id} onClick={() => setFormData({...formData, linkedId: formData.linkedId === item.id ? null : item.id})}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', borderRadius: '12px', 
                          background: formData.linkedId === item.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${formData.linkedId === item.id ? 'var(--accent-color)' : 'transparent'}`,
                          cursor: 'pointer'
                        }}
                       >
                          {item.isRelease ? <Disc3 size={16} color="var(--accent-color)" /> : <Music size={16} color="var(--text-secondary)" />}
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>{item.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{item.isRelease ? 'Release' : item.stage || 'Song'}</span>
                          </div>
                          {formData.linkedId === item.id && <Check size={16} color="var(--accent-color)" />}
                       </div>
                    ))}
                 </div>
              </div>

              {selectedPost && (
                <div style={{ marginTop: '2rem' }}>
                  {!isDeleting ? (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deletePost(); }}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        padding: '1.25rem', 
                        borderRadius: '20px', 
                        color: '#ef4444', 
                        fontWeight: '800', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.75rem',
                        cursor: 'pointer',
                        width: '100%',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                      }}
                    >
                      <Trash2 size={22} /> 
                      <span>Delete Content Post</span>
                    </button>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}
                    >
                      <p style={{ color: '#ef4444', fontWeight: '800', marginBottom: '1rem' }}>Are you sure? This is permanent.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button 
                          type="button" onClick={() => setIsDeleting(false)}
                          style={{ background: 'var(--surface-highlight)', border: 'none', padding: '1rem', borderRadius: '16px', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" onClick={() => confirmDelete(selectedPost.id)}
                          style={{ background: '#ef4444', border: 'none', padding: '1rem', borderRadius: '16px', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
