import { HashRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AdminDashboard from './pages/AdminDashboard';
import CreatePostPage from './pages/CreatePostPage';
import DglDashboard from './pages/DglDashboard';
import GroupPage from './pages/GroupPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PendingPage from './pages/PendingPage';
import PollsPage from './pages/PollsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import TalkDetailPage from './pages/TalkDetailPage';
import TalksPage from './pages/TalksPage';

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pending" element={<ProtectedRoute allowPending><PendingPage /></ProtectedRoute>} />

            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<HomePage />} />
              <Route path="talks" element={<TalksPage />} />
              <Route path="talks/:talkId" element={<TalkDetailPage />} />
              <Route path="create" element={<CreatePostPage />} />
              <Route path="group" element={<GroupPage />} />
              <Route path="polls" element={<PollsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="dgl" element={<ProtectedRoute roles={['dgl']}><DglDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </DataProvider>
    </HashRouter>
  );
}
