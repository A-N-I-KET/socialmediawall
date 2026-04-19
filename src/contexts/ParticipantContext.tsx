import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ParticipantContextType {
  participantEmail: string | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const ParticipantContext = createContext<ParticipantContextType>({
  participantEmail: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export const useParticipant = () => useContext(ParticipantContext);

export const ParticipantProvider = ({ children }: { children: ReactNode }) => {
  const [participantEmail, setParticipantEmail] = useState<string | null>(() => {
    return localStorage.getItem('participantEmail');
  });

  const login = (email: string) => {
    const normalized = email.toLowerCase();
    setParticipantEmail(normalized);
    localStorage.setItem('participantEmail', normalized);
  };

  const logout = () => {
    setParticipantEmail(null);
    localStorage.removeItem('participantEmail');
  };

  return (
    <ParticipantContext.Provider
      value={{
        participantEmail,
        isLoggedIn: !!participantEmail,
        login,
        logout,
      }}
    >
      {children}
    </ParticipantContext.Provider>
  );
};
