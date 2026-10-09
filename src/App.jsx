import { Navigate, NavLink, Route, Routes, Link } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Loading } from "./components/ui.jsx";
import Auth from "./pages/Auth.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Search from "./pages/Search.jsx";
import OpportunityDetail from "./pages/OpportunityDetail.jsx";
import Saved from "./pages/Saved.jsx";
import Applications from "./pages/Applications.jsx";
import Compare from "./pages/Compare.jsx";
import GpaCalculator from "./pages/GpaCalculator.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Billing from "./pages/Billing.jsx";
import Admin from "./pages/Admin.jsx";

const NAV = [["/", "For you"], ["/search", "Programs & scholarships"], ["/saved", "Saved"], ["/applications", "Applications"], ["/gpa", "GPA calculator"], ["/profile", "Profile"], ["/notifications", "Alerts"]];

function Shell({ children }) {
  const { me, signOut } = useAuth();
  return (
    <>
      <header className="bar">
        <Link to="/" className="logo">ScholarPath</Link>
        <nav>{NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>)}
          {me?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}</nav>
        <Link to="/billing" className="badge neutral" style={{ textDecoration: "none" }}>{me?.plan?.startsWith("premium") ? "Premium" : "Free"}</Link>
        <button onClick={signOut}>Sign out</button>
      </header>
      <main>{children}</main>
    </>
  );
}

export default function App() {
  const { me, ready } = useAuth();
  if (!ready) return <main><Loading /></main>;
  if (!me) return <Routes><Route path="/register" element={<Auth mode="register" />} /><Route path="*" element={<Auth mode="login" />} /></Routes>;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/search" element={<Search />} />
        <Route path="/opportunity/:id" element={<OpportunityDetail />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/gpa" element={<GpaCalculator />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/admin" element={me.role === "admin" ? <Admin /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Shell>
  );
}
