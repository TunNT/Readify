"use client";

import { ImageUp, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type SiteSettings } from "./admin-api";
import { ErrorBanner, LoadingState, SectionHeader } from "./admin-shell";
import styles from "./admin.module.css";

type AssetField = "logo" | "favicon" | "socialImage";
const assetConfig: Record<AssetField, { label: string; help: string; accept: string }> = {
  logo: { label: "Website logo", help: "Used in website headers and Admin. Transparent PNG or WebP is recommended.", accept: "image/png,image/jpeg,image/webp" },
  favicon: { label: "Browser icon", help: "Square image shown on browser tabs. PNG or ICO is recommended.", accept: "image/png,image/x-icon,image/vnd.microsoft.icon" },
  socialImage: { label: "Social sharing image", help: "Default preview for Facebook and X. Recommended size: 1200 × 630 px.", accept: "image/png,image/jpeg,image/webp" }
};

export function SettingsPanel() {
  const router=useRouter();
  const [settings,setSettings]=useState<SiteSettings|null>(null); const [error,setError]=useState(""); const [message,setMessage]=useState(""); const [saving,setSaving]=useState(false); const [uploading,setUploading]=useState<AssetField|null>(null);
  useEffect(()=>{adminApi<{data:SiteSettings}>("/settings").then(body=>setSettings(body.data)).catch(e=>setError(e.message));},[]);
  const upload=async(field:AssetField,file?:File)=>{if(!file||!settings)return;setUploading(field);setError("");const form=new FormData();form.append("file",file);try{const{data}=await adminApi<{data:{id:string;publicUrl?:string|null}}>("/assets/site",{method:"POST",body:form});setSettings(current=>current?{...current,[`${field}AssetId`]:data.id,[`${field}Url`]:data.publicUrl??null}:current)}catch(e){setError((e as Error).message)}finally{setUploading(null)}};
  const save=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!settings)return;setSaving(true);setError("");setMessage("");try{const{data}=await adminApi<{data:SiteSettings}>("/settings",{method:"PATCH",body:JSON.stringify(settings)});setSettings(data);setMessage("Site branding and SEO settings saved.");router.refresh()}catch(e){setError((e as Error).message)}finally{setSaving(false)}};
  if(!settings&&!error)return <LoadingState/>;
  if(!settings)return <ErrorBanner message={error}/>;
  return <><SectionHeader title="Site settings" description="Manage website branding and default search and social sharing information."/>{error?<ErrorBanner message={error}/>:null}{message?<div className={styles.successBanner} role="status">{message}</div>:null}<form className={styles.settingsForm} onSubmit={save}>
    <section className={styles.panel}><h2>Branding</h2><div className={styles.formGrid}><div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="site-name">Website name</label><input id="site-name" value={settings.siteName} onChange={event=>setSettings({...settings,siteName:event.target.value})} maxLength={120} required/></div>{(["logo","favicon","socialImage"] as const).map(field=><AssetUpload field={field} settings={settings} uploading={uploading===field} onUpload={upload} key={field}/>)}</div></section>
    <section className={styles.panel}><h2>Search and social sharing</h2><div className={styles.formGrid}><div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="site-url">Public website URL</label><input id="site-url" type="url" value={settings.siteUrl} onChange={event=>setSettings({...settings,siteUrl:event.target.value})} placeholder="https://example.com" required/><span className={styles.helperText}>Used for canonical links, sitemap and social sharing URLs. Include https:// and do not add a path.</span></div><div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="seo-title">Default SEO title</label><input id="seo-title" value={settings.seoTitle} onChange={event=>setSettings({...settings,seoTitle:event.target.value})} maxLength={160} required/></div><div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="seo-description">Default SEO description</label><textarea id="seo-description" value={settings.seoDescription} onChange={event=>setSettings({...settings,seoDescription:event.target.value})} maxLength={320} required/><span className={styles.helperText}>{settings.seoDescription.length}/320 characters. Story pages automatically use their own title, description and cover.</span></div></div></section>
    <section className={styles.panel}><h2>Ads.txt</h2><div className={styles.formGrid}><div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="ads-txt-content">ads.txt content</label><textarea id="ads-txt-content" value={settings.adsTxtContent} onChange={event=>setSettings({...settings,adsTxtContent:event.target.value})} maxLength={100000} spellCheck={false} placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"/><span className={styles.helperText}>This content is published as plain text at /ads.txt. Leave it empty to return a blank ads.txt file.</span></div></div></section>
    <div className={styles.settingsActions}><button className={styles.primaryButton} disabled={saving}><Save size={16}/>{saving?"Saving...":"Save settings"}</button></div>
  </form></>;
}

function AssetUpload({field,settings,uploading,onUpload}:{field:AssetField;settings:SiteSettings;uploading:boolean;onUpload:(field:AssetField,file?:File)=>void}) {
  const config=assetConfig[field]; const url=settings[`${field}Url`];
  return <div className={`${styles.field} ${field==="socialImage"?styles.fieldFull:""}`}><label>{config.label}</label><div className={`${styles.settingAsset} ${field==="socialImage"?styles.settingAssetWide:""}`}>{url?<img src={url} alt={`${config.label} preview`}/>:<div className={styles.settingAssetEmpty}><ImageUp size={22}/><span>No image</span></div>}<div><label className={styles.secondaryButton}><ImageUp size={15}/>{uploading?"Uploading...":url?"Replace image":"Upload image"}<input type="file" accept={config.accept} onChange={event=>void onUpload(field,event.target.files?.[0])} disabled={uploading} hidden/></label><small>{config.help}</small></div></div></div>;
}
