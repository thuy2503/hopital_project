import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterPatient from './pages/RegisterPatient';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import Records from './pages/Records';
import Drugs from './pages/Drugs';
import Invoices from './pages/Invoices';
import SearchPage from './pages/Search';
import DoctorSettings from './pages/DoctorSettings';
import Reports from './pages/Reports';
import Blog from './pages/Blog';
import Subscriptions from './pages/Subscriptions';
import Chat from './pages/Chat';
import LabTests from './pages/LabTests';
import Contact from './pages/Contact';
import About from './pages/About';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-patient" element={<RegisterPatient />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="records" element={<Records />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="drugs" element={<Drugs />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<DoctorSettings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="blog" element={<Blog />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="labtests" element={<LabTests />} />
            <Route path="chat" element={<Chat />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
