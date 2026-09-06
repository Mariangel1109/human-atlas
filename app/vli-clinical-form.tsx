import {useMemo,useState} from 'react';
import {Activity,Brain,HeartPulse,Save} from 'lucide-react';
import {createConsultation,type VliConsultation} from './vli-data';

type FormState=Record<string,string>;
type Props={patientId:string;onSaved:(saved:VliConsultation)=>Promise<void>|void};

type FieldDef={key:string;label:string;hint?:string};
type ModuleDef={id:string;title:string;subtitle:string;fields:FieldDef[]};

const modules:ModuleDef[]=[
 {id:'clinical',title:'Clínica y antropometría',subtitle:'Datos básicos y composición corporal',fields:[
  {key:'age',label:'Edad'},{key:'weight',label:'Peso (kg)'},{key:'waist',label:'Cintura (cm)'},{key:'body_fat_pct',label:'Grasa corporal (%)'},{key:'visceral_fat',label:'Grasa visceral'},{key:'muscle_mass_pct',label:'Masa muscular (%)'},
 ]},
 {id:'cardio',title:'Cardiovascular',subtitle:'Riesgo aterogénico, presión e imagen vascular',fields:[
  {key:'systolic_bp',label:'PAS (mmHg)'},{key:'diastolic_bp',label:'PAD (mmHg)'},{key:'ldl',label:'LDL-C (mg/dL)'},{key:'hdl',label:'HDL-C (mg/dL)'},{key:'triglycerides',label:'Triglicéridos (mg/dL)'},{key:'apob',label:'ApoB (mg/dL)'},{key:'lpa',label:'Lp(a) (mg/dL)'},{key:'hs_crp',label:'hs-CRP (mg/L)'},{key:'carotid_plaque',label:'Placa carotídea (0=no, 1=sí)'},
 ]},
 {id:'metabolic',title:'Metabolismo',subtitle:'Glucosa, insulina y control glucémico',fields:[
  {key:'hba1c',label:'HbA1c (%)'},{key:'fasting_glucose',label:'Glucosa ayunas (mg/dL)'},{key:'fasting_insulin',label:'Insulina ayunas (µU/mL)'},
 ]},
 {id:'liver',title:'Hígado',subtitle:'Bioquímica e imagen hepática',fields:[
  {key:'ast',label:'AST (U/L)'},{key:'alt',label:'ALT (U/L)'},{key:'ggt',label:'GGT (U/L)'},{key:'liver_fat_grade',label:'Esteatosis por imagen (0–3)'},
 ]},
 {id:'function',title:'Función, sueño y recuperación',subtitle:'Músculo, capacidad funcional y recuperación',fields:[
  {key:'grip_strength',label:'Fuerza de prensión (kg)'},{key:'vo2_est',label:'VO₂ estimado (mL/kg/min)'},{key:'hrv',label:'HRV (ms)'},{key:'sleep_hours',label:'Sueño promedio (h/noche)'},{key:'activity_minutes_week',label:'Actividad física (min/semana)'},
 ]},
];

const initial=Object.fromEntries(modules.flatMap(m=>m.fields.map(f=>[f.key,''])).concat([['notes','']])) as FormState;
const numericKeys=new Set(modules.flatMap(m=>m.fields.map(f=>f.key)));

export default function VliClinicalForm({patientId,onSaved}:Props){
 const [form,setForm]=useState<FormState>(initial);
 const [active,setActive]=useState(modules[0].id);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const completed=useMemo(()=>modules.reduce((n,m)=>n+m.fields.filter(f=>form[f.key]?.trim()).length,0),[form]);
 const total=modules.reduce((n,m)=>n+m.fields.length,0);
 const current=modules.find(m=>m.id===active)??modules[0];
 const set=(key:string,value:string)=>setForm(v=>({...v,[key]:value}));
 const save=async()=>{
  setBusy(true);setMessage('');
  try{
   const payload:any={patient_id:patientId,notes:form.notes||undefined};
   for(const key of numericKeys){const raw=form[key]?.trim();if(raw!==''){const n=Number(raw);if(Number.isFinite(n))payload[key]=n;}}
   const saved=await createConsultation(payload as VliConsultation);
   setMessage('Consulta guardada. VLI recalculado con los datos disponibles.');
   setForm(initial);
   await onSaved(saved);
  }catch(e){setMessage(e instanceof Error?e.message:'No se pudo guardar la consulta.');}
  finally{setBusy(false);}
 };
 return <div className="clinical-wrap">
  <div className="clinical-head">
   <div><h2>Ficha clínica VLI™</h2><p className="muted">Captura modular. Los datos faltantes reducen completitud, pero no penalizan el puntaje.</p></div>
   <div className="completion"><strong>{completed}/{total}</strong><span>variables capturadas</span></div>
  </div>
  <div className="module-tabs">{modules.map((m,i)=><button key={m.id} className={active===m.id?'active':''} onClick={()=>setActive(m.id)}>{i===1?<HeartPulse size={16}/>:i===4?<Brain size={16}/>:<Activity size={16}/>}<span>{m.title}</span></button>)}</div>
  <div className="card module-card"><div className="module-title"><div><div className="muted">MÓDULO VLI</div><h3>{current.title}</h3><p>{current.subtitle}</p></div><span className="module-count">{current.fields.filter(f=>form[f.key]?.trim()).length}/{current.fields.length}</span></div>
   <div className="form">{current.fields.map(f=><div className="field" key={f.key}><label>{f.label}</label><input inputMode="decimal" value={form[f.key]??''} onChange={e=>set(f.key,e.target.value)} placeholder="Ingresar"/></div>)}</div>
  </div>
  <div className="card" style={{marginTop:16}}><div className="field"><label>Notas clínicas y contexto</label><textarea value={form.notes??''} onChange={e=>set('notes',e.target.value)} placeholder="Diagnósticos, tratamiento actual, síntomas, contexto clínico, objetivos del paciente…"/></div></div>
  {message&&<div className="status" style={{marginTop:14}}>{message}</div>}
  <div className="clinical-actions"><button className="primary" onClick={save} disabled={busy||!patientId}><Save size={16}/>{busy?'Guardando…':'Guardar consulta y recalcular VLI'}</button></div>
  <style>{`
   .clinical-wrap{margin-top:26px}.clinical-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:16px}.clinical-head h2{margin:0 0 5px}.completion{text-align:right}.completion strong{display:block;font-size:24px;color:#62e4ec}.completion span{font-size:11px;color:#7fa6b3}.module-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}.module-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;padding:11px 8px;border-radius:12px;border:1px solid rgba(112,214,232,.12);background:rgba(8,22,34,.8);color:#8fb1bc;font-size:11px}.module-tabs button.active{color:#eafcff;border-color:rgba(79,222,238,.38);background:rgba(29,139,164,.16)}.module-title{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}.module-title h3{font-size:20px;margin:5px 0}.module-title p{margin:0;color:#8fb1bc;font-size:12px}.module-count{padding:7px 10px;border-radius:999px;border:1px solid rgba(97,226,235,.2);color:#70ddea;font-size:11px}.clinical-actions{display:flex;justify-content:flex-end;margin-top:16px}.clinical-actions .primary{display:inline-flex;align-items:center;gap:8px}@media(max-width:900px){.module-tabs{grid-template-columns:1fr 1fr}.clinical-head{align-items:flex-start;flex-direction:column}.completion{text-align:left}}@media(max-width:560px){.module-tabs{grid-template-columns:1fr}}
  `}</style>
 </div>;
}
