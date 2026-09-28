import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { ModelProfilePage } from './pages/ModelProfilePage'
import { ModelsPage } from './pages/ModelsPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="models/:slug" element={<ModelProfilePage />} />
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
