import profile from '../data/profile.json'

export function usePortfolioEffects() {
  const cleanup = []
  let disposed = false
  const on = (target, name, handler, options) => {
    if (!target) return
    target.addEventListener(name, handler, options)
    cleanup.push(() => target.removeEventListener(name, handler, options))
  }
  const later = (fn, ms) => {
    const id = setTimeout(() => { if (!disposed) fn() }, ms)
    cleanup.push(() => clearTimeout(id))
    return id
  }
  const repeat = (fn, ms) => {
    const id = setInterval(fn, ms)
    cleanup.push(() => clearInterval(id))
    return id
  }
  const animate = (fn) => {
    let frame
    const tick = (time) => {
      if (disposed) return
      fn(time)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    cleanup.push(() => cancelAnimationFrame(frame))
  }
  const notify = (title, message) => {
    const toast = document.getElementById('achievement-toast')
    const lines = document.getElementById('toast-message')?.children
    if (!toast || !lines) return
    lines[0].textContent = title
    lines[1].textContent = message
    toast.classList.add('show')
    later(() => toast.classList.remove('show'), 4000)
  }
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      notify('Achievement Unlocked', 'Protocol Established (Email Copied)')
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  onMounted(async () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = matchMedia('(pointer: fine)').matches
    const loader = document.getElementById('loader')
    // Never let a failed animation import trap the user behind the loader.
    const safety = later(() => { loader.style.display = 'none' }, 4500)
    try {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import('gsap'), import('gsap/ScrollTrigger'), import('lenis')
      ])
      if (disposed) return
      gsap.registerPlugin(ScrollTrigger)
      const context = gsap.context(() => {})
      cleanup.push(() => context.revert())
      const tween = (target, options) => context.add(() => gsap.to(target, options))
      const lenis = reduced ? null : new Lenis({ duration: 1.2, anchors: true })
      if (lenis) {
        lenis.on('scroll', ScrollTrigger.update)
        animate(time => lenis.raf(time))
        cleanup.push(() => lenis.destroy())
      }
      let progress = 0
      const boot = repeat(() => {
        progress = Math.min(100, progress + 7)
        document.getElementById('loader-text').textContent = `${progress}%`
        document.getElementById('loader-bar').style.width = `${progress}%`
        document.getElementById('loader-logs').textContent = ['INITIALIZING KERNEL...', 'LOADING ASSETS...', 'DECRYPTING DATA...', 'OPTIMIZING MESHES...', 'SYSTEM READY'][Math.min(4, Math.floor(progress / 25))]
        if (progress === 100) {
          clearInterval(boot)
          clearTimeout(safety)
          tween(loader, { yPercent: -100, duration: reduced ? 0 : .8, ease: 'power4.inOut', onComplete: () => { loader.style.display = 'none'; ScrollTrigger.refresh() } })
        }
      }, reduced ? 1 : 35)

      let lastScroll = 0
      let menuOpen = false
      const nav = document.getElementById('navbar')
      const menu = document.getElementById('mobile-menu-overlay')
      const menuButton = document.getElementById('menu-btn')
      const menuLinks = [...menu.querySelectorAll('a')]
      const setMenu = (open) => {
        menuOpen = open
        menu.classList.toggle('open', open)
        menuButton.innerHTML = `<i class="fas fa-${open ? 'times' : 'bars'}" aria-hidden="true"></i>`
        menuButton.setAttribute('aria-expanded', String(open))
        document.body.style.overflow = open ? 'hidden' : ''
        if (open) { lenis?.stop(); menuLinks[0]?.focus() } else { lenis?.start() }
      }
      on(menuButton, 'click', () => setMenu(!menuOpen))
      menuLinks.forEach(link => on(link, 'click', () => setMenu(false)))
      on(document, 'keydown', event => {
        if (!menuOpen) return
        if (event.key === 'Escape') { setMenu(false); menuButton.focus() }
        if (event.key === 'Tab') {
          const controls = [...menuLinks, menuButton]
          const index = controls.indexOf(document.activeElement)
          event.preventDefault()
          controls[(index + (event.shiftKey ? controls.length - 1 : 1)) % controls.length].focus()
        }
      })
      on(window, 'resize', () => { if (window.innerWidth >= 768 && menuOpen) setMenu(false) })
      const updateScroll = () => {
        const y = window.scrollY
        nav.style.transform = y > lastScroll && y > 100 && !menuOpen ? 'translateY(-100%)' : 'translateY(0)'
        lastScroll = y
        const max = document.documentElement.scrollHeight - window.innerHeight
        const fraction = max > 0 ? Math.min(1, y / max) : 0
        document.getElementById('scroll-percent').textContent = Math.round(fraction * 100)
        document.getElementById('progress-circle').style.strokeDashoffset = String(283 * (1 - fraction))
        document.getElementById('back-to-top').classList.toggle('visible', y > 500)
      }
      on(window, 'scroll', updateScroll, { passive: true })
      updateScroll()
      const recall = () => lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
      on(document.getElementById('back-to-top'), 'click', recall)
      on(document.getElementById('back-to-top'), 'keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); recall() } })
      const updateTime = () => {
        const time = new Date().toLocaleTimeString('en-GB', { timeZone: profile.timezone })
        document.getElementById('time-display').textContent = `${time} ${profile.timezoneLabel}`
        document.getElementById('log-time').textContent = time
      }
      updateTime()
      repeat(updateTime, 1000)

      const contextMenu = document.getElementById('custom-context-menu')
      on(document, 'contextmenu', event => {
        if (!finePointer || event.target.closest('input,textarea,a')) return
        event.preventDefault()
        contextMenu.style.display = 'block'
        contextMenu.style.left = `${Math.max(0, Math.min(event.clientX, innerWidth - contextMenu.offsetWidth))}px`
        contextMenu.style.top = `${Math.max(0, Math.min(event.clientY, innerHeight - contextMenu.offsetHeight))}px`
      })
      on(document, 'click', event => {
        contextMenu.style.display = 'none'
        if (reduced) return
        const ripple = document.createElement('div')
        ripple.className = 'click-ripple'
        ripple.style.left = `${event.clientX}px`
        ripple.style.top = `${event.clientY}px`
        document.body.append(ripple)
        later(() => ripple.remove(), 800)
      })
      on(document, 'keydown', event => { if (event.key === 'Escape') contextMenu.style.display = 'none' })
      const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
      let codeIndex = 0
      on(document, 'keydown', event => {
        if (event.target.closest('input,textarea')) return
        codeIndex = event.key === code[codeIndex] ? codeIndex + 1 : 0
        if (codeIndex === code.length) {
          codeIndex = 0
          document.body.classList.toggle('god-mode')
          notify('CHEAT CODE ACTIVATED', 'GOD MODE TOGGLED')
        }
      })
      if (finePointer && !reduced) {
        const dot = document.getElementById('cursor-dot')
        const outline = document.getElementById('cursor-outline')
        on(window, 'mousemove', e => {
          dot.style.left = outline.style.left = `${e.clientX}px`
          dot.style.top = outline.style.top = `${e.clientY}px`
          document.getElementById('log-coords').textContent = `${e.clientX}, ${e.clientY}`
        })
        on(document, 'mouseover', e => {
          document.body.classList.toggle('hovering', !!e.target.closest('a,button,.hover-trigger'))
          document.body.classList.toggle('view-project', !!e.target.closest('.project-trigger'))
        })
        const magnetic = document.getElementById('magnetic-btn')
        on(magnetic, 'mousemove', e => {
          const rect = magnetic.getBoundingClientRect()
          tween(magnetic, { x: (e.clientX - rect.left - rect.width / 2) * .3, y: (e.clientY - rect.top - rect.height / 2) * .3, duration: .3, overwrite: true })
        })
        on(magnetic, 'mouseleave', () => tween(magnetic, { x: 0, y: 0, duration: .5 }))
      }
      if (!reduced) {
        const media = gsap.matchMedia()
        media.add('(min-width: 769px)', () => {
          document.querySelectorAll('.project-card-stack').forEach(card => {
            gsap.to(card, { scale: .9, opacity: .3, scrollTrigger: { trigger: card, start: 'top 15%', end: 'bottom 15%', scrub: true } })
          })
        })
        cleanup.push(() => media.revert())
        document.querySelectorAll('.scramble-text').forEach(el => {
          let timer
          const original = el.dataset.value
          on(el, 'mouseenter', () => {
            clearInterval(timer)
            let iteration = 0
            timer = repeat(() => {
              el.textContent = original.split('').map((char, index) => index < iteration ? char : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('')
              iteration += .5
              if (iteration >= original.length) { el.textContent = original; clearInterval(timer) }
            }, 30)
          })
        })
      }
      initSphere(reduced)
      if (!reduced) { initGrid(); initMatrix() }
      const observer = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const { default: Matter } = await import('matter-js')
        if (!disposed) initPhysics(Matter)
      }, { rootMargin: '200px' })
      observer.observe(document.getElementById('physics-canvas'))
      cleanup.push(() => observer.disconnect())
    } catch (error) {
      loader.style.display = 'none'
      document.body.style.cursor = 'auto'
      console.error('Portfolio effects could not initialize:', error)
    }
  })

  function initSphere(reduced) {
    const container = document.querySelector('.tagcloud')
    const labels = profile.sphere
    container.setAttribute('aria-label', `Skills: ${labels.join(', ')}`)
    const points = labels.map((label, i) => {
      const node = document.createElement('span')
      node.className = 'tagcloud-item'
      node.textContent = label
      container.append(node)
      const y = 1 - (i / (labels.length - 1)) * 2
      const theta = i * Math.PI * (3 - Math.sqrt(5))
      return { node, x: Math.cos(theta) * Math.sqrt(1 - y * y), y, z: Math.sin(theta) * Math.sqrt(1 - y * y) }
    })
    let angle = .4
    let speed = .003
    on(container, 'pointermove', e => { speed = (e.clientX - container.getBoundingClientRect().left - container.clientWidth / 2) * .00003 })
    on(container, 'pointerleave', () => { speed = .003 })
    const draw = () => {
      const radius = Math.min(container.clientWidth / 2 - 50, container.clientHeight / 2 - 10)
      if (!reduced && !document.hidden) angle += speed
      points.forEach(({ node, x, y, z }) => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle)
        const rz = x * Math.sin(angle) + z * Math.cos(angle)
        const scale = (rz + 2) / 2.4
        node.style.transform = `translate(-50%, -50%) translate(${rx * radius}px, ${y * radius}px) scale(${scale})`
        node.style.opacity = String((rz + 1.5) / 2.5)
        node.style.color = rz > .5 ? '#d4ff00' : '#9ca3af'
      })
    }
    draw()
    if (!reduced) animate(draw)
    on(window, 'resize', draw)
    cleanup.push(() => points.forEach(point => point.node.remove()))
  }

  function initGrid() {
    const canvas = document.getElementById('hero-grid')
    const ctx = canvas.getContext('2d')
    let mouseX = -500, mouseY = -500
    const resize = () => { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight }
    resize()
    on(window, 'resize', resize)
    on(window, 'pointermove', e => { mouseX = e.clientX; mouseY = e.clientY })
    animate(() => {
      if (document.hidden || window.scrollY > canvas.height) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
          const distance = Math.hypot(x - mouseX, y - mouseY)
          const force = Math.max(0, (200 - distance) / 200)
          const angle = Math.atan2(y - mouseY, x - mouseX)
          ctx.fillStyle = force > 0 ? `rgba(212,255,0,${.15 + force * .8})` : '#333'
          ctx.fillRect(x + Math.cos(angle) * force * 20, y + Math.sin(angle) * force * 20, 2, 2)
        }
      }
    })
  }

  function initMatrix() {
    const canvas = document.getElementById('algo-canvas')
    const ctx = canvas.getContext('2d')
    let drops = []
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = canvas.parentElement.clientHeight
      drops = Array(Math.ceil(canvas.width / 12)).fill(1)
    }
    resize()
    on(window, 'resize', resize)
    repeat(() => {
      const rect = canvas.getBoundingClientRect()
      if (document.hidden || rect.bottom < 0 || rect.top > innerHeight) return
      ctx.fillStyle = 'rgba(10,10,10,.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#d4ff00'
      ctx.font = '12px monospace'
      drops.forEach((drop, i) => {
        ctx.fillText('010101XYZ_'[Math.floor(Math.random() * 10)], i * 12, drop * 12)
        drops[i] = drop * 12 > canvas.height && Math.random() > .975 ? 0 : drop + 1
      })
    }, 60)
  }

  function initPhysics(Matter) {
    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter
    const container = document.getElementById('physics-canvas')
    const engine = Engine.create({ enableSleeping: true })
    const render = Render.create({ element: container, engine, options: { width: container.clientWidth, height: container.clientHeight, background: '#111', wireframes: false } })
    const runner = Runner.create()
    const mouse = Mouse.create(render.canvas)
    // Preserve page scrolling while keeping mouse dragging within the playground.
    render.canvas.removeEventListener('wheel', mouse.mousewheel)
    render.canvas.removeEventListener('mousewheel', mouse.mousewheel)
    render.canvas.removeEventListener('DOMMouseScroll', mouse.mousewheel)
    const constraint = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, render: { visible: false } } })
    const skills = profile.physicsSkills
    const box = label => Bodies.rectangle(70 + Math.random() * Math.max(1, container.clientWidth - 140), 30 + Math.random() * 100, 120, 60, { label, restitution: .8, friction: .005, render: { fillStyle: '#d4ff00', strokeStyle: '#fff', lineWidth: 2 } })
    const reset = () => {
      Composite.clear(engine.world, false)
      const w = container.clientWidth, h = container.clientHeight
      render.canvas.width = render.options.width = w
      render.canvas.height = render.options.height = h
      const options = { isStatic: true, render: { fillStyle: '#333' } }
      Composite.add(engine.world, [Bodies.rectangle(w / 2, h + 30, w, 60, options), Bodies.rectangle(-30, h / 2, 60, h * 2, options), Bodies.rectangle(w + 30, h / 2, 60, h * 2, options), Bodies.rectangle(w / 2, -50, w, 60, options), constraint, ...skills.map(box)])
    }
    reset()
    Render.run(render)
    Runner.run(runner, engine)
    on(document.getElementById('phy-add'), 'click', () => {
      if (Composite.allBodies(engine.world).length < 44) Composite.add(engine.world, box(skills[Math.floor(Math.random() * skills.length)]))
    })
    on(document.getElementById('phy-restart'), 'click', reset)
    on(document.getElementById('phy-gravity'), 'click', event => {
      engine.gravity.y = engine.gravity.y ? 0 : 1
      event.currentTarget.textContent = `GRAVITY: ${engine.gravity.y ? 'ON' : 'OFF'}`
      event.currentTarget.setAttribute('aria-pressed', String(!engine.gravity.y))
      Composite.allBodies(engine.world).forEach(body => Matter.Sleeping.set(body, false))
    })
    let resizeTimer
    on(window, 'resize', () => { clearTimeout(resizeTimer); resizeTimer = later(reset, 250) })
    const label = () => {
      const ctx = render.context
      ctx.font = "bold 14px 'Space Grotesk'"
      ctx.fillStyle = '#000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      Composite.allBodies(engine.world).filter(body => !body.isStatic).forEach(body => {
        ctx.save(); ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle); ctx.fillText(body.label, 0, 0); ctx.restore()
      })
    }
    Events.on(render, 'afterRender', label)
    const visibility = new IntersectionObserver(([entry]) => { runner.enabled = entry.isIntersecting && !document.hidden })
    visibility.observe(container)
    on(document, 'visibilitychange', () => { runner.enabled = !document.hidden && container.getBoundingClientRect().bottom > 0 && container.getBoundingClientRect().top < innerHeight })
    cleanup.push(() => {
      visibility.disconnect()
      Events.off(render, 'afterRender', label)
      Runner.stop(runner); Render.stop(render)
      Mouse.clearSourceEvents(mouse)
      Composite.clear(engine.world, false); Engine.clear(engine)
      render.canvas.remove()
    })
  }

  onBeforeUnmount(() => {
    disposed = true
    cleanup.reverse().forEach(fn => fn())
    document.body.style.overflow = ''
    document.body.classList.remove('god-mode', 'hovering', 'view-project')
    document.querySelectorAll('.click-ripple').forEach(node => node.remove())
  })
  return { copyEmail }
}
