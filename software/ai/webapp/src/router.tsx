import { createBrowserRouter } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Dashboard } from "@/pages/Dashboard";
import { Wallets } from "@/pages/Wallets";
import { Agents } from "@/pages/Agents";
import { Policies } from "@/pages/Policies";
import { Payments } from "@/pages/Payments";
import { Settings } from "@/pages/Settings";

export const router = createBrowserRouter([
  {
    element: <PageContainer />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/wallets", element: <Wallets /> },
      { path: "/agents", element: <Agents /> },
      { path: "/policies", element: <Policies /> },
      { path: "/payments", element: <Payments /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);
