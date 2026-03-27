import { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Music, Disc3, Video, StickyNote } from 'lucide-react';
import Songs from './pages/Songs';
import Releases from './pages/Releases';
import ContentPage from './pages/Content';
import Notes from './pages/Notes';
import { useCollection } from './hooks/useFirestore';

// --- INITIAL DATA (Used as fallbacks/reference) ---
const INITIAL_SONGS = [
  { id: 1, title: 'Midnight City', stage: 'Mixed', bpm: 128, key: 'Cm', lastEdited: '2h ago', lyrics: 'Midnight city, neon lights...' },
  { id: 2, title: 'Neon Lights', stage: 'Writing', bpm: 105, key: 'G#maj', lastEdited: '5d ago', lyrics: '' },
  { id: 3, title: 'Summer Vibes', stage: 'Demo', bpm: 95, key: 'Amaj', lastEdited: '1w ago', lyrics: '' }
];

function App() {
  const location = useLocation();
  
  // Real-time Firestore hooks
  const { 
    data: songsData, 
    addDocument: addSong, 
    updateDocument: updateSong, 
    deleteDocument: deleteSong 
  } = useCollection('songs');

  const { 
    data: releasesData, 
    addDocument: addRelease, 
    updateDocument: updateRelease, 
    deleteDocument: deleteRelease 
  } = useCollection('releases');

  const { 
    data: contentData, 
    addDocument: addContent, 
    updateDocument: updateContent, 
    deleteDocument: deleteContent 
  } = useCollection('content');

  const { 
    data: notesData, 
    addDocument: addNote, 
    updateDocument: updateNote, 
    deleteDocument: deleteNote 
  } = useCollection('notes');

  // Unified State Management (bridging local pages to Firestore)
  const setSongs = (updatedSongsOrSongsSetter) => {
    // This is a bridge for current page implementations
    // Ideally, we refactor pages to use add/update/delete directly
  };

  const navItems = [
    { path: '/', label: 'Songs', icon: Music },
    { path: '/releases', label: 'Releases', icon: Disc3 },
    { path: '/content', label: 'Content', icon: Video },
    { path: '/notes', label: 'Notes', icon: StickyNote },
  ];

  // Helper for Songs Page to match existing prop expectations or new patterns
  const songsActions = {
    add: addSong,
    update: updateSong,
    delete: deleteSong
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <Songs 
                songs={songsData} 
                setSongs={setSongs} 
                dbActions={songsActions}
              />
            } />
            <Route path="/releases" element={
              <Releases 
                releases={releasesData} 
                songs={songsData}
                dbActions={{ add: addRelease, update: updateRelease, delete: deleteRelease }}
              />
            } />
            <Route path="/content" element={
              <ContentPage 
                content={contentData} 
                songs={songsData} 
                releases={releasesData}
                dbActions={{ add: addContent, update: updateContent, delete: deleteContent }}
              />
            } />
            <Route path="/notes" element={
              <Notes 
                notes={notesData}
                dbActions={{ add: addNote, update: updateNote, delete: deleteNote }}
              />
            } />
          </Routes>
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon-container">
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-bg"
                    className="active-indicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="nav-icon" />
              </div>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
