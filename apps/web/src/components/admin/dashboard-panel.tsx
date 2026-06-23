"use client";

import { useEffect, useState } from "react";
import { adminApi } from "./admin-api";
import { ErrorBanner, LoadingState, SectionHeader } from "./admin-shell";
import styles from "./admin.module.css";

type Dashboard={counts:Record<string,number>;recent:Array<{id:string;action:string;entityType:string;createdAt:string;user?:{displayName:string}|null}>};
export function DashboardPanel(){const[data,setData]=useState<Dashboard|null>(null);const[error,setError]=useState("");useEffect(()=>{adminApi<{data:Dashboard}>("/dashboard").then(body=>setData(body.data)).catch(e=>setError(e.message));},[]);if(!data&&!error)return <LoadingState/>;return <><SectionHeader title="Dashboard" description="Content, access and monetization activity at a glance."/>{error?<ErrorBanner message={error}/>:null}{data?<><div className={styles.statsGrid}>{Object.entries(data.counts).map(([label,value])=><div className={styles.stat} key={label}><span>{label==="novels"?"stories":label}</span><strong>{value.toLocaleString()}</strong></div>)}</div><section className={styles.panel}><h2>Recent activity</h2><ul className={styles.auditList}>{data.recent.map(log=><li key={log.id}><span>{new Date(log.createdAt).toLocaleString()}</span><strong>{log.action} {log.entityType}</strong><span>{log.user?.displayName??"System"}</span></li>)}</ul></section></>:null}</>}
