import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

export interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const STORAGE_KEY_USER_ID = 'mars_mission_user_id';
const STORAGE_KEY_USER_ROLE = 'mars_mission_user_role';
const STORAGE_KEY_USER_NAME = 'mars_mission_user_name';

function generateInitialUserId(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_USER_ID);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
  }

  // Generate a robust unique ID with commander prefix
  let newId = '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    newId = `CMD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  } else {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const time = Date.now().toString(36).slice(-4).toUpperCase();
    newId = `CMD-${time}-${rand}`;
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_USER_ID, newId);
    } catch (_) {}
  }
  return newId;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserIdState] = useState<string>(() => generateInitialUserId());
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_USER_ROLE);
      if (saved === 'MISSION_CONTROL' || saved === 'ASTRONAUT_HUD') return saved;
    }
    return 'MISSION_CONTROL';
  });
  const [userName, setUserNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_USER_NAME);
      if (saved) return saved;
    }
    return 'Commander Ares';
  });

  const setUserId = (id: string) => {
    setUserIdState(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_USER_ID, id);
      } catch (_) {}
    }
  };

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_USER_ROLE, role);
      } catch (_) {}
    }
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_USER_NAME, name);
      } catch (_) {}
    }
  };

  // Sync to localStorage if state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_USER_ID, userId);
      } catch (_) {}
    }
  }, [userId]);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userRole,
        setUserRole,
        userName,
        setUserName
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    // Fallback if rendered outside provider to avoid crashes
    return {
      userId: generateInitialUserId(),
      setUserId: () => {},
      userRole: 'MISSION_CONTROL',
      setUserRole: () => {},
      userName: 'Commander Ares',
      setUserName: () => {}
    };
  }
  return context;
}
