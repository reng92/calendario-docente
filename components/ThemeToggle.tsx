'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded-full text-sm leading-none"
      title={dark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
