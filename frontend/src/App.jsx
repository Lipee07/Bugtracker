import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./Dashboard";
import Account from "./pages/Account";

function App() {
return ( <Routes>
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/account" element={<Account />} />
<Route path="*" element={<Navigate to="/" replace />} /> </Routes>
);
}

export default App;
