import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Planner } from './components/Planner';
import { ReelsGenerator } from './components/ReelsGenerator'; // New Import
import { CalendarPlanner } from './components/CalendarPlanner';
import { ContentGenerator } from './components/ContentGenerator';
import { ApprovalQueue } from './components/ApprovalQueue';
import { SystemBlueprint } from './components/SystemBlueprint';
import { PersonaEditor } from './components/PersonaEditor';
import { BrandManager } from './components/BrandManager';
import { LearningHub } from './components/LearningHub';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { InfluencerSelector } from './components/InfluencerSelector';
import { Persona, Post, QuarterlyPlan, Influencer, Brand, StrategyCard } from './types';
import { initialPersona } from './constants';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { database, localStorageGuard } from './services/storage';

const USERS_STORAGE_KEY = 'ai_influencer_users_v1';
const SESSION_KEY = 'ai_influencer_session_v1';

// SAFE LOCAL STORAGE WRAPPER WITH GUARDS
const localStorageProxy = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set: (key: string, value: string): boolean => {
    try {
      // ENFORCE LIMIT BEFORE WRITING
      localStorageGuard.enforceLimit(key, value);
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  remove: (key: string) => localStorage.removeItem(key)
};

// ... [Session Interfaces remain the same] ...
interface SessionData {
  token: string;
  username: string;
  expiresAt: number;
}

interface StorageAlertProps {
    message: string | null;
    onClose: () => void;
}

const StorageAlert: React.FC<StorageAlertProps> = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed bottom-4 right-4 max-w-sm bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-lg flex items-start space-x-3 z-50 animate-in slide-in-from-bottom-5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div className="flex-1 text-sm">
                <p className="font-bold">Storage Warning</p>
                <p>{message}</p>
            </div>
            <button onClick={onClose} className="text-red-500 hover:text-red-700 font-bold text-xs">DISMISS</button>
        </div>
    );
}

const mergePersona = (base: Persona, saved: Partial<Persona>): Persona => {
  return {
    ...base,
    ...saved,
    visualAttributes: { ...base.visualAttributes, ...(saved.visualAttributes || {}) },
    personalityTraits: saved.personalityTraits || base.personalityTraits,
    dos: saved.dos || base.dos,
    donts: saved.donts || base.donts,
    visualIdentityInitialized: saved.visualIdentityInitialized ?? base.visualIdentityInitialized,
    visualReferenceImages: saved.visualReferenceImages || base.visualReferenceImages,
    faceDescriptorBlock: saved.faceDescriptorBlock || base.faceDescriptorBlock
  };
};

interface WorkspaceProps {
  user: string;
  influencer: Influencer;
  onLogout: () => void;
  onSwitchInfluencer: () => void;
  onUpdatePassword: (p: string) => void;
  onDeleteAccount: () => void;
  onUpdateInfluencer: (inf: Influencer) => void;
}

// Level 3: Workspace - NOW USES INDEXEDDB (Database) INSTEAD OF LOCALSTORAGE
const Workspace: React.FC<WorkspaceProps> = ({ 
  user, influencer, onLogout, onSwitchInfluencer, onUpdatePassword, onDeleteAccount, onUpdateInfluencer
}) => {
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Helper for namespaced keys
  const getDBKey = (key: string) => `data_${influencer.id}_${key}`;

  // State
  const [persona, setPersona] = useState<Persona>(initialPersona);
  const [plans, setPlans] = useState<QuarterlyPlan[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [strategyCards, setStrategyCards] = useState<StrategyCard[]>([]);
  
  // Router
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setCurrentPath(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  // 1. Initial Data Load from IDB
  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
        try {
            setLoading(true);
            const [savedPersona, savedPlans, savedPosts, savedBrands, savedStrategies] = await Promise.all([
                database.load<Partial<Persona>>(getDBKey('persona')),
                database.load<QuarterlyPlan[]>(getDBKey('plans')),
                database.load<Post[]>(getDBKey('posts')),
                database.load<Brand[]>(getDBKey('brands')),
                database.load<StrategyCard[]>(getDBKey('strategies'))
            ]);

            if (mounted) {
                if (savedPersona) {
                    setPersona(mergePersona(initialPersona, savedPersona));
                } else {
                    setPersona({ ...initialPersona, name: influencer.name });
                }
                setPlans(savedPlans || []);
                setPosts(savedPosts || []);
                setBrands(savedBrands || []);
                setStrategyCards(savedStrategies || []);
            }
        } catch (e) {
            console.error("Failed to load workspace data", e);
            setStorageError("Failed to load data from database.");
        } finally {
            if (mounted) setLoading(false);
        }
    };
    loadAll();
    return () => { mounted = false; };
  }, [influencer.id]);

  // 2. Persistence Effects (Save to IDB on change)
  useEffect(() => {
    if (!loading) database.save(getDBKey('persona'), persona);
    if (persona.name !== influencer.name) {
        onUpdateInfluencer({ ...influencer, name: persona.name });
    }
  }, [persona, influencer.id, loading]);

  useEffect(() => {
    if (!loading) database.save(getDBKey('plans'), plans);
  }, [plans, influencer.id, loading]);

  useEffect(() => {
    if (!loading) database.save(getDBKey('posts'), posts);
  }, [posts, influencer.id, loading]);

  useEffect(() => {
    if (!loading) database.save(getDBKey('brands'), brands);
  }, [brands, influencer.id, loading]);

  useEffect(() => {
    if (!loading) database.save(getDBKey('strategies'), strategyCards);
  }, [strategyCards, influencer.id, loading]);

  // Actions
  const addPost = (post: Post) => setPosts(prev => [post, ...prev]);
  const updatePost = (updatedPost: Post) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  const deletePost = (postId: string) => setPosts(prev => prev.filter(p => p.id !== postId));
  const addPlan = (plan: QuarterlyPlan) => setPlans(prev => [plan, ...prev]);
  const updatePlan = (updatedPlan: QuarterlyPlan) => setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  const deletePlan = (planId: string) => setPlans(prev => prev.filter(p => p.id !== planId));
  const addBrand = (brand: Brand) => setBrands(prev => [brand, ...prev]);
  const updateBrand = (updatedBrand: Brand) => setBrands(prev => prev.map(b => b.id === updatedBrand.id ? updatedBrand : b));
  const deleteBrand = (brandId: string) => setBrands(prev => prev.filter(b => b.id !== brandId));
  
  const addStrategyCard = (card: StrategyCard) => setStrategyCards(prev => [card, ...prev]);
  const updateStrategyCard = (card: StrategyCard) => setStrategyCards(prev => prev.map(c => c.id === card.id ? card : c));
  const deleteStrategyCard = (id: string) => setStrategyCards(prev => prev.filter(c => c.id !== id));

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-gray-50 flex-col space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-gray-500 font-medium">Connecting to Secure Database...</p>
          </div>
      );
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard': return <Dashboard posts={posts} plans={plans} />;
      case '/strategy': return <Planner persona={persona} brands={brands} strategyCards={strategyCards} addStrategyCard={addStrategyCard} updateStrategyCard={updateStrategyCard} deleteStrategyCard={deleteStrategyCard} addPost={addPost} />;
      case '/reels': return <ReelsGenerator persona={persona} brands={brands} strategyCards={strategyCards} addStrategyCard={addStrategyCard} updateStrategyCard={updateStrategyCard} deleteStrategyCard={deleteStrategyCard} />;
      case '/calendar': return <CalendarPlanner posts={posts} updatePost={updatePost} addPost={addPost} deletePost={deletePost} persona={persona} />;
      case '/brands': return <BrandManager brands={brands} addBrand={addBrand} updateBrand={updateBrand} deleteBrand={deleteBrand} />;
      case '/intelligence': return <LearningHub persona={persona} addStrategyCard={addStrategyCard} />;
      case '/generator': return <ContentGenerator persona={persona} posts={posts} brands={brands} updatePost={updatePost} />;
      case '/approval': return <ApprovalQueue posts={posts} updatePost={updatePost} deletePost={deletePost} persona={persona} />;
      case '/blueprint': return <SystemBlueprint />;
      case '/persona': return <PersonaEditor persona={persona} setPersona={setPersona} />;
      case '/settings': return <Settings user={user} onUpdatePassword={onUpdatePassword} onDeleteAccount={onDeleteAccount} />;
      default: return <Dashboard posts={posts} plans={plans} />;
    }
  };

  return (
    <>
      <Layout 
          user={user} 
          currentInfluencer={influencer}
          onLogout={onLogout} 
          onSwitchInfluencer={onSwitchInfluencer}
          currentPath={currentPath}
          onNavigate={navigate}
      >
        {renderContent()}
      </Layout>
      <StorageAlert message={storageError} onClose={() => setStorageError(null)} />
    </>
  );
};

// ... [AuthenticatedSession and Level 2 remain similar but use localStorageProxy] ...
interface AuthenticatedSessionProps {
    user: string;
    onLogout: () => void;
    onUpdatePassword: (p: string) => void;
    onDeleteAccount: () => void;
}

const AuthenticatedSession: React.FC<AuthenticatedSessionProps> = ({ 
    user, onLogout, onUpdatePassword, onDeleteAccount 
}) => {
    const INFLUENCERS_KEY = `ai_influencer_${user}_influencer_list`;
    
    // Influencer list is small metadata, safe for LocalStorage
    const [influencers, setInfluencers] = useState<Influencer[]>(() => {
        const saved = localStorageProxy.get(INFLUENCERS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

    useEffect(() => {
        localStorageProxy.set(INFLUENCERS_KEY, JSON.stringify(influencers));
    }, [influencers, user]);

    const handleCreateInfluencer = (name: string, handle: string) => {
        const newInf: Influencer = { id: crypto.randomUUID(), name, handle, createdAt: Date.now() };
        setInfluencers(prev => [...prev, newInf]);
        setSelectedInfluencer(newInf);
    };

    const handleDeleteInfluencer = (id: string) => {
        if(window.confirm("Delete this influencer profile?")) {
             setInfluencers(prev => prev.filter(i => i.id !== id));
             // Clean up DB
             database.delete(`data_${id}_`);
             if (selectedInfluencer?.id === id) setSelectedInfluencer(null);
        }
    };

    const handleUpdateInfluencer = useCallback((updatedInf: Influencer) => {
        setInfluencers(prev => prev.map(inf => inf.id === updatedInf.id ? updatedInf : inf));
        if (selectedInfluencer?.id === updatedInf.id) setSelectedInfluencer(updatedInf);
    }, [selectedInfluencer]);

    if (!selectedInfluencer) {
        return (
            <InfluencerSelector 
                user={user}
                influencers={influencers}
                onSelect={setSelectedInfluencer}
                onCreate={handleCreateInfluencer}
                onDelete={handleDeleteInfluencer}
                onLogout={onLogout}
            />
        );
    }

    return (
        <Workspace 
            key={selectedInfluencer.id}
            user={user}
            influencer={selectedInfluencer}
            onLogout={onLogout}
            onSwitchInfluencer={() => setSelectedInfluencer(null)}
            onUpdatePassword={onUpdatePassword}
            onDeleteAccount={onDeleteAccount}
            onUpdateInfluencer={handleUpdateInfluencer}
        />
    );
};

const App: React.FC = () => {
  // CRITICAL: Run Storage Cleanup on Mount
  useEffect(() => {
      localStorageGuard.cleanup();
  }, []);

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    const sessionRaw = localStorageProxy.get(SESSION_KEY);
    if (!sessionRaw) return null;
    try {
        const session: SessionData = JSON.parse(sessionRaw);
        if (Date.now() > session.expiresAt) {
            localStorageProxy.remove(SESSION_KEY);
            return null;
        }
        return session.username;
    } catch(e) { return null; }
  });
  
  const [authError, setAuthError] = useState<string | null>(null);

  const getUsers = (): Record<string, string> => {
    try {
      const usersRaw = localStorageProxy.get(USERS_STORAGE_KEY);
      if (!usersRaw) return {};
      return JSON.parse(usersRaw);
    } catch (e) { return {}; }
  };

  const hashPassword = async (pwd: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createSession = (username: string) => {
      const session: SessionData = {
          token: crypto.randomUUID(),
          username,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorageProxy.set(SESSION_KEY, JSON.stringify(session));
      setCurrentUser(username);
      setAuthError(null);
  };

  const handleLogin = async (u: string, p: string) => {
    try {
        const users = getUsers();
        if (!users[u]) { setAuthError("Invalid username or password."); return; }
        const stored = users[u];
        const inputHash = await hashPassword(p);
        if (stored === inputHash || stored === p) {
            if (stored === p) { // Migrate legacy
                users[u] = inputHash;
                localStorageProxy.set(USERS_STORAGE_KEY, JSON.stringify(users));
            }
            createSession(u);
        } else {
            setAuthError("Invalid username or password.");
        }
    } catch (e) { setAuthError("Authentication error."); }
  };

  const handleSignup = async (u: string, p: string) => {
    try {
      const users = getUsers();
      if (users[u]) { setAuthError("Username exists."); return; }
      users[u] = await hashPassword(p);
      localStorageProxy.set(USERS_STORAGE_KEY, JSON.stringify(users));
      createSession(u);
    } catch (e) { setAuthError("System error."); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorageProxy.remove(SESSION_KEY);
    setAuthError(null);
  };

  const handleUpdatePassword = async (newPass: string) => {
    if (!currentUser) return;
    const users = getUsers();
    users[currentUser] = await hashPassword(newPass);
    localStorageProxy.set(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const users = getUsers();
    delete users[currentUser];
    localStorageProxy.set(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Clean up all user data from IDB
    // Note: This needs a more robust implementation in production
    handleLogout();
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} error={authError} />;
  }

  return (
    <AuthenticatedSession 
        key={currentUser} 
        user={currentUser} 
        onLogout={handleLogout} 
        onUpdatePassword={handleUpdatePassword}
        onDeleteAccount={handleDeleteAccount}
    />
  );
};

export default App;