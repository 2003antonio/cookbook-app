import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// session === undefined  -> still checking for an existing session
// session === null       -> checked, nobody is signed in
// session === {...}      -> signed in
export function useAuth() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
  };
}