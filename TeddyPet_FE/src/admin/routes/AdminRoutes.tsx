import { LoginPage } from "@/client/pages/register-login/Login";
import { RouteObject } from "react-router-dom";
import { Dashboard } from "../features/dashboard";


export const AdminRoutes: RouteObject[] = [
    { path: "/", element: <Dashboard /> },
];

export const AuthAdminRoutes = [
    { path: "login", element: <LoginPage /> },
];