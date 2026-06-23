"use client";

import { BarChart3, BookOpen, ChevronLeft, LayoutDashboard, LogOut, Menu, Megaphone, Tags, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AdminUser } from "./admin-api";
import styles from "./admin.module.css";

export type AdminSection = "dashboard"|"novels"|"categories"|"tags"|"ads"|"users";
const navigation: Array<{id:AdminSection;label:string;icon:typeof BookOpen;superOnly?:boolean}> = [
  {id:"dashboard",label:"Dashboard",icon:LayoutDashboard},{id:"novels",label:"Stories",icon:BookOpen},
  {id:"categories",label:"Categories",icon:Tags},{id:"tags",label:"Tags",icon:Tags},{id:"ads",label:"Ad placements",icon:Megaphone},
  {id:"users",label:"Users",icon:Users,superOnly:true}
];

export function AdminShell({user,section,onSection,onLogout,children}:{user:AdminUser;section:AdminSection;onSection:(section:AdminSection)=>void;onLogout:()=>void;children:React.ReactNode}) {
  const [open,setOpen]=useState(false);
  const choose=(next:AdminSection)=>{onSection(next);setOpen(false);};
  return <div className={styles.adminApp}>
    <aside className={`${styles.sidebar} ${open?styles.sidebarOpen:""}`}>
      <div className={styles.sidebarHead}><Link href="/" className={styles.adminBrand}>GoodLuckArk</Link><button className={styles.mobileClose} onClick={()=>setOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
      <nav className={styles.adminNav}>{navigation.filter(item=>!item.superOnly||user.role==="SUPER_ADMIN").map(item=><button className={section===item.id?styles.navActive:""} onClick={()=>choose(item.id)} key={item.id}><item.icon size={17}/><span>{item.label}</span></button>)}</nav>
      <div className={styles.sidebarFooter}><div><strong>{user.displayName}</strong><span>{user.role.replaceAll("_"," ")}</span></div><button onClick={onLogout} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button></div>
    </aside>
    {open?<button className={styles.sidebarOverlay} onClick={()=>setOpen(false)} aria-label="Close menu"/>:null}
    <div className={styles.adminMain}><header className={styles.adminTopbar}><button className={styles.menuButton} onClick={()=>setOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div><span>Administration</span><strong>{navigation.find(item=>item.id===section)?.label}</strong></div><Link href="/"><ChevronLeft size={16}/> View site</Link></header><main className={styles.adminContent}>{children}</main></div>
  </div>;
}

export function SectionHeader({title,description,action}:{title:string;description:string;action?:React.ReactNode}) { return <div className={styles.sectionHeader}><div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
export function LoadingState(){return <div className={styles.state}><BarChart3 size={25}/><p>Loading data...</p></div>}
export function EmptyState({message}:{message:string}){return <div className={styles.state}><p>{message}</p></div>}
export function ErrorBanner({message}:{message:string}){return <div className={styles.errorBanner} role="alert">{message}</div>}
