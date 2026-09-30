import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AboutPage } from './pages/AboutPage'
import { BriefPage } from './pages/BriefPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { HomePage } from './pages/HomePage'
import { ModelProfilePage } from './pages/ModelProfilePage'
import { ModelsPage } from './pages/ModelsPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProofPage } from './pages/ProofPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="models/:slug" element={<ModelProfilePage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/:slug" element={<PlaceholderPage eyebrow="Work" title="Campaign" />} />
          <Route path="proof" element={<ProofPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="brief" element={<BriefPage />} />
          <Route path="*" element={<PlaceholderPage eyebrow="404" title="Page not found" body="There's nothing at this address." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
