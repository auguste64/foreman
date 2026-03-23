'use client'

import { useEffect } from 'react'

export default function LandingAnimations() {
  useEffect(() => {
    const wrapper = document.querySelector('.lp-wrapper') as Element

    // ── Scroll reveal (.reveal)
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('on') }),
      { threshold: 0.1, root: wrapper }
    )
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el))

    // ── CSS animations (.anim)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    document.querySelectorAll('.anim').forEach(el => observer.observe(el))

    // ── Button ripple
    const handlers: Array<{ el: Element; fn: (e: Event) => void }> = []
    document.querySelectorAll('.btn').forEach((btn) => {
      const fn = (e: Event) => {
        const me = e as MouseEvent
        const rect = btn.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height) * 2
        const ripple = document.createElement('span')
        ripple.classList.add('ripple')
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${me.clientX - rect.left - size / 2}px;top:${me.clientY - rect.top - size / 2}px;`
        btn.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
      }
      btn.addEventListener('click', fn)
      handlers.push({ el: btn, fn })
    })

    return () => {
      obs.disconnect()
      observer.disconnect()
      handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn))
    }
  }, [])

  return null
}
