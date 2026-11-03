"use client";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { AppWorkspace } from "@/components/layout/AppWorkspace";

const STORAGE_KEY="money-mind:sidebar-collapsed:v1";
const EVENT_NAME="money-mind:sidebar-change";
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener(EVENT_NAME,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(EVENT_NAME,callback);};}
function getSnapshot(){return window.localStorage.getItem(STORAGE_KEY)==="true";}
function getServerSnapshot(){return false;}

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed=useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot);
  const [mobileOpen,setMobileOpen]=useState(false);
  const setCollapsed=(value:boolean)=>{window.localStorage.setItem(STORAGE_KEY,String(value));window.dispatchEvent(new Event(EVENT_NAME));};
  return <div className="mm-app-shell" data-sidebar-collapsed={collapsed}><a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-[var(--mm-primary)] px-4 py-2 text-sm font-semibold text-[var(--mm-text-inverse)] focus:translate-y-0">Skip to content</a><Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}/><div className="mm-app-workspace"><AppTopBar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen}/><AppWorkspace>{children}</AppWorkspace></div></div>;
}
