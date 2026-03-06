import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

const DRAWER_NAVIGATOR_ID = 'Drawer';

type NavLike = {
  openDrawer?: () => void;
  getParent?: (id?: string) => NavLike | undefined;
  dispatch?: (action: unknown) => void;
};

/**
 * Returns a function that safely opens the drawer.
 * 1) Uses navigation.openDrawer() when the drawer adds it to nested screens.
 * 2) Otherwise gets the drawer by id via getParent(DRAWER_NAVIGATOR_ID).
 * 3) Otherwise tries immediate parent getParent() for nested (tabs/heal-well) screens.
 * 4) Otherwise dispatches on self for direct drawer screens (mood, journal, etc.).
 */
export function useOpenDrawer(): () => void {
  const navigation = useNavigation();
  return () => {
    try {
      const nav = navigation as NavLike;
      if (typeof nav?.openDrawer === 'function') {
        nav.openDrawer();
        return;
      }
      // Nested (tabs/heal-well): get drawer by id and dispatch
      const drawerById = nav?.getParent?.(DRAWER_NAVIGATOR_ID);
      if (drawerById?.dispatch) {
        drawerById.dispatch(DrawerActions.openDrawer());
        return;
      }
      // Direct drawer screens (mood, journal, etc.): nav is the drawer – dispatch on self
      nav?.dispatch?.(DrawerActions.openDrawer());
    } catch (_) {
      // no-op
    }
  };
}
