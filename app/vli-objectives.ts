import type {VliConsultation} from './vli-data';

export type ObjectivePriority='Alta'|'Media'|'Seguimiento';
export type VliObjective={
 id:string;
 domain:string;
 finding:string;
 target:string;
 action:string;
 review:string;
 priority:ObjectivePriority;
 note?:string;
};

const n=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);

export function buildObjectives(c?:VliConsultation):VliObjective[]{
 if(!c)return [];
 const out:VliObjective[]=[];
 if(n(c.ldl)&&c.ldl>=100) out.push({id:'ldl',domain:'Cardiovascular',finding:`LDL-C ${c.ldl} mg/dL`,target:'Definir meta de LDL-C según riesgo cardiovascular global y prevención primaria/secundaria.',action:'Estratificar riesgo ASCVD, revisar ApoB/Lp(a) si están disponibles y documentar estrategia terapéutica individualizada.',review:'8–12 semanas tras ajuste terapéutico',priority:c.ldl>=190?'Alta':'Media',note:'No usar una meta única para todos los pacientes.'});
 if(n(c.apob)&&c.apob>=90) out.push({id:'apob',domain:'Cardiovascular',finding:`ApoB ${c.apob} mg/dL`,target:'Reducir carga aterogénica según categoría de riesgo individual.',action:'Integrar ApoB con LDL-C, TG, Lp(a), antecedentes e imagen vascular.',review:'8–12 semanas',priority:c.apob>=130?'Alta':'Media'});
 if(n(c.hba1c)&&c.hba1c>=5.7) out.push({id:'hba1c',domain:'Metabolismo',finding:`HbA1c ${c.hba1c}%`,target:'Meta glucémica individualizada según diagnóstico, edad, comorbilidades y riesgo de hipoglucemia.',action:'Definir intervención nutricional, actividad física y tratamiento farmacológico según contexto clínico.',review:'~3 meses',priority:c.hba1c>=6.5?'Alta':'Media'});
 if(n(c.triglycerides)&&c.triglycerides>=150) out.push({id:'tg',domain:'Metabolismo',finding:`Triglicéridos ${c.triglycerides} mg/dL`,target:'Referencia inicial: <150 mg/dL, ajustada al contexto clínico.',action:'Revisar alcohol, azúcares/refinados, peso, resistencia a insulina, diabetes, fármacos y causas secundarias.',review:'8–12 semanas',priority:c.triglycerides>=500?'Alta':'Media'});
 if((n(c.alt)&&c.alt>30)||(n(c.ast)&&c.ast>30)||(n(c.liver_fat_grade)&&c.liver_fat_grade>0)) out.push({id:'liver',domain:'Hígado',finding:`ALT ${n(c.alt)?c.alt:'—'} / AST ${n(c.ast)?c.ast:'—'}${n(c.liver_fat_grade)?` · esteatosis G${c.liver_fat_grade}`:''}`,target:'Mejorar perfil hepático y reducir esteatosis; objetivo morfológico definido por seguimiento clínico/imaginológico.',action:'Cuantificar riesgo fibrótico (p. ej., FIB-4 cuando estén los datos), revisar causas secundarias y tratar factores cardiometabólicos.',review:'12–24 semanas según severidad',priority:(n(c.liver_fat_grade)&&c.liver_fat_grade>=2)?'Alta':'Media'});
 if(n(c.waist)) out.push({id:'waist',domain:'Composición corporal',finding:`Cintura ${c.waist} cm`,target:'Reducir adiposidad central con meta personalizada por sexo, contexto y evolución.',action:'Definir plan de nutrición, fuerza, actividad diaria y seguimiento de composición corporal.',review:'4–8 semanas',priority:'Media'});
 if(n(c.systolic_bp)&&c.systolic_bp>=130) out.push({id:'bp',domain:'Cardiovascular',finding:`PA ${c.systolic_bp}/${n(c.diastolic_bp)?c.diastolic_bp:'—'} mmHg`,target:'Confirmar meta de presión arterial según riesgo, tolerancia y comorbilidades.',action:'Confirmar mediciones estandarizadas, considerar AMPA/MAPA y ajustar tratamiento según evaluación clínica.',review:'2–6 semanas según nivel y tratamiento',priority:c.systolic_bp>=160?'Alta':'Media'});
 if(n(c.grip_strength)||n(c.vo2_est)||n(c.muscle_mass_pct)) out.push({id:'function',domain:'Función y músculo',finding:`Fuerza ${n(c.grip_strength)?c.grip_strength:'—'} kg · VO₂ ${n(c.vo2_est)?c.vo2_est:'—'} · músculo ${n(c.muscle_mass_pct)?c.muscle_mass_pct:'—'}%`,target:'Mejorar reserva funcional respecto al punto basal del paciente.',action:'Prescribir progresión de fuerza y capacidad aeróbica según tolerancia y riesgo.',review:'8–12 semanas',priority:'Seguimiento'});
 if(n(c.hrv)||n(c.sleep_hours)) out.push({id:'recovery',domain:'Sueño y recuperación',finding:`HRV ${n(c.hrv)?c.hrv:'—'} ms · sueño ${n(c.sleep_hours)?c.sleep_hours:'—'} h`,target:'Optimizar recuperación y regularidad del sueño usando tendencia individual.',action:'Revisar horario, calidad, síntomas de apnea, alcohol, estrés y carga de entrenamiento.',review:'4–8 semanas',priority:'Seguimiento'});
 return out;
}
