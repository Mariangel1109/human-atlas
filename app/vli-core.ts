export type OrganId='heart'|'metabolism'|'liver'|'muscle'|'brain';

export type VliInput={
  age?:number;
  weight?:number;
  waist?:number;
  body_fat_pct?:number;
  visceral_fat?:number;
  muscle_mass_pct?:number;
  grip_strength?:number;
  vo2_est?:number;
  hrv?:number;
  sleep_hours?:number;
  activity_minutes_week?:number;
  hba1c?:number;
  fasting_glucose?:number;
  fasting_insulin?:number;
  ldl?:number;
  hdl?:number;
  triglycerides?:number;
  apob?:number;
  lpa?:number;
  hs_crp?:number;
  ast?:number;
  alt?:number;
  ggt?:number;
  liver_fat_grade?:number;
  systolic_bp?:number;
  diastolic_bp?:number;
  carotid_plaque?:number;
};

export type MarkerContribution={
  key:keyof VliInput;
  label:string;
  value:number;
  score:number;
  weight:number;
};

export type OrganResult={
  id:OrganId;
  label:string;
  score:number|null;
  completeness:number;
  status:'Sin datos suficientes'|'Datos parciales'|'Favorable'|'Intermedio'|'Prioridad clínica';
  markers:MarkerContribution[];
};

export type VliCoreResult={
  version:'VLI-PROTOTYPE-0.2';
  global:number|null;
  completeness:number;
  organs:Record<OrganId,OrganResult>;
  availableMarkers:number;
  totalMarkers:number;
  disclaimer:string;
};

type Rule={key:keyof VliInput;label:string;ideal:number;risk:number;weight:number;direction:'lower'|'higher'};
type OrganDef={id:OrganId;label:string;weight:number;rules:Rule[]};

const ORGAN_DEFS:OrganDef[]=[
  {id:'heart',label:'Corazón',weight:1.2,rules:[
    {key:'apob',label:'ApoB',ideal:80,risk:140,weight:1.4,direction:'lower'},
    {key:'ldl',label:'LDL-C',ideal:100,risk:190,weight:1.0,direction:'lower'},
    {key:'lpa',label:'Lp(a)',ideal:30,risk:100,weight:.9,direction:'lower'},
    {key:'triglycerides',label:'Triglicéridos',ideal:150,risk:300,weight:.6,direction:'lower'},
    {key:'systolic_bp',label:'PAS',ideal:120,risk:180,weight:1,direction:'lower'},
    {key:'diastolic_bp',label:'PAD',ideal:80,risk:110,weight:.7,direction:'lower'},
    {key:'hs_crp',label:'hs-CRP',ideal:1,risk:5,weight:.6,direction:'lower'},
    {key:'carotid_plaque',label:'Placa carotídea',ideal:0,risk:1,weight:1.25,direction:'lower'},
  ]},
  {id:'metabolism',label:'Metabolismo',weight:1.2,rules:[
    {key:'hba1c',label:'HbA1c',ideal:5.7,risk:8.5,weight:1.35,direction:'lower'},
    {key:'fasting_glucose',label:'Glucosa ayunas',ideal:100,risk:160,weight:.9,direction:'lower'},
    {key:'fasting_insulin',label:'Insulina ayunas',ideal:8,risk:25,weight:.8,direction:'lower'},
    {key:'waist',label:'Cintura',ideal:90,risk:120,weight:.8,direction:'lower'},
    {key:'visceral_fat',label:'Grasa visceral',ideal:10,risk:20,weight:.8,direction:'lower'},
    {key:'triglycerides',label:'Triglicéridos',ideal:150,risk:300,weight:.65,direction:'lower'},
    {key:'hdl',label:'HDL-C',ideal:50,risk:30,weight:.5,direction:'higher'},
  ]},
  {id:'liver',label:'Hígado',weight:1.1,rules:[
    {key:'alt',label:'ALT',ideal:30,risk:100,weight:1,direction:'lower'},
    {key:'ast',label:'AST',ideal:30,risk:100,weight:.85,direction:'lower'},
    {key:'ggt',label:'GGT',ideal:35,risk:120,weight:.9,direction:'lower'},
    {key:'liver_fat_grade',label:'Esteatosis hepática',ideal:0,risk:3,weight:1.2,direction:'lower'},
    {key:'triglycerides',label:'Triglicéridos',ideal:150,risk:300,weight:.45,direction:'lower'},
  ]},
  {id:'muscle',label:'Músculo',weight:.9,rules:[
    {key:'muscle_mass_pct',label:'Masa muscular %',ideal:35,risk:22,weight:1,direction:'higher'},
    {key:'grip_strength',label:'Fuerza de prensión',ideal:40,risk:20,weight:1,direction:'higher'},
    {key:'vo2_est',label:'VO₂ estimado',ideal:35,risk:18,weight:.9,direction:'higher'},
    {key:'activity_minutes_week',label:'Actividad semanal',ideal:150,risk:30,weight:.6,direction:'higher'},
  ]},
  {id:'brain',label:'Cerebro',weight:.8,rules:[
    {key:'systolic_bp',label:'PAS',ideal:120,risk:180,weight:.6,direction:'lower'},
    {key:'hba1c',label:'HbA1c',ideal:5.7,risk:8.5,weight:.5,direction:'lower'},
    {key:'hrv',label:'HRV',ideal:45,risk:15,weight:.55,direction:'higher'},
    {key:'sleep_hours',label:'Sueño',ideal:7,risk:4.5,weight:.45,direction:'higher'},
    {key:'activity_minutes_week',label:'Actividad semanal',ideal:150,risk:30,weight:.4,direction:'higher'},
  ]},
];

const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,n));
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);

function scoreRule(value:number,rule:Rule){
  if(rule.direction==='lower'){
    if(value<=rule.ideal)return 100;
    if(value>=rule.risk)return 20;
    return clamp(100-((value-rule.ideal)/(rule.risk-rule.ideal))*80);
  }
  if(value>=rule.ideal)return 100;
  if(value<=rule.risk)return 20;
  return clamp(100-((rule.ideal-value)/(rule.ideal-rule.risk))*80);
}

function statusFor(score:number|null,completeness:number):OrganResult['status']{
  if(score===null)return 'Sin datos suficientes';
  if(completeness<.5)return 'Datos parciales';
  if(score>=80)return 'Favorable';
  if(score>=60)return 'Intermedio';
  return 'Prioridad clínica';
}

function calculateOrgan(input:VliInput,def:OrganDef):OrganResult{
  const markers:MarkerContribution[]=[];
  for(const rule of def.rules){
    const value=input[rule.key];
    if(!finite(value))continue;
    markers.push({key:rule.key,label:rule.label,value,score:Math.round(scoreRule(value,rule)),weight:rule.weight});
  }
  const availableWeight=markers.reduce((s,m)=>s+m.weight,0);
  const totalWeight=def.rules.reduce((s,r)=>s+r.weight,0);
  const score=availableWeight?Math.round(markers.reduce((s,m)=>s+m.score*m.weight,0)/availableWeight):null;
  const completeness=totalWeight?availableWeight/totalWeight:0;
  return {id:def.id,label:def.label,score,completeness,status:statusFor(score,completeness),markers};
}

export function calculateVli(input:VliInput):VliCoreResult{
  const entries=ORGAN_DEFS.map(def=>[def.id,calculateOrgan(input,def)] as const);
  const organs=Object.fromEntries(entries) as Record<OrganId,OrganResult>;
  const scored=ORGAN_DEFS.map(def=>({def,result:organs[def.id]})).filter(x=>x.result.score!==null);
  const globalWeight=scored.reduce((s,x)=>s+x.def.weight*x.result.completeness,0);
  const global=globalWeight?Math.round(scored.reduce((s,x)=>s+(x.result.score as number)*x.def.weight*x.result.completeness,0)/globalWeight):null;
  const uniqueRules=new Set(ORGAN_DEFS.flatMap(o=>o.rules.map(r=>r.key)));
  const available=[...uniqueRules].filter(k=>finite(input[k])).length;
  const total=uniqueRules.size;
  return {
    version:'VLI-PROTOTYPE-0.2',
    global,
    completeness:total?available/total:0,
    organs,
    availableMarkers:available,
    totalMarkers:total,
    disclaimer:'Motor prototipo para desarrollo del producto. No es un índice clínico validado, no calcula edad biológica y los umbrales/pesos deben definirse y validarse científicamente antes de uso clínico.',
  };
}
