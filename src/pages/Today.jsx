import { useMemo, useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { 
  Calendar, CheckCircle2, Clock, Camera, Play, 
  Music, Sparkles, ChevronRight, Disc3, StickyNote,
  AlertCircle, X, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '../components/LoadingScreen';

const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Today({ songs = [], releases = [], content = [], notes = [], isLoading, dbActions }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const today = useMemo(() => formatDateToISO(new Date()), []);
  
  const itinerary = useMemo(() => {
    if (isLoading) return null;

    // 1. Scheduled Content for today
    const todayContent = (content || []).filter(c => c.date === today);
    const toShoot = todayContent.filter(c => c.stage === 'To Shoot');
    const toPost = todayContent.filter(c => c.stage !== 'To Shoot');

    // 2. Urgent Release Tasks (Releases in the next 7 days)
    const upcomingReleases = (releases || []).filter(r => {
      const relDate = new Date(r.date);
      const now = new Date();
      const diff = (relDate - now) / (1000 * 60 * 60 * 24);
      return diff >= -1 && diff <= 7;
    });

    // 3. Recent Notes for inspiration
    const recentNotes = (notes || []).slice(0, 3);

    return { toShoot, toPost, upcomingReleases, recentNotes };
  }, [content, releases, notes, today, isLoading]);

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const markAsPosted = async () => {
    if (!selectedItem) return;
    try {
      await dbActions.update(selectedItem.id, { stage: 'Posted' });
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Error updating post status:", err);
    }
  };

  if (isLoading) return <LoadingScreen message="Assembling your daily mission..." />;

  const hasNothingToday = itinerary.toShoot.length === 0 && 
                         itinerary.toPost.length === 0 && 
                         itinerary.upcomingReleases.length === 0;

  return (
    <PageTransition>
      <div className="page-wrapper" style={{ paddingBottom: '2rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={16} color="var(--accent-color)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily Itinerary</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '2.5rem' }}>Good Morning.</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {hasNothingToday ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ marginBottom: '1.5rem', opacity: 0.3 }}>
              <Calendar size={64} strokeWidth={1} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Clear Skies Today</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Use this time to create something new or plan your next move in the Calendar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* SHOOTING SECTION */}
            {itinerary.toShoot.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                   <Camera size={18} color="var(--accent-color)" />
                   <h2 style={{ fontSize: '1.1rem', margin: 0 }}>To Shoot</h2>
                   <span style={{ marginLeft: 'auto', background: 'var(--accent-glow)', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                     {itinerary.toShoot.length} ITEMS
                   </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {itinerary.toShoot.map(item => (
                    <motion.div 
                      key={item.id} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenDetail(item)}
                      className="card" style={{ padding: '1.25rem', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={20} color="var(--accent-color)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', margin: '0 0 2px 0' }}>{item.title}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>{item.platform} • {item.type}</p>
                          {item.notes && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px', borderLeft: '3px solid var(--accent-color)' }}>
                              <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{item.notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* RELEASES SECTION */}
            {itinerary.upcomingReleases.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                   <Disc3 size={18} color="#10b981" />
                   <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Upcoming Releases</h2>
                </div>
                {itinerary.upcomingReleases.map(release => {
                  const daysLeft = Math.ceil((new Date(release.date) - new Date()) / (1000 * 60 * 60 * 24));
                  const pendingTasks = (release.tasks || []).filter(t => !t.completed);
                  
                  return (
                    <motion.div key={release.id} className="card" style={{ padding: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{release.title}</h3>
                          <span style={{ fontSize: '0.75rem', color: daysLeft <= 2 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                            {daysLeft === 0 ? 'RELEASING TODAY' : daysLeft === 1 ? 'RELEASING TOMORROW' : `${daysLeft} DAYS UNTIL RELEASE`}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <CheckCircle2 size={24} color={pendingTasks.length === 0 ? '#10b981' : 'rgba(255,255,255,0.1)'} />
                        </div>
                      </div>
                      
                      {pendingTasks.length > 0 ? (
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '1rem' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>High Priority To-Dos</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {pendingTasks.slice(0, 3).map(task => (
                              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={14} color="#f59e0b" />
                                <span style={{ fontSize: '0.85rem' }}>{task.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>Ready for launch!</p>
                      )}
                    </motion.div>
                  )
                })}
              </section>
            )}

            {/* POSTING SECTION */}
            {itinerary.toPost.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                   <Clock size={18} color="#3b82f6" />
                   <h2 style={{ fontSize: '1.1rem', margin: 0 }}>To Post</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  {itinerary.toPost.map(item => (
                    <motion.div 
                      key={item.id} 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenDetail(item)}
                      className="card" style={{ padding: '1rem', marginBottom: 0, cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}>{item.platform}</span>
                      <h4 style={{ margin: '4px 0', fontSize: '0.9rem', lineHeight: '1.2' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>{item.stage}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* NOTES SECTION */}
            {itinerary.recentNotes.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                   <Sparkles size={18} color="#f59e0b" />
                   <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Sparks</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                  {itinerary.recentNotes.map(note => (
                    <motion.div 
                      key={note.id} 
                      whileTap={{ scale: 0.98 }}
                      className="card" 
                      style={{ 
                        minWidth: '200px', 
                        padding: '1rem', 
                        marginBottom: 0,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent)',
                        cursor: 'default'
                      }}
                    >
                      <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' }}>{note.tag}</span>
                      <h4 style={{ margin: '4px 0', fontSize: '0.9rem' }}>{note.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.content}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* DETAIL DRAWER */}
        <AnimatePresence>
          {isDrawerOpen && selectedItem && (
            <>
              {/* Backrop */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, backdropFilter: 'blur(10px)' }}
              />
              {/* Drawer */}
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface-color)', zIndex: 1001, borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '2rem', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
              >
                <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '-1rem auto 1.5rem auto' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selectedItem.platform} • {selectedItem.type}</span>
                    <h2 style={{ margin: '4px 0', fontSize: '1.75rem' }}>{selectedItem.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                       <Clock size={14} />
                       <span>{selectedItem.stage}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Production Notes</label>
                  <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedItem.notes || 'No specific instructions added for this post.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={markAsPosted}
                    disabled={selectedItem.stage === 'Posted'}
                    style={{ flex: 1, background: selectedItem.stage === 'Posted' ? 'rgba(16, 185, 129, 0.1)' : 'var(--accent-color)', color: selectedItem.stage === 'Posted' ? '#10b981' : 'white', border: 'none', padding: '1.25rem', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: selectedItem.stage === 'Posted' ? 0.6 : 1 }}
                  >
                    <Check size={20} />
                    {selectedItem.stage === 'Posted' ? 'Published' : 'Mark as Posted'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
