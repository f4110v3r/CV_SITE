import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const pubUrl = (path) => {
  if (!path) return ''
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return base + path.replace(/^\//, '')
}

import { fileSystem as staticFileSystem } from '../data/fileSystem'
import { aboutMe } from '../data/aboutMe'

const allModules = import.meta.glob('../projects/**/*.{mp4,txt,sys}', { eager: true })
const videoModules = import.meta.glob('../projects/**/*.mp4', { eager: true })
const textModulesRaw = import.meta.glob('../projects/**/*.txt', { query: '?raw', import: 'default', eager: true })
const sysModulesRaw = import.meta.glob('../projects/**/*.sys', { query: '?raw', import: 'default', eager: true })
const mdModulesRaw = import.meta.glob('../projects/**/*.md', { query: '?raw', import: 'default', eager: true })
const urlModulesRaw = import.meta.glob('../projects/**/*.url', { query: '?raw', import: 'default', eager: true })

const staticByFileBase = new Map()
staticFileSystem.years?.forEach((y) => {
  y.months?.forEach((m) => {
    m.projects?.forEach((p) => {
      const fb = (p.fileBase || p.id || p.title || '').toLowerCase().replace(/\s+/g, '_')
      staticByFileBase.set(fb, p)
    })
  })
})

function buildTreeFromStatic() {
  const root = { name: '', type: 'dir', path: [], children: {} }
  staticFileSystem.years?.forEach((y) => {
    y.months?.forEach((m) => {
      (m.projects || []).forEach((p) => {
        const year = y.year
        const month = String(m.month || '01').padStart(2, '0')
        const base = p.fileBase || p.id || p.title?.toLowerCase().replace(/\s+/g, '_') || 'project'
        if (!root.children[year]) root.children[year] = { name: year, type: 'dir', path: [year], children: {} }
        const yNode = root.children[year]
        if (!yNode.children[month]) yNode.children[month] = { name: month, type: 'dir', path: [year, month], children: {} }
        const mNode = yNode.children[month]
        const meta = { ...p, fileBase: base, title: p.title || base }
        ;['.mp4', '_breakdown.txt', '_tools.sys'].forEach((ext) => {
          const label = ext === '.mp4' ? `${base}.mp4` : `${base}${ext}`
          mNode.children[label] = { name: label, type: 'file', path: [year, month, label], globKey: null, _meta: meta }
        })
      })
    })
  })
  return root
}

function buildTreeFromPaths() {
  const root = { name: '', type: 'dir', path: [], children: {} }
  const addPath = (fullPath) => {
    const parts = fullPath.replace(/^\.\.\//, '').split('/')
    if (parts[0] !== 'projects' || parts.length < 2) return
    const segments = parts.slice(1)
    let node = root
    let path = []

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      path = [...path, seg]
      const isFile = i === segments.length - 1 && /\.(mp4|txt|sys|md|url)$/i.test(seg)

      if (isFile) {
        node.children[seg] = node.children[seg] || {
          name: seg,
          type: 'file',
          path: [...path],
          globKey: fullPath,
        }
      } else {
        if (!node.children[seg]) {
          node.children[seg] = { name: seg, type: 'dir', path: [...path], children: {} }
        }
        node = node.children[seg]
      }
    }
  }
  Object.keys(allModules).forEach(addPath)
  Object.keys(mdModulesRaw).forEach(addPath)
  Object.keys(urlModulesRaw).forEach(addPath)

  return root
}

function buildTree() {
  const fromPaths = buildTreeFromPaths()
  if (Object.keys(fromPaths.children || {}).length > 0) return fromPaths
  return buildTreeFromStatic()
}

function treeToSortedList(node) {
  if (!node.children) return []
  const keys = Object.keys(node.children).sort((a, b) => {
    const A = node.children[a]
    const B = node.children[b]
    if (A.type === 'dir' && B.type === 'file') return -1
    if (A.type === 'file' && B.type === 'dir') return 1
    return a.localeCompare(b)
  })
  return keys.map((k) => ({ key: k, node: node.children[k] }))
}

const INDENT = '│   '
const BRANCH = '├── '
const LAST = '└── '
const SPACE = '    '

function getFileType(name) {
  if (/\.mp4$/i.test(name)) return '[VID]'
  if (/\.url$/i.test(name)) return '[VID]'
  if (/breakdown\.txt$/i.test(name)) return '[TXT]'
  if (/tools\.sys$/i.test(name)) return '[SYS]'
  if (/\.md$/i.test(name)) return '[MD]'
  return '[???]'
}

function getProjectMeta(node) {
  const base = node.name
    .replace(/\.mp4$/i, '')
    .replace(/_breakdown\.txt$/i, '')
    .replace(/_tools\.sys$/i, '')
    .replace(/\.md$/i, '')
  const meta = staticByFileBase.get(base) || staticByFileBase.get(base.replace(/-/g, '_'))
  return {
    fileBase: base,
    title: meta?.title || base.replace(/[-_]/g, ' ').toUpperCase(),
    description: meta?.description || '',
    breakdown: meta?.breakdown || '',
    tools: meta?.tools || [],
    globKey: node.globKey,
  }
}

function FileSystemScreen() {
  const treeRoot = useMemo(() => buildTree(), [])
  const [expanded, setExpanded] = useState(() => new Set())
  const [selectedPath, setSelectedPath] = useState(null)
  const [activeFile, setActiveFile] = useState(null)
  const itemsRef = useRef([])

  const flattenItems = (node, depth, pathPrefix, out) => {
    const list = treeToSortedList(node)
    if (list.length === 0) return
    list.forEach(({ key, node: n }, idx) => {
      const path = [...pathPrefix, key]
      const pathStr = path.join('/')
      const isLast = idx === list.length - 1
      out.push({
        type: n.type,
        path,
        pathStr,
        depth,
        isLast,
        node: n,
      })
      if (n.type === 'dir' && expanded.has(pathStr)) {
        flattenItems(n, depth + 1, path, out)
      }
    })
  }

  const allItems = useMemo(() => {
    const out = []
    flattenItems(treeRoot, 0, [], out)
    return out
  }, [expanded])

  itemsRef.current = allItems

  const selectedIndex = selectedPath
    ? allItems.findIndex((i) => i.pathStr === selectedPath)
    : 0
  const safeIndex = Math.max(0, Math.min(selectedIndex >= 0 ? selectedIndex : 0, allItems.length - 1))
  const selectedItem = allItems[safeIndex]

  const currentPath = selectedItem
    ? `C:\\MAKSIM\\ПРОЕКТЫ\\${selectedItem.pathStr}>`
    : 'C:\\MAKSIM\\ПРОЕКТЫ\\>'

  const toggleExpanded = (pathStr) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(pathStr)) next.delete(pathStr)
      else next.add(pathStr)
      return next
    })
  }

  const activateItem = (item) => {
    setSelectedPath(item.pathStr)
    if (item.type === 'dir') {
      toggleExpanded(item.pathStr)
    } else if (item.type === 'file') {
      const path = item.path.join('\\')
      const project = item.node._meta || getProjectMeta(item.node)
      const ext = getExt(item.node.name)
      setActiveFile({
        item,
        project: { ...project, _fileKeys: item.node.globKey ? { [ext]: item.node.globKey } : {} },
        path: `C:\\MAKSIM\\ПРОЕКТЫ\\${path}`,
      })
    }
  }

  function getExt(name) {
    if (/\.mp4$/i.test(name)) return '.mp4'
    if (/\.url$/i.test(name)) return '.url'
    if (/breakdown\.txt$/i.test(name)) return '_breakdown.txt'
    if (/tools\.sys$/i.test(name)) return '_tools.sys'
    if (/\.md$/i.test(name)) return '.md'
    if (/\.txt$/i.test(name)) return '.txt'
    return ''
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (document.activeElement?.tagName === 'INPUT') return
      if (allItems.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const idx = allItems.findIndex((i) => i.pathStr === (selectedItem?.pathStr))
        const next = idx < 0 ? 0 : Math.min(idx + 1, allItems.length - 1)
        setSelectedPath(allItems[next].pathStr)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const idx = allItems.findIndex((i) => i.pathStr === (selectedItem?.pathStr))
        const next = idx <= 0 ? 0 : idx - 1
        setSelectedPath(allItems[next].pathStr)
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (selectedItem) activateItem(selectedItem)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (selectedItem?.type === 'dir' && expanded.has(selectedItem.pathStr)) {
          toggleExpanded(selectedItem.pathStr)
        } else {
          const parent = selectedItem?.path.slice(0, -1).join('/')
          if (parent) setSelectedPath(parent)
        }
      } else if (e.key === 'Escape') {
        if (activeFile) {
          e.preventDefault()
          setActiveFile(null)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [allItems, selectedItem, expanded, activeFile])

  const renderTree = (node, depth, prefix, parentIsLast) => {
    const list = treeToSortedList(node)
    if (list.length === 0) return null

    return list.map(({ key, node: n }, idx) => {
      const isLast = idx === list.length - 1
      const pathStr = node.path?.length ? [...node.path, key].join('/') : key
      const branch = isLast ? LAST : BRANCH
      const linePrefix = prefix
      const selected = selectedItem?.pathStr === pathStr

      if (n.type === 'dir') {
        const isOpen = expanded.has(pathStr)
        return (
          <div key={pathStr}>
            <div
              className="tree-line"
              data-selectable="true"
              data-selected={selected ? 'true' : 'false'}
              onClick={() => {
                setSelectedPath(pathStr)
                toggleExpanded(pathStr)
              }}
            >
              <span className="tree-line-prefix" style={{ width: '1ch' }}>{selected ? '>' : ' '}</span>
              <span className="tree-line-label" style={{ whiteSpace: 'pre' }}>
                {linePrefix}{branch}{isOpen ? '−' : '+'}{' '}
              </span>
              <span className="tree-line-type">[DIR]</span>
              <span className="tree-line-name">{key}\\</span>
            </div>
            {isOpen && renderTree(n, depth + 1, linePrefix + (isLast ? SPACE : INDENT), isLast)}
          </div>
        )
      }

      return (
        <div
          key={pathStr}
          className="tree-line"
          data-selectable="true"
          data-selected={selected ? 'true' : 'false'}
          onClick={() => {
            setSelectedPath(pathStr)
            activateItem({ type: 'file', pathStr, path: pathStr.split('/'), node: n })
          }}
        >
          <span className="tree-line-prefix" style={{ width: '1ch' }}>{selected ? '>' : ' '}</span>
          <span className="tree-line-label" style={{ whiteSpace: 'pre' }}>
            {linePrefix}{isLast ? LAST : BRANCH}
          </span>
          <span className="tree-line-type">{getFileType(n.name)}</span>
          <span className="tree-line-name">{n.name}</span>
        </div>
      )
    })
  }

  const hasContent = Object.keys(treeRoot.children || {}).length > 0

  return (
    <div className="terminal">
      <div className="fs-layout">
        <div className="fs-topbar">
          <span>╔═ МАКСИМ ЗОЛИКОВ ═ MOTION FILE SYSTEM <span className="text-muted">[СТРЕЛКИ · ENTER — ОТКРЫТЬ · ← СВЕРНУТЬ]</span></span>
          <span className="text-muted">ESC ЗАКРЫВАЕТ</span>
        </div>

        <div className="fs-main">
          <div className="fs-tree">
            <div className="fs-path">C:\\MAKSIM\\ПРОЕКТЫ\\</div>
            <div className="tree-line">
              <span className="tree-line-prefix" />
              <span className="tree-line-name">│</span>
            </div>
            {!hasContent ? (
              <div className="tree-line text-muted">[ НЕТ ДАННЫХ — добавьте файлы в src/projects/ ]</div>
            ) : (
              renderTree(treeRoot, 0, '', true)
            )}
          </div>

          <div className="fs-details">
            <div className="fs-path">{currentPath}</div>
            {activeFile ? (
              <FileDetails activeFile={activeFile} />
            ) : (
              <AboutBlock />
            )}
          </div>
        </div>
      </div>

      {activeFile &&
        createPortal(
          <RetroWindow
            activeFile={activeFile}
            videoModules={videoModules}
            textModulesRaw={textModulesRaw}
            sysModulesRaw={sysModulesRaw}
            mdModulesRaw={mdModulesRaw}
            urlModulesRaw={urlModulesRaw}
            onClose={() => setActiveFile(null)}
          />,
          document.body
        )}
    </div>
  )
}

function ContactLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="contact-link">
      {children}
    </a>
  )
}

function AboutBlock() {
  const [photoError, setPhotoError] = useState(false)
  const { photoPath, about, contacts, experience, education, skills, tagline, cvPdfPath } = aboutMe
  const showPlaceholder = !photoPath || photoError
  const tg = typeof contacts.telegram === 'object' ? contacts.telegram : { label: contacts.telegram, href: `https://t.me/${String(contacts.telegram).replace('@', '')}` }
  const em = typeof contacts.email === 'object' ? contacts.email : { label: contacts.email, href: `mailto:${contacts.email}` }
  return (
    <div className="about-block" style={{ fontSize: 12, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="about-block-header" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div className="photo-placeholder" style={{
          width: 80,
          height: 80,
          minWidth: 80,
          border: '1px solid #2a5f2a',
          backgroundColor: '#0a1a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {photoPath && !photoError && (
            <img src={pubUrl(photoPath)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhotoError(true)} />
          )}
          {showPlaceholder && <span className="text-muted" style={{ fontSize: 10 }}>[ФОТО]</span>}
        </div>
        <div style={{ flex: 1 }}>
          <div className="text-strong" style={{ marginBottom: 2, fontSize: 14 }}>МАКСИМ ЗОЛИКОВ</div>
          {tagline && <div className="text-muted" style={{ marginBottom: 6, fontSize: 11 }}>{tagline}</div>}
          <div className="text-strong" style={{ marginBottom: 4 }}>О СЕБЕ</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{about}</div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #2a5f2a', margin: 0 }} />
      <div className="text-strong" style={{ marginBottom: 4 }}>КОНТАКТЫ</div>
      <div>
        Telegram — <ContactLink href={tg.href}>{tg.label}</ContactLink>
        <br />
        Email — <ContactLink href={em.href}>{em.label}</ContactLink>
        {cvPdfPath && (
          <>
            <br />
            <ContactLink href={pubUrl(cvPdfPath)}>Скачать CV (PDF)</ContactLink>
          </>
        )}
      </div>
      {skills?.length > 0 && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid #2a5f2a', margin: 0 }} />
          <div className="text-strong" style={{ marginBottom: 4 }}>ИНСТРУМЕНТЫ</div>
          <div className="text-muted" style={{ fontSize: 11 }}>{skills.join(' · ')}</div>
        </>
      )}
      <hr style={{ border: 'none', borderTop: '1px solid #2a5f2a', margin: '8px 0' }} />
      <div className="text-strong" style={{ marginBottom: 4 }}>ОПЫТ РАБОТЫ</div>
      {experience.map((job, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <span className="text-strong">{job.title}</span>
          <span className="text-muted" style={{ fontStyle: 'italic', marginLeft: 4 }}>{job.period}</span>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            {job.points.map((p, j) => <li key={j}>{p}</li>)}
          </ul>
        </div>
      ))}
      <hr style={{ border: 'none', borderTop: '1px solid #2a5f2a', margin: '8px 0' }} />
      <div className="text-strong" style={{ marginBottom: 4 }}>ОБРАЗОВАНИЕ</div>
      {education.map((e, i) => (
        <div key={i}>{e.institution} — {e.specialization}</div>
      ))}
    </div>
  )
}

function FileDetails({ activeFile }) {
  const { project, path } = activeFile
  return (
    <div>
      <div className="text-strong">{project?.title || project?.fileBase || path}</div>
      <div className="text-muted" style={{ marginTop: 1 }}>{path}</div>
      {project?.description && <div style={{ marginTop: 2 }}>{project.description}</div>}
      {project?.tools?.length > 0 && (
        <div style={{ marginTop: 2 }}>
          <span className="text-muted">ИНСТРУМЕНТЫ:</span> {project.tools.join(' · ')}
        </div>
      )}
    </div>
  )
}

function isEmbedUrl(url) {
  if (!url || typeof url !== 'string') return false
  const u = url.trim().toLowerCase()
  return /embed|youtube|youtu\.be|vimeo|adobe\.io|behance\.net/i.test(u)
}

function RetroWindow({ activeFile, videoModules, textModulesRaw, sysModulesRaw, mdModulesRaw, urlModulesRaw, onClose }) {
  const { project, path, item } = activeFile
  const name = item?.node?.name || ''
  const isVideo = /\.mp4$/i.test(name)
  const isUrlVideo = /\.url$/i.test(name)
  const isTxt = /\.txt$/i.test(name)
  const isBreakdown = /breakdown\.txt$/i.test(name)
  const isTools = /tools\.sys$/i.test(name)
  const isMd = /\.md$/i.test(name)

  const ext = isVideo ? '.mp4' : isUrlVideo ? '.url' : isTxt ? (isBreakdown ? '_breakdown.txt' : '.txt') : isTools ? '_tools.sys' : '.md'
  const globKey = item?.node?.globKey || project?._fileKeys?.[ext]

  let fileContent = ''
  let videoSrc = ''
  let embedSrc = ''
  if (isUrlVideo && globKey && urlModulesRaw[globKey]) {
    const url = String(urlModulesRaw[globKey] ?? '').trim()
    if (url && /^https?:\/\//i.test(url)) {
      if (isEmbedUrl(url)) embedSrc = url
      else videoSrc = url
    }
  }
  if (isVideo && globKey && videoModules[globKey]) {
    const raw = videoModules[globKey].default || ''
    const base = import.meta.env.BASE_URL || '/'
    videoSrc = (base !== '/' && raw && !raw.startsWith('http') && !raw.startsWith(base))
      ? (base.replace(/\/?$/, '/') + raw.replace(/^\//, ''))
      : raw
  }
  if (isVideo && !videoSrc && /showreel\.mp4$/i.test(name)) {
    videoSrc = new URL('../showreel.mp4', import.meta.url).href
  }
  if (isTxt && globKey && textModulesRaw[globKey]) {
    fileContent = typeof textModulesRaw[globKey] === 'string' ? textModulesRaw[globKey] : String(textModulesRaw[globKey] ?? '')
  }
  if (isTools && globKey && sysModulesRaw[globKey]) {
    fileContent = typeof sysModulesRaw[globKey] === 'string' ? sysModulesRaw[globKey] : String(sysModulesRaw[globKey] ?? '')
  }
  if (isMd && globKey && mdModulesRaw[globKey]) {
    fileContent = typeof mdModulesRaw[globKey] === 'string' ? mdModulesRaw[globKey] : String(mdModulesRaw[globKey] ?? '')
  }

  if (!videoSrc && !fileContent) {
    if (isBreakdown && project?.breakdown) fileContent = project.breakdown
    else if (isTools && project?.tools?.length) {
      fileContent = project.tools.map((t, i) => `DEVICE${i + 1}: ${String(t).toUpperCase()}`).join('\n')
    } else if (isMd && project?.description) fileContent = project.description
  }

  return (
    <div className="retro-window-backdrop" onClick={onClose}>
      <div className="retro-window" onClick={(e) => e.stopPropagation()}>
        <div className="retro-window-header">
          <span>
            {(isVideo || isUrlVideo) && 'ВИДЕО'}
            {(isBreakdown || isTxt) && 'ТЕКСТ'}
            {isTools && 'ИНСТРУМЕНТЫ'}
            {isMd && 'MARKDOWN'}
          </span>
          <span>[ ESC / КЛИК — ЗАКРЫТЬ ]</span>
        </div>
        <div className="retro-window-body">
          <div style={{ marginBottom: 4 }}>
            <span className="text-strong">{name}</span> — {path}
          </div>
          {(isVideo || isUrlVideo) && (
            embedSrc ? (
              <iframe src={embedSrc} title="Video" className="retro-window-video retro-window-iframe" allow="autoplay; fullscreen" allowFullScreen />
            ) : videoSrc ? (
              <video src={videoSrc} autoPlay muted loop playsInline controls className="retro-window-video" onClick={(e) => e.stopPropagation()} />
            ) : (
              <div className="text-muted">Видео не найдено.</div>
            )
          )}
          {(isTxt || isBreakdown || isTools || isMd) && (
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{fileContent || '[ Пусто ]'}</pre>
          )}
          <div className="retro-window-footer">
            <span>MOTION-OS</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileSystemScreen
