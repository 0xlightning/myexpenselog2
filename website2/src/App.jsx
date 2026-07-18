
import { Route, Routes } from 'react-router-dom';
import { AuthGate } from './features/auth/AuthGate';
import { LoginPage } from './features/auth/LoginPage';
import { RecordPage } from './features/records/RecordPage';
import { Dashboard } from './features/dashboard/Dashboard';
import { ErrorToast } from './components/ErrorToast';
import { OnlineStatusBridge } from './components/OnlineStatusBridge';
import { AppShell } from './components/AppShell';

function App() {
  return (
    <>
      <OnlineStatusBridge />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <AuthGate>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/income" element={<RecordPage kind="income" />} />
                  <Route
                    path="/expenditure"
                    element={<RecordPage kind="expenditure" />}
                  />
                  <Route
                    path="/investments"
                    element={<RecordPage kind="investment" />}
                  />
                </Routes>
              </AppShell>
            </AuthGate>
          }
        />
      </Routes>
      <ErrorToast />
    </>
  );
}

export default App;