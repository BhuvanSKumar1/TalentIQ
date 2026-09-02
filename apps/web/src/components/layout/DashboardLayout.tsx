import { Outlet, useOutletContext } from 'react-router-dom';

interface LayoutContext {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenMobileNav: () => void;
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}

export function DashboardLayout() {
  return <Outlet />;
}
