import React, {createContext, useContext, useState} from 'react';

const TabBarContext = createContext();

export function TabBarProvider({children}) {
  const [tabBarVisible, setTabBarVisible] = useState(true);

  return (
    <TabBarContext.Provider value={{tabBarVisible, setTabBarVisible}}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within TabBarProvider');
  }
  return context;
}
