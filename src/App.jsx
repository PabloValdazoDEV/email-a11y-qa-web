import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { AdminRoute } from "./routes/AdminRoute.jsx";
import { PrivateRoute } from "./routes/PrivateRoute.jsx";
import { PublicRoute } from "./routes/PublicRoute.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { ForgotPassword } from "./pages/ForgotPassword.jsx";
import { Login } from "./pages/Login.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { PasswordChangeRequired } from "./pages/PasswordChangeRequired.jsx";
import { Profile } from "./pages/Profile.jsx";
import { ResetPassword } from "./pages/ResetPassword.jsx";
import { UsersAdmin } from "./pages/UsersAdmin.jsx";
import { VerifyEmail } from "./pages/VerifyEmail.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<PrivateRoute />}>
        <Route path="/password-change-required" element={<PasswordChangeRequired />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<UsersAdmin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
