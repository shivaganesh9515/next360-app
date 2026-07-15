import { createNavigationContainerRef } from '@react-navigation/native';

// CartSheetProvider (and any other root-level provider) is mounted above
// <AppNavigator/>, outside every actual Stack/Tab Navigator's React tree —
// useNavigation() only works inside a Navigator's context, not just anywhere
// under NavigationContainer, so navigating from a root provider needs this
// ref instead, attached via <NavigationContainer ref={navigationRef}> in App.tsx.
export const navigationRef = createNavigationContainerRef<any>();
