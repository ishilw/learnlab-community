import { useEffect, type ReactNode } from 'react'
import { Layout } from './components/Layout'
import { InstructorCoursePage } from './instructor/InstructorCoursePage'
import { InstructorHomePage } from './instructor/InstructorHomePage'
import { QuizAuthoringPage } from './instructor/QuizAuthoringPage'
import { CatalogPage } from './pages/CatalogPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { LearnPage } from './pages/LearnPage'
import { LoginPage } from './pages/LoginPage'
import { MyCoursesPage } from './pages/MyCoursesPage'
import { QuizPage } from './pages/QuizPage'
import { navigate, routeId, useHashRoute, type Route, type RouteName } from './router'
import { useSession } from './session'

function HomeRedirect() {
  const { session } = useSession()
  const target = session?.role === 'learner' ? '/catalog' : '/instructor'
  useEffect(() => navigate(target), [target])
  return <p role="status">Redirecting…</p>
}

function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>That address does not match any LearnLab page.</p>
    </section>
  )
}

const PAGES: Record<RouteName, (route: Route) => ReactNode> = {
  home: () => <HomeRedirect />,
  login: () => <LoginPage />,
  catalog: () => <CatalogPage />,
  'my-courses': () => <MyCoursesPage />,
  course: (route) => <CourseDetailPage courseId={routeId(route, 'courseId')} />,
  learn: (route) => <LearnPage courseId={routeId(route, 'courseId')} />,
  quiz: (route) => <QuizPage quizId={routeId(route, 'quizId')} />,
  instructor: () => <InstructorHomePage />,
  'instructor-course': (route) => <InstructorCoursePage courseId={routeId(route, 'courseId')} />,
  'instructor-quiz': (route) => <QuizAuthoringPage quizId={routeId(route, 'quizId')} />,
  'not-found': () => <NotFound />,
}

export function App() {
  const { session } = useSession()
  const route = useHashRoute()
  // The key remounts a page when its parameters change, so no state leaks between courses.
  const key = `${route.name}:${JSON.stringify(route.params)}`
  return <Layout>{session ? <div key={key}>{PAGES[route.name](route)}</div> : <LoginPage />}</Layout>
}
