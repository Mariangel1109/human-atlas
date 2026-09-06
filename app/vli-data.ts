import {calculateVli,type OrganResult} from './vli-core';
import {downloadVliPassport} from './vli-passport';

export type VliPatient={id:string;sex?:string;birth_date?:string;created_at?:string};
export type VliConsultation={id?:string;patient_id:string;created_at?:string;age?:number;weight?:number;waist?:number;hba1c?:number;ldl?:number;triglycerides?:number;ast?:number;alt?:number;systolic_bp?:number;diastolic_bp?:number;notes?:string;vli_global?:number|null;vli_completeness?:number|null;vli_version?:string|null;vli_components?:Record<string,OrganResult>|null};

const url=(import.meta as any).env?.VITE_SUPABASE_URL as string|undefined;
const key=(import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string|undefined;
export const hasSupabase=Boolean(url&&key);
const headers=()=>({'Content-Type':'application/json','apikey':key??'','Authorization':`Bearer ${key??''}`,'Prefer':'return=representation'});

const localPatientsKey='vli.patients.v1',localConsultsKey='vli.consultations.v1';
const readLocal=<T>(k:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(k)||'') as T}catch{return fallback}};
const writeLocal=(k:string,v:unknown)=>localStorage.setItem(k,JSON.stringify(v));

function withVli(c:VliConsultation):VliConsultation{
 const result=calculateVli(c);
 return {...c,vli_global:result.global,vli_completeness:Math.round(result.completeness*100),vli_version:result.version,vli_components:result.organs};
}

export async function listPatients():Promise<VliPatient[]>{
 if(hasSupabase){const r=await fetch(`${url}/rest/v1/patients?select=*&order=created_at.desc`,{headers:headers()});if(r.ok)return r.json();}
 return readLocal<VliPatient[]>(localPatientsKey,[{id:'VLI-0001'},{id:'VLI-0002'}]);
}

export async function createPatient(patient:VliPatient):Promise<VliPatient>{
 if(hasSupabase){const r=await fetch(`${url}/rest/v1/patients`,{method:'POST',headers:headers(),body:JSON.stringify(patient)});if(r.ok){const rows=await r.json();return rows[0]??patient;}throw new Error('No se pudo crear el paciente en Supabase.');}
 const rows=readLocal<VliPatient[]>(localPatientsKey,[{id:'VLI-0001'},{id:'VLI-0002'}]);
 const next=[patient,...rows.filter(x=>x.id!==patient.id)];writeLocal(localPatientsKey,next);return patient;
}

export async function listConsultations(patientId:string):Promise<VliConsultation[]>{
 if(hasSupabase){const r=await fetch(`${url}/rest/v1/consultations?patient_id=eq.${encodeURIComponent(patientId)}&select=*&order=created_at.desc`,{headers:headers()});if(r.ok)return r.json();}
 return readLocal<VliConsultation[]>(localConsultsKey,[]).filter(x=>x.patient_id===patientId);
}

export async function createConsultation(c:VliConsultation):Promise<VliConsultation>{
 const calculated=withVli(c);
 if(hasSupabase){const r=await fetch(`${url}/rest/v1/consultations`,{method:'POST',headers:headers(),body:JSON.stringify(calculated)});if(r.ok){const rows=await r.json();return rows[0]??calculated;}throw new Error('No se pudo guardar la consulta en Supabase.');}
 const rows=readLocal<VliConsultation[]>(localConsultsKey,[]);const saved={...calculated,id:calculated.id??crypto.randomUUID(),created_at:new Date().toISOString()};writeLocal(localConsultsKey,[saved,...rows]);return saved;
}

function wirePassportButton(){
 if(typeof document==='undefined')return;
 const buttons=[...document.querySelectorAll('button')];
 const button=buttons.find(b=>b.textContent?.includes('Generación PDF')) as HTMLButtonElement|undefined;
 if(!button||button.dataset.vliPassport==='1')return;
 button.dataset.vliPassport='1';button.disabled=false;button.textContent='Descargar Pasaporte VLI en PDF';
 button.onclick=async()=>{
   const patientId=(document.querySelector('.search select') as HTMLSelectElement|undefined)?.value;
   if(!patientId){button.textContent='Selecciona un paciente';return;}
   const rows=await listConsultations(patientId);const consultation=rows[0];
   if(!consultation){button.textContent='Primero registra una consulta';return;}
   const result=calculateVli(consultation);button.textContent='Generando PDF…';button.disabled=true;
   try{await downloadVliPassport({patientId,consultation,organs:result.organs,global:result.global,completeness:result.completeness,version:result.version});button.textContent='Descargar Pasaporte VLI en PDF';}
   finally{button.disabled=false;}
 };
}
if(typeof window!=='undefined'){
 queueMicrotask(wirePassportButton);
 const observer=new MutationObserver(wirePassportButton);observer.observe(document.documentElement,{childList:true,subtree:true});
}
