"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi, AdminApiError, type AdminUser } from "./admin-api";
import { AdminShell, LoadingState, type AdminSection } from "./admin-shell";
import { UsersPanel } from "./admin-management-panels";
import { AdsPanel } from "./ads-panel";
import { DashboardPanel } from "./dashboard-panel";
import { NovelsPanel } from "./novels-panel";
import { TaxonomyPanel } from "./taxonomy-panel";
import { SettingsPanel } from "./settings-panel";

export function AdminConsole() {
  const router=useRouter(); const [user,setUser]=useState<AdminUser|null>(null); const [section,setSection]=useState<AdminSection>("dashboard");
  useEffect(()=>{adminApi<{data:AdminUser}>("/auth/me").then(body=>setUser(body.data)).catch((error:AdminApiError)=>{if(error.status===401)router.replace("/admin/login");});},[router]);
  const logout=async()=>{await adminApi("/auth/logout",{method:"POST"}).catch(()=>undefined);router.replace("/admin/login");router.refresh();};
  if(!user)return <LoadingState/>;
  return <AdminShell user={user} section={section} onSection={setSection} onLogout={logout}>
    {section==="dashboard"?<DashboardPanel/>:null}{section==="novels"?<NovelsPanel/>:null}
    {section==="categories"?<TaxonomyPanel type="categories"/>:null}{section==="tags"?<TaxonomyPanel type="tags"/>:null}
    {section==="ads"?<AdsPanel user={user}/>:null}{section==="users"&&user.role==="SUPER_ADMIN"?<UsersPanel/>:null}
    {section==="settings"&&user.role==="SUPER_ADMIN"?<SettingsPanel/>:null}
  </AdminShell>;
}
