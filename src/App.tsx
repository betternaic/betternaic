import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Route, Routes } from 'react-router';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Home from './pages/Home';

const Services = lazy(() => import('./pages/Services'));
const ServiceDocument = lazy(() => import('./pages/Document').then(m => ({ default: m.ServiceDocument })));
const StaticPage = lazy(() => import('./pages/Document').then(m => ({ default: m.StaticPage })));
const GovernmentHub = lazy(() => import('./pages/Government').then(m => ({ default: m.GovernmentHub })));
const Officials = lazy(() => import('./pages/Government').then(m => ({ default: m.Officials })));
const Offices = lazy(() => import('./pages/Government').then(m => ({ default: m.Offices })));
const Barangays = lazy(() => import('./pages/Government').then(m => ({ default: m.Barangays })));
const Statistics = lazy(() => import('./pages/Statistics'));
const Transparency = lazy(() => import('./pages/Transparency'));
const Tourism = lazy(() => import('./pages/Tourism'));
const About = lazy(() => import('./pages/About'));
const Emergency = lazy(() => import('./pages/Emergency'));
const Report = lazy(() => import('./pages/Report'));
const Admin = lazy(() => import('./pages/Admin'));
const Search = lazy(() => import('./pages/Search'));
const Sitemap = lazy(() => import('./pages/Sitemap'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <ScrollToTop />
          <main id="main" className="flex-grow" tabIndex={-1}>
            <Suspense fallback={<div className="min-h-[50vh]" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:category" element={<Services />} />
                <Route path="/services/:category/:documentSlug" element={<ServiceDocument />} />
                <Route path="/government" element={<GovernmentHub />} />
                <Route path="/government/officials" element={<Officials />} />
                <Route path="/government/offices" element={<Offices />} />
                <Route path="/government/barangays" element={<Barangays />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/transparency" element={<Transparency />} />
                <Route path="/tourism" element={<Tourism />} />
                <Route path="/about" element={<About />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/report" element={<Report />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/search" element={<Search />} />
                <Route path="/sitemap" element={<Sitemap />} />
                {['about-betternaic', 'accessibility', 'privacy', 'terms'].map(slug => (
                  <Route key={slug} path={`/${slug}`} element={<StaticPage slug={slug} />} />
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
}
