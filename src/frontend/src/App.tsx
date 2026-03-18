import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SessionDetail from "./pages/SessionDetail";
import SessionForm from "./pages/SessionForm";
import SessionsList from "./pages/SessionsList";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const rootRoute = createRootRoute({
  component: () => <Layout />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions",
  component: SessionsList,
});

const sessionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$id",
  component: SessionDetail,
});

const sessionNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/new",
  component: SessionForm,
});

const sessionEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$id/edit",
  component: SessionForm,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  sessionsRoute,
  sessionNewRoute,
  sessionDetailRoute,
  sessionEditRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}
