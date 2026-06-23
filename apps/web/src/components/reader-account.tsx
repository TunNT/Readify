"use client";

import { Eye, EyeOff, LogIn, LogOut, UserPlus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { syncReaderCollections } from "./library-actions";
import { readerApi, ReaderApiError } from "./reader-api";

type ReaderUser = { id: string; email: string; displayName: string; role: "READER" };
type Mode = "login" | "register";

export function ReaderAccount({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<ReaderUser | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    readerApi<{ data: ReaderUser | null }>("/me").then((result) => setUser(result.data)).catch((requestError: ReaderApiError) => {
      if (requestError.status !== 401) setError(requestError.message);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mode) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMode(null); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mode]);

  const open = (nextMode: Mode) => { setMode(nextMode); setError(""); setVisible(false); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (mode === "register" && password !== form.get("confirmPassword")) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    const body = { email: form.get("email"), password, ...(mode === "register" ? { displayName: form.get("displayName") } : {}) };
    try {
      const result = await readerApi<{ data: ReaderUser }>(mode === "register" ? "/register" : "/login", { method: "POST", body: JSON.stringify(body) });
      await syncReaderCollections();
      setUser(result.data);
      setMode(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    await readerApi("/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  };

  if (loading && !mode) return <div className={`accountActions${compact ? " compact" : ""}`} aria-label="Loading account" />;
  return <>
    <div className={`accountActions${compact ? " compact" : ""}`}>
      {user ? <><span className="accountName" title={user.email}>{user.displayName}</span><button type="button" className="accountTextButton" onClick={logout} aria-label="Sign out">{compact ? <LogOut size={15}/> : null}<span>Sign out</span></button></> : <><button type="button" className="accountTextButton" onClick={() => open("login")} aria-label="Login">{compact ? <LogIn size={15}/> : null}<span>Login</span></button><button type="button" className="accountPrimaryButton" onClick={() => open("register")} aria-label="Register">{compact ? <UserPlus size={15}/> : null}<span>Register</span></button></>}
    </div>
    {mode ? <div className="accountModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMode(null); }}>
      <section className="accountModal" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <header className="accountModalHeader"><div><h2 id="account-title">{mode === "login" ? "Welcome back" : "Create reader account"}</h2><p>{mode === "login" ? "Sync your reading across devices." : "Keep your history and saved stories together."}</p></div><button type="button" className="accountIconButton" onClick={() => setMode(null)} aria-label="Close"><X size={19}/></button></header>
        <div className="accountTabs" role="tablist"><button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => open("login")}>Sign in</button><button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => open("register")}>Register</button></div>
        {error ? <div className="accountError" role="alert">{error}</div> : null}
        <form className="accountForm" onSubmit={submit}>
          {mode === "register" ? <label><span>Display name</span><input name="displayName" autoComplete="name" maxLength={120} required autoFocus/></label> : null}
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required autoFocus={mode === "login"}/></label>
          <label><span>Password</span><div className="accountPassword"><input name="password" type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={200} required/><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
          {mode === "register" ? <label><span>Confirm password</span><input name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={200} required/></label> : null}
          <button className="accountSubmit" disabled={loading}>{mode === "login" ? <LogIn size={17}/> : <UserPlus size={17}/>} {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
      </section>
    </div> : null}
  </>;
}
