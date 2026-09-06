import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,Focus,Pause,RotateCcw,RotateCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Sheet,SheetContent,SheetDescription,SheetTitle} from '@/components/ui/sheet';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,explanation,SYSTEMS,type Atlas,type Concept,type SceneState,type View} from './anatomy';

const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'front',rotate:false,reset:0};
type Mode='actual'|'target';

const liverVli={
 current:52,target:86,currentAge:57,targetAge:51,status:'Compromiso hepático moderado',
 findings:['Hígado graso grado 2','AST 50 U/L','ALT 45 U/L','Triglicéridos 190 mg/dL'],
 goals:['Reducir esteatosis hepática','Normalizar enzimas hepáticas','Mejorar perfil metabólico','Disminuir triglicéridos y adiposidad visceral'],
};

const organMenu=[
 {label:'Vista general',query:''},{label:'Cerebro',query:'brain'},{label:'Corazón',query:'heart'},{label:'Hígado',query:'liver'},{label:'Páncreas',query:'pancreas'},{label:'Riñones',query:'kidney'},{label:'Músculo',query:'muscle'}
];

export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState<SceneState>(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[details,setDetails]=useState(false),[mode,setMode]=useState<Mode>('actual');

 useEffect(()=>{const abort=new AbortController();fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('No se pudo cargar el atlas anatómico.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);

 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])??[]),[atlas]);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const findConcept=(query:string)=>atlas?.concepts.find(c=>c.name.toLowerCase()===query)??atlas?.concepts.find(c=>c.name.toLowerCase().includes(query))??null;
 const openConcept=(c:Concept,openPanel=true)=>{setChosen(c);setMode('actual');setState(s=>({...s,selected:c.elements,isolate:false,explode:0,rotate:false,reset:s.reset+1}));setDetails(openPanel);};
 const openOrgan=(query:string)=>{if(!query){reset();return;}const c=findConcept(query);if(c)openConcept(c,true);};
 const openLiver=()=>openOrgan('liver');
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p||!atlas)return;const lower=p.name.toLowerCase();if(lower.includes('liver')){openLiver();return;}const concept=atlas.concepts.find(c=>c.id===p.conceptId)??atlas.concepts.find(c=>c.elements.includes(id));if(concept)openConcept(concept,true);};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setDetails(false);setMode('actual');};
 const isLiver=chosen?.name.toLowerCase().includes('liver')??false;
 const score=mode==='actual'?liverVli.current:liverVli.target,age=mode==='actual'?liverVli.currentAge:liverVli.targetAge,accent=mode==='actual'?'#ff922e':'#36f29a';
 const rotateSelected=()=>{if(!chosen)return;setState(s=>({...s,isolate:true,rotate:!s.rotate,explode:0,reset:s.reset+1}));};
 const showBody=()=>setState(s=>({...s,isolate:false,rotate:false,reset:s.reset+1}));

 return <main className="studio vli-studio">
  <style>{`
   .vli-studio{background:#020b14;color:#effcff;overflow:hidden}.vli-studio .scene{inset:0 360px 0 190px!important}.vli-studio .identity{left:24px;top:18px;z-index:20}.vli-studio .identity h1{color:#effcff;font-size:24px;text-shadow:0 0 24px rgba(66,215,255,.22)}.vli-studio .identity-meta{color:#83b8ca}.vli-studio .eyebrow{color:#67e8f9}.vli-studio .glass{background:rgba(4,20,34,.78)!important;border-color:rgba(78,210,255,.22)!important;backdrop-filter:blur(16px)}.vli-left{position:absolute;z-index:18;left:16px;top:104px;width:160px;display:grid;gap:8px}.vli-left button{justify-content:flex-start;height:48px;border:1px solid rgba(105,218,255,.16);background:rgba(5,28,48,.72);color:#dff8ff;border-radius:12px}.vli-left button.active{border-color:#ff9b37;background:linear-gradient(90deg,rgba(153,73,10,.72),rgba(50,31,20,.65));box-shadow:0 0 24px rgba(255,146,46,.22)}.vli-tools{position:absolute;z-index:18;right:374px;top:31%;display:grid;gap:8px}.vli-tools button{width:66px;height:52px;display:flex;flex-direction:column;gap:2px;background:rgba(4,24,38,.84);border:1px solid rgba(96,219,255,.24);color:#eaffff;border-radius:12px;font-size:11px}.vli-tools button.active{border-color:#43e3ff;box-shadow:0 0 20px rgba(67,227,255,.2)}.vli-status{position:absolute;z-index:18;left:210px;bottom:18px;right:380px;display:flex;justify-content:center;gap:8px}.vli-status button{min-width:104px;background:rgba(4,24,38,.84);border:1px solid rgba(96,219,255,.20);color:#eaffff;border-radius:12px}.vli-status button.active{border-color:#43e3ff;box-shadow:0 0 18px rgba(67,227,255,.18)}.vli-studio .detail-sheet{width:360px!important;max-width:360px!important;background:rgba(3,16,28,.97)!important;color:#effcff!important;border-left:1px solid rgba(84,220,255,.25)!important}.vli-studio .structure-title{color:#effcff!important;font-size:34px!important}.vli-studio .structure-description,.vli-studio .context-note{color:#a9cbd6!important}.vli-studio .detail-actions{background:linear-gradient(180deg,transparent,rgba(3,16,28,.99))}.vli-studio .studio-footer,.vli-studio .scene-caption,.vli-studio .bottom-dock,.vli-studio .view-controls,.vli-studio .top-actions{display:none!important}.vli-studio .status-dot{box-shadow:0 0 18px #31dfff}.vli-logo{font-size:42px;font-weight:900;letter-spacing:-.06em;line-height:1}.vli-sub{font-size:11px;letter-spacing:.16em;color:#8edfff;margin-top:3px}.vli-topnav{position:absolute;z-index:18;top:18px;left:46%;transform:translateX(-50%);display:flex;gap:22px;font-size:12px;color:#9dc7d6}.vli-topnav span:first-child{color:#55e6ff;border-bottom:2px solid #55e6ff;padding-bottom:8px}.vli-badge{position:absolute;z-index:18;left:210px;top:112px;padding:8px 12px;border-radius:12px;background:rgba(5,28,48,.72);border:1px solid rgba(105,218,255,.16);font-size:12px;color:#bdeeff}.vli-badge strong{color:#fff}.vli-studio .loading{z-index:40}.vli-studio .error{z-index:40}@media(max-width:900px){.vli-studio .scene{inset:0!important}.vli-left{display:none}.vli-tools{right:12px;top:150px}.vli-tools button{width:52px;height:48px}.vli-status{left:12px;right:12px;bottom:14px}.vli-topnav{display:none}.vli-badge{left:16px;top:92px}.vli-studio .detail-sheet{width:min(92vw,360px)!important;max-width:min(92vw,360px)!important}}
  `}</style>

  {atlas&&<AnatomyScene atlas={atlas} state={{...state,inspectorOpen:details&&selectedParts.length>0}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError} clinicalMode={isLiver?mode:null} clinicalFocus={!!chosen}/>} 
  <div className="vignette"/>

  <header className="identity"><div className="vli-logo">VLI™</div><div className="vli-sub">GEMELO BIOLÓGICO CLÍNICO</div><div className="identity-meta">TU SALUD EN 3D</div></header>
  <div className="vli-topnav"><span>Explorar</span><span>Comparar</span><span>Métricas</span><span>Plan</span><span>Informes</span></div>
  <div className="vli-badge">Paciente demo <strong>VLI-0001</strong> · Estado actual → objetivo</div>

  <aside className="vli-left">{organMenu.map(item=><Button key={item.label} variant="ghost" className={(item.query&&chosen?.name.toLowerCase().includes(item.query))||(!item.query&&!chosen)?'active':''} onClick={()=>openOrgan(item.query)}>{item.label}</Button>)}</aside>

  <div className="vli-tools">
   <Button variant="ghost" className={state.rotate?'active':''} onClick={rotateSelected} disabled={!chosen}>{state.rotate?<Pause size={18}/>:<RotateCw size={18}/>}<span>{state.rotate?'Pausar':'Rotar órgano'}</span></Button>
   <Button variant="ghost" onClick={()=>setState(s=>({...s,isolate:true,rotate:false,reset:s.reset+1}))} disabled={!chosen}><Focus size={18}/><span>Aislar</span></Button>
   <Button variant="ghost" onClick={showBody}><span style={{fontSize:19}}>◎</span><span>Cuerpo</span></Button>
   <Button variant="ghost" onClick={reset}><RotateCcw size={18}/><span>Reset</span></Button>
  </div>

  <div className="vli-status">{(['front','three-quarter','side','back'] as View[]).map((v,i)=><Button key={v} variant="ghost" className={state.view===v?'active':''} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))}>{['Anterior','¾','Lateral','Posterior'][i]}</Button>)}</div>

  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Preparando gemelo VLI™</strong><span>{progress}%</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Recargar</Button></div>}

  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}>
   <SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}>
    <div className="detail-header"><div className="detail-accent" style={{background:isLiver?accent:system?.color,boxShadow:isLiver?`0 0 28px ${accent}`:undefined}}/><div className="eyebrow">{isLiver?'VLI™ · RELOJ HEPÁTICO':system?.name??'ANATOMÍA'}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{isLiver?'Hígado':chosen?.name}</SheetTitle>{isLiver&&<div style={{fontSize:12,color:'#9dc7d6'}}>Centro metabólico de tu salud</div>}</div>
    <div className="detail-scroll">
     {isLiver?<>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'0 0 14px'}}><Button onClick={()=>setMode('actual')} variant={mode==='actual'?'default':'ghost'} style={{background:mode==='actual'?'#b95511':undefined}}>ESTADO ACTUAL</Button><Button onClick={()=>setMode('target')} variant={mode==='target'?'default':'ghost'} style={{background:mode==='target'?'#158f62':undefined}}>ESTADO OBJETIVO</Button></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div style={{border:`1px solid ${accent}55`,borderRadius:16,padding:14,background:`${accent}0d`}}><div style={{fontSize:11,opacity:.7}}>Puntaje VLI Hepático</div><div style={{fontSize:42,fontWeight:900,color:accent,textShadow:`0 0 22px ${accent}55`}}>{score}<span style={{fontSize:15,opacity:.6}}>/100</span></div></div><div style={{border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:14,background:'rgba(255,255,255,.03)'}}><div style={{fontSize:11,opacity:.7}}>Edad biológica hepática*</div><div style={{fontSize:27,fontWeight:850,color:accent}}>{age}<span style={{fontSize:14}}> años</span></div></div></div>
      <div style={{marginTop:14,padding:12,borderRadius:14,background:'rgba(255,255,255,.035)',border:'1px solid rgba(255,255,255,.07)'}}><div className="eyebrow">{mode==='actual'?'HALLAZGOS ACTUALES':'OBJETIVOS VLI'}</div><div style={{display:'grid',gap:7,marginTop:9}}>{(mode==='actual'?liverVli.findings:liverVli.goals).map(item=><div key={item} style={{display:'flex',gap:8,fontSize:13}}><span style={{color:accent}}>●</span><span>{item}</span></div>)}</div></div>
      <div style={{marginTop:14,padding:12,borderRadius:14,border:`1px solid ${accent}55`,background:`${accent}10`}}><div style={{fontSize:11,letterSpacing:'.1em',fontWeight:800,color:accent}}>{mode==='actual'?'ESTADO ACTUAL':'ESTADO OBJETIVO'}</div><div style={{marginTop:5,fontWeight:800}}>{mode==='actual'?liverVli.status:'Perfil hepático-metabólico mejorado'}</div><div style={{marginTop:4,fontSize:12,opacity:.72}}>Actual {liverVli.current}/100 → Objetivo {liverVli.target}/100</div></div>
      <p className="context-note" style={{marginTop:14}}>*Puntajes y edades de esta demo son ilustrativos. VLI™ requiere definición y validación científica antes de utilizarse como índice clínico validado.</p>
     </>:<><SheetDescription className="structure-description">{chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription><p className="context-note">Este órgano ya puede tocarse, aislarse y rotarse en 360°. Su reloj clínico VLI se añadirá progresivamente.</p></>}
    </div>
    <div className="detail-actions"><Button className="primary-action" onClick={rotateSelected}>{state.isolate&&state.rotate?<Pause size={18}/>:<RotateCw size={18}/>} {state.isolate&&state.rotate?'Pausar rotación':'Aislar y rotar 360°'}</Button><Button variant="ghost" className="secondary-action" onClick={showBody}>Volver al cuerpo holográfico</Button></div>
   </SheetContent>
  </Sheet>
 </main>;
}
