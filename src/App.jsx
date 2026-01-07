import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Heart, X, Github, Youtube, ExternalLink, ChevronLeft, Sparkles, Play, ChevronUp } from 'lucide-react'
import './App.css'

// Import project data
import projectsData from './data/projects.json'

// Helper to extract YouTube video ID
function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/)
  return match ? match[1] : null
}

function App() {
  const [projects, setProjects] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState([])
  const [passed, setPassed] = useState([])
  const [showLiked, setShowLiked] = useState(false)
  const [direction, setDirection] = useState(null)

  useEffect(() => {
    // Shuffle projects for random order, prioritize those with YouTube videos
    const withVideo = projectsData.filter(p => getYouTubeId(p.youtube))
    const withoutVideo = projectsData.filter(p => !getYouTubeId(p.youtube))
    const shuffledWithVideo = [...withVideo].sort(() => Math.random() - 0.5)
    const shuffledWithoutVideo = [...withoutVideo].sort(() => Math.random() - 0.5)
    setProjects([...shuffledWithVideo, ...shuffledWithoutVideo])
  }, [])

  const currentProject = projects[currentIndex]

  const handleSwipe = (dir) => {
    if (!currentProject) return

    setDirection(dir)

    if (dir === 'right') {
      setLiked(prev => [...prev, currentProject])
    } else {
      setPassed(prev => [...prev, currentProject])
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDirection(null)
    }, 300)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') handleSwipe('right')
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') handleSwipe('left')
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProject])

  if (showLiked) {
    return (
      <div className="app">
        <header className="header">
          <button className="back-btn" onClick={() => setShowLiked(false)}>
            <ChevronLeft size={20} />
            Back
          </button>
          <h1><Sparkles size={18} /> Liked ({liked.length})</h1>
        </header>

        <div className="liked-grid">
          {liked.length === 0 ? (
            <p className="empty-state">No projects liked yet. Start swiping!</p>
          ) : (
            liked.map((project, idx) => (
              <LikedCard key={idx} project={project} />
            ))
          )}
        </div>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="app">
        <div className="end-screen">
          <h1>You've seen all projects!</h1>
          <p>You liked {liked.length} out of {projects.length} projects</p>
          <button className="view-liked-btn" onClick={() => setShowLiked(true)}>
            <Heart size={18} /> View Liked Projects
          </button>
          <button className="restart-btn" onClick={() => {
            setCurrentIndex(0)
            setLiked([])
            setPassed([])
            const withVideo = projectsData.filter(p => getYouTubeId(p.youtube))
            const withoutVideo = projectsData.filter(p => !getYouTubeId(p.youtube))
            setProjects([...withVideo.sort(() => Math.random() - 0.5), ...withoutVideo.sort(() => Math.random() - 0.5)])
          }}>
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app shorts-layout">
      {/* Top Stats Bar */}
      <header className="top-bar">
        <div className="logo">HackSwipe</div>
        <div className="stats-row">
          <span className="stat-pill liked"><Heart size={14} /> {liked.length}</span>
          <span className="stat-pill passed"><X size={14} /> {passed.length}</span>
          <span className="stat-pill remaining">{projects.length - currentIndex}</span>
        </div>
        <button className="liked-btn" onClick={() => setShowLiked(true)}>
          <Sparkles size={16} />
        </button>
      </header>

      {/* Main Card Area */}
      <div className="shorts-container">
        <AnimatePresence mode="wait">
          <ShortsCard
            key={currentIndex}
            project={currentProject}
            onSwipe={handleSwipe}
            direction={direction}
          />
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <div className="action-bar">
        <button className="action-btn pass" onClick={() => handleSwipe('left')}>
          <X size={28} />
          <span>Skip</span>
        </button>
        <div className="swipe-hint">
          <ChevronUp size={16} />
          <span>Swipe up to like</span>
        </div>
        <button className="action-btn like" onClick={() => handleSwipe('right')}>
          <Heart size={28} />
          <span>Like</span>
        </button>
      </div>
    </div>
  )
}

function ShortsCard({ project, onSwipe, direction }) {
  const y = useMotionValue(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])

  const likeOpacity = useTransform(y, [-150, -50, 0], [1, 0.5, 0])
  const passOpacity = useTransform(y, [0, 50, 150], [0, 0.5, 1])

  const handleDragEnd = (_, info) => {
    // Vertical swipe (like Shorts)
    if (info.offset.y < -100) {
      onSwipe('right') // Swipe up = like
    } else if (info.offset.y > 100) {
      onSwipe('left') // Swipe down = pass
    }
    // Horizontal swipe (traditional Tinder)
    else if (info.offset.x > 100) {
      onSwipe('right')
    } else if (info.offset.x < -100) {
      onSwipe('left')
    }
  }

  const exitY = direction === 'right' ? -600 : direction === 'left' ? 600 : 0

  const youtubeId = getYouTubeId(project.youtube)

  return (
    <motion.div
      className="shorts-card"
      style={{ y, x, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
      exit={{ y: exitY, opacity: 0, transition: { duration: 0.3 } }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Swipe Indicators */}
      <motion.div className="swipe-overlay like-overlay" style={{ opacity: likeOpacity }}>
        <Heart size={64} />
        <span>LIKE</span>
      </motion.div>
      <motion.div className="swipe-overlay pass-overlay" style={{ opacity: passOpacity }}>
        <X size={64} />
        <span>SKIP</span>
      </motion.div>

      {/* Video Section */}
      <div className="video-section">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={project.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="no-video">
            <Play size={48} />
            <span>No demo video</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="content-section">
        {/* Prize Badge */}
        {project.prize && (
          <div className="prize-row">
            <span className="prize-tag">{project.prize}</span>
          </div>
        )}

        {/* Title */}
        <h2 className="project-title">{project.title}</h2>

        {/* Summary */}
        <p className="project-summary">{project.summary}</p>

        {/* Tech Stack */}
        {project.techStack && (
          <div className="tech-row">
            {project.techStack.split(', ').slice(0, 5).map((tech, i) => (
              <span key={i} className="tech-chip">{tech}</span>
            ))}
          </div>
        )}

        {/* Team & Date */}
        <div className="meta-row">
          {project.team && <span className="team-info">{project.team}</span>}
          {project.date && <span className="date-info">{project.date}</span>}
        </div>

        {/* Action Links */}
        <div className="links-row">
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="link-btn github">
              <Github size={16} /> GitHub
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="link-btn demo">
              <ExternalLink size={16} /> Live Demo
            </a>
          )}
          {project.projectUrl && (
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="link-btn devpost">
              <Sparkles size={16} /> Devpost
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function LikedCard({ project }) {
  const youtubeId = getYouTubeId(project.youtube)

  return (
    <div className="liked-card">
      {youtubeId && (
        <div className="liked-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
            title={project.title}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      )}
      <div className="liked-content">
        <h3>{project.title}</h3>
        {project.prize && <p className="prize">{project.prize}</p>}
        <p className="summary">{project.summary?.substring(0, 120)}...</p>
        <div className="tech-stack">
          {project.techStack?.split(', ').slice(0, 4).map((tech, i) => (
            <span key={i} className="tech-chip">{tech}</span>
          ))}
        </div>
        <div className="links">
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              <Github size={14} /> GitHub
            </a>
          )}
          {project.projectUrl && (
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> View
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
