'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { AppUser, Role, Contact, FormationAccess } from '@/lib/types';

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Check if it's an employee (in 'users' collection)
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // It's an employee
          const appUser = { id: userDocSnap.id, ...userDocSnap.data() } as any;

          // Calculate final permissions
          const finalPermissions = new Set<string>(appUser.permissions || []);
          
          if (appUser.roleId) {
              const roleDocRef = doc(db, 'roles', appUser.roleId);
              const roleSnap = await getDoc(roleDocRef);
              if (roleSnap.exists()) {
                  const roleData = roleSnap.data() as Role;
                  (roleData.permissions || []).forEach(p => finalPermissions.add(p));
              }
          }
          
          appUser.permissions = Array.from(finalPermissions);
          setUser(appUser as AppUser);
          setLoading(false);
        } else {
          // 2. Check if it's a student (linked from 'contacts' collection)
          const contactsQuery = query(collection(db, 'contacts'), where('studentAccess.userId', '==', firebaseUser.uid));
          const contactsSnapshot = await getDocs(contactsQuery);
          
          if (!contactsSnapshot.empty) {
            const contactDoc = contactsSnapshot.docs[0];
            const contactData = contactDoc.data() as Contact;
            
            // Construct an AppUser object from contact data
            const studentUser: AppUser = {
              id: firebaseUser.uid,
              name: contactData.name,
              email: contactData.email || null,
              avatarUrl: contactData.avatarUrl || null,
              permissions: ['/formacoes', '/ferramentas'], // Hardcoded student permissions
              roleId: null,
              formationAccess: (contactData.formationAccess || []).map((access: any) => ({
                formationId: access.formationId,
                expiresAt: access.expiresAt?.toDate ? access.expiresAt.toDate().toISOString() : null,
              })),
            };
            setUser(studentUser);
          } else {
            // User exists in Auth, but not in 'users' or linked from 'contacts'
            console.warn("Orphaned auth user found:", firebaseUser.uid);
            setUser(null);
          }
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    return <>{children}</>;
}
