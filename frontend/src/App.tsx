import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import History from './pages/History';
import Approvals from './pages/Approvals';
import Users from './pages/Users';
import Vendors from './pages/Vendors';
import Budget from './pages/Budget';
import BudgetFundSources from './pages/BudgetFundSources';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/new" element={<NewRequest />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/users" element={<Users />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/budget/:budgetId/funds" element={<BudgetFundSources />} />
          </Route>

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

