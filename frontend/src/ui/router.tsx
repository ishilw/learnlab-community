import { useEffect, useState, type ReactNode } from 'react'

export type RouteName =
  | 'home'
  | 'login'
  | 'catalog'
  | 'my-courses'
  | 'course'
  | 'learn'
  | 'quiz'
  | 'instructor'
  | 'instructor-course'
  | 'instructor-quiz'
  | 'not-found'

export interface Route {
  name: RouteName
  params: Record<string, string>
}

type RoutePattern = [RouteName, RegExp, string[]]

const ROUTES: RoutePattern[] = [
  ['home', /^\/?$/, []],
  ['login', /^\/login$/, []],
  ['catalog', /^\/catalog$/, []],
  ['my-courses', /^\/my-courses$/, []],
  ['course', /^\/courses\/(\d+)$/, ['courseId']],
  ['learn', /^\/courses\/(\d+)\/learn$/, ['courseId']],
  ['quiz', /^\/quizzes\/(\d+)$/, ['quizId']],
  ['instructor', /^\/instructor$/, []],
  ['instructor-course', /^\/instructor\/courses\/(\d+)$/, ['courseId']],
  ['instructor-quiz', /^\/instructor\/quizzes\/(\d+)$/, ['quizId']],
]

/** Maps a location hash such as "#/courses/3" to a route name and its parameters. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  for (const [name, pattern, keys] of ROUTES) {
    const match = pattern.exec(path)
    if (match) {
      return { name, params: Object.fromEntries(keys.map((key, index) => [key, match[index + 1]])) }
    }
  }
  return { name: 'not-found', params: {} }
}

export function routeId(route: Route, key: string): number {
  return Number(route.params[key])
}

export function navigate(path: string): void {
  window.location.hash = path
}

export function useHashRoute(): Route {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parseHash(hash)
}

interface LinkProps {
  to: string
  children: ReactNode
  className?: string
}

export function Link({ to, children, className }: LinkProps) {
  return (
    <a href={`#${to}`} className={className}>
      {children}
    </a>
  )
}
