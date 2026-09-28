import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="models" element={<PlaceholderPage eyebrow="Roster" title="Models" />} />
          <Route path="models/:slug" element={<PlaceholderPage eyebrow="Roster" title="Model profile" />} />
          <Route path="campaigns" element={<PlaceholderPage eyebrow="Work" title="Campaigns" />} />
          <Route path="campaigns/:slug" element={<PlaceholderPage eyebrow="Work" title="Campaign" />} />
          <Route path="proof" element={<PlaceholderPage eyebrow="Consistency" title="Proof" />} />
          <Route path="about" element={<PlaceholderPage eyebrow="CyberChic" title="About" />} />
          <Route path="brief" element={<PlaceholderPage eyebrow="Licensing" title="Start a brief" />} />
          <Route path="*" element={<PlaceholderPage eyebrow="404" title="Page not found" body="There's nothing at this address." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
