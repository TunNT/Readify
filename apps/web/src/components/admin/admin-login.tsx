"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "./admin-api";
import styles from "./admin.module.css";
import { SiteBrand } from "../site-settings";

export function AdminLogin(){const router=useRouter();const[visible,setVisible]=useState(false);const[loading,setLoading]=useState(false);const[error,setError]=useState("");const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setLoading(true);setError("");const values=Object.fromEntries(new FormData(event.currentTarget));try{await adminApi("/auth/login",{method:"POST",body:JSON.stringify(values)});router.replace("/admin");router.refresh()}catch(e){setError((e as Error).message)}finally{setLoading(false)}};return <main className={styles.loginPage}><section className={styles.loginPanel}><SiteBrand className={styles.loginBrand}/><div><h1>Admin sign in</h1><p>Manage catalog content, access and advertising placements.</p></div>{error?<div className={styles.errorBanner} role="alert">{error}</div>:null}<form onSubmit={submit}><div className={styles.field}><label htmlFor="admin-email">Email</label><input id="admin-email" name="email" type="email" autoComplete="username" required/></div><div className={styles.field}><label htmlFor="admin-password">Password</label><div className={styles.passwordField}><input id="admin-password" name="password" type={visible?"text":"password"} autoComplete="current-password" minLength={8} required/><button type="button" onClick={()=>setVisible(value=>!value)} aria-label={visible?"Hide password":"Show password"}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div><button className={styles.primaryButton} disabled={loading}><LogIn size={16}/>{loading?"Signing in...":"Sign in"}</button></form></section></main>}
