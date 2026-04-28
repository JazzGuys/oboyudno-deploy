import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { NewDeal } from "./pages/NewDeal";
import { DealDetail } from "./pages/DealDetail";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "auth", Component: Auth },
      { path: "dashboard", Component: Dashboard },
      { path: "profile", Component: Profile },
      { path: "profile/:username", Component: Profile },
      { path: "deal/new", Component: NewDeal },
      { path: "deal/:id", Component: DealDetail },
    ],
  },
]);
