import { useState, useMemo } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Camera, Tv, Plus, X, Check, Trash2, Calendar, LayoutGrid, Search, Play, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '../components/LoadingScreen';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter'];
const STAGES = ['Ideation', 'To Shoot', 'Editing', 'Scheduled', 'Posted'];

export default function Content({ content = [], dbActions, songs = [], releases = [], isLoading }) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    title: '', platform: 'Instagram', date: '', stage: 'Ideation', type: 'Reel', linkedId: null
  });

  const filteredContent = useMemo(() => {
    return (content || []).filter(post => {
      const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === 'All' || post.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [content, searchQuery, platformFilter]);

  const handleOpenCreate = () => {
    setFormData({ title: '', platform: 'Instagram', date: new Date().toISOString().split('T')[0], stage: 'Ideation', type: 'Reel', linkedId: null });
    setSelectedPost(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post) => {
    setFormData({ ...post });
    setSelectedPost(post);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a content title');
      return;
    }
    
    setIsEditorOpen(false);
    
    try {
      if (selectedPost) {
        await dbActions.update(selectedPost.id, { ...formData });
      } else {
        await dbActions.add({ ...formData });
      }
    } catch (err) {
      console.error("Error saving content:", err);
      alert('Failed to save content. Please check your connection.');
    }
  };

  const deletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
        setIsEditorOpen(false);
        try {
          await dbActions.delete(id);
        } catch (err) {
          console.error("Error deleting content:", err);
          alert('Failed to delete content.');
        }
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'Instagram': return <Camera size={18} color="#e1306c" />;
      case 'YouTube': return <Play size={18} color="#ff0000" />;
      case 'TikTok': return <Tv size={18} color="#00f2ea" />;
      default: return <Camera size={18} color="var(--text-secondary)" />;
    }
  };

  return (
    <PageTransition>
      <header className="page-header">
        <h1 className="page-title">Content</h1>
        <motion.div 
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenCreate}
          style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          <Plus size={20} />
        </motion.div>
      </header>

      {isLoading ? (
        <LoadingScreen message="Syncing your content planner..." />
      ) : (
        <>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(255, 255, 255, 0.02))' }}>
           <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planned</h3>
           <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: '800' }}>{content.length}</p>
        </div>
        <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(255, 255, 255, 0.02))' }}>
           <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posted</h3>
           <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: '800' }}>{content.filter(c => c.stage === 'Posted').length}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
        {['All', ...PLATFORMS].map(p => (
           <motion.div 
             key={p} onClick={() => setPlatformFilter(p)}
             whileTap={{ scale: 0.95 }}
             style={{ 
               padding: '0.5rem 1.2rem', borderRadius: '20px', background: platformFilter === p ? 'var(--text-primary)' : 'var(--surface-color)', 
               color: platformFilter === p ? 'var(--bg-color)' : 'var(--text-secondary)', 
               fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)'
             }}
           >
             {p}
           </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredContent.map(post => {
            const linkedItem = songs.find(s => s.id === post.linkedId) || releases.find(r => r.id === post.linkedId);
            
            return (
              <motion.div 
                layout key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => handleOpenEdit(post)}
                className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {getPlatformIcon(post.platform)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{post.title}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{post.platform} • {new Date(post.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ 
                     fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '6px', 
                     background: post.stage === 'Scheduled' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                     color: post.stage === 'Scheduled' ? '#60a5fa' : 'var(--text-secondary)',
                     border: '1px solid rgba(255,255,255,0.05)'
                   }}>
                     {post.stage}
                   </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* PLANNER DRAWER */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 1000, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <button onClick={() => setIsEditorOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
              <h2 style={{ fontFamily: 'Outfit', margin: 0 }}>Plan Post</h2>
              <button onClick={handleSave} style={{ background: 'var(--accent-color)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--accent-glow)' }}><Check size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em' }}>POST TITLE</label>
                <input 
                  autoFocus type="text" placeholder="Tour Announcement" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '1.5rem', color: 'white', outline: 'none', fontFamily: 'Outfit', fontWeight: '800' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>CURRENT STAGE</label>
                 <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {STAGES.map(s => (
                      <div 
                        key={s} onClick={() => setFormData({...formData, stage: s})}
                        style={{ 
                          padding: '0.6rem 1.2rem', borderRadius: '12px', background: formData.stage === s ? 'var(--accent-color)' : 'var(--surface-highlight)',
                          color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        {s}
                      </div>
                    ))}
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>LINK TO PROJECT (OPTIONAL)</label>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[...songs, ...releases].map(item => (
                       <div 
                        key={item.id} onClick={() => setFormData({...formData, linkedId: formData.linkedId === item.id ? null : item.id})}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', borderRadius: '12px', 
                          background: formData.linkedId === item.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${formData.linkedId === item.id ? 'var(--accent-color)' : 'transparent'}`,
                          cursor: 'pointer'
                        }}
                       >
                          <Music size={16} color={formData.linkedId === item.id ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                          <span style={{ fontSize: '0.9rem', fontWeight: formData.linkedId === item.id ? '700' : '500' }}>{item.title}</span>
                          {formData.linkedId === item.id && <Check size={16} color="var(--accent-color)" style={{ marginLeft: 'auto' }} />}
                       </div>
                    ))}
                 </div>
              </div>

              {selectedPost && (
                <button 
                  onClick={() => deletePost(selectedPost.id)}
                  style={{ marginTop: '2rem', background: 'rgba(239, 68, 68, 0.05)', border: 'none', padding: '1rem', borderRadius: '16px', color: '#ef4444', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                  Delete Post
                </button>
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
