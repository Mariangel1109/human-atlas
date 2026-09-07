import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,Focus,Pause,RotateCcw,RotateCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Sheet,SheetContent,SheetDescription,SheetTitle} from '@/components/ui/sheet';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,explanation,SYSTEMS,type Atlas,type Concept,type SceneState,type View} from './anatomy';
import {VLI_ORGANS,type VliOrganConfig,type VliOrganId,type VliClinicalMode} from './vli-organ-config';

const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'front',rotate:false,reset:0};

export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const [atlas,setAtlas]=useState<Atlas|null>(null);
 const [state,setState]=useState<SceneState>(initial);
 const [progress,setProgress]=useState(0),[error,setError]=useState('');
 const [chosen,setChosen]=useState<Concept|null>(null),[organId,setOrganId]=useState<VliOrganId|null>(null);
 const [details,setDetails]=useState(false),[mode,setMode]=useState<VliClinicalMode>('actual');

 useEffect(()=>{const abort=new AbortController();fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('No se pudo cargar el atlas anatómico.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);

 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])??[]),[atlas]);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const organ=useMemo(()=>VLI_ORGANS.find(o=>o.id===organId)??null,[organId]);
 const findConcept=(queries:string[])=>{if(!atlas)return null;for(const query of queries){const q=query.toLowerCase();const exact=atlas.concepts.find(c=>c.name.toLowerCase()===q);if(exact)return exact;const partial=atlas.concepts.find(c=>c.name.toLowerCase().includes(q));if(partial)return partial;}return null;};
 const openOrgan=(cfg:VliOrganConfig)=>{const c=findConcept(cfg.atlasQueries);if(!c)return;setOrganId(cfg.id);setChosen(c);setMode('actual');setDetails(true);setState(s=>({...s,selected:c.elements,isolate:false,explode:0,rotate:false,reset:s.reset+1}));};
 const inferOrgan=(name:string)=>{const n=name.toLowerCase();return VLI_ORGANS.find(o=>o.atlasQueries.some(q=>n.includes(q)))??null;};
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p||!atlas)return;const cfg=inferOrgan(p.name);const concept=atlas.concepts.find(c=>c.id===p.conceptId)??atlas.concepts.find(c=>c.elements.includes(id));if(cfg&&concept){setOrganId(cfg.id);setChosen(concept);setMode('actual');setDetails(true);setState(s=>({...s,selected:concept.elements,isolate:false,explode:0,rotate:false,reset:s.reset+1}));return;}if(concept){setOrganId(null);setChosen(concept);setDetails(true);setState(s=>({...s,selected:concept.elements,isolate:false,explode:0,rotate:false,reset:s.reset+1}));}};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setOrganId(null);setDetails(false);setMode('actual');};
 const rotateSelected=()=>{if(!chosen)return;setState(s=>({...s,isolate:true,rotate:!s.rotate,explode:0,reset:s.reset+1}));};
 const isolateSelected=()=>{if(!chosen)return;setState(s=>({...s,isolate:true,rotate:false,explode:0,reset:s.reset+1}));};
 const showBody=()=>setState(s=>({...s,isolate:false,rotate:false,reset:s.reset+1}));
 const score=organ?(mode==='actual'?organ.currentScore:organ.targetScore):undefined;
 const age=organ?(mode==='actual'?organ.currentBiologicalAge:organ.targetBiologicalAge):undefined;
 const accent=mode==='actual'?'#ff9138':'#36e8a2';
 const items=organ?(mode==='actual'?organ.findings:organ.goals):undefined;

 return <main className="studio vli-studio">
  <style>{`
   .vli-studio{background:#020814;color:#effcff;overflow:hidden}.vli-studio .scene{inset:0 370px 0 188px!important}.vli-studio .glass{background:rgba(3,17,31,.88)!important;border-color:rgba(77,218,255,.22)!important;backdrop-filter:blur(16px)}
   .vli-brand{position:absolute;z-index:20;left:22px;top:18px}.vli-logo{font-size:42px;font-weight:900;letter-spacing:-.06em}.vli-sub{font-size:11px;letter-spacing:.14em;color:#8edfff}.vli-topnav{position:absolute;z-index:18;top:22px;left:50%;transform:translateX(-50%);display:flex;gap:28px;color:#8eb8c7;font-size:12px}.vli-topnav b{color:#61e7ff;border-bottom:2px solid #61e7ff;padding-bottom:8px}
   .vli-left{position:absolute;z-index:18;left:14px;top:108px;width:160px;display:grid;gap:8px}.vli-left button{justify-content:flex-start;height:46px;background:rgba(5,28,48,.76);border:1px solid rgba(105,218,255,.15);color:#dff8ff;border-radius:12px}.vli-left button.active{border-color:${accent};box-shadow:0 0 22px ${accent}33;background:${accent}18}.core-tag{margin-left:auto;font-size:9px;opacity:.6}
   .vli-badge{position:absolute;z-index:18;left:205px;top:100px;padding:8px 12px;border-radius:12px;background:rgba(3,18,31,.82);border:1px solid rgba(103,224,255,.18);font-size:12px;color:#bdeeff}.vli-badge strong{color:#fff}
   .vli-tools{position:absolute;z-index:18;right:382px;top:31%;display:grid;gap:8px}.vli-tools button{width:72px;height:54px;display:flex;flex-direction:column;gap:2px;background:rgba(3,22,38,.88);border:1px solid rgba(96,219,255,.22);color:#eaffff;border-radius:12px;font-size:11px}.vli-tools button.active{border-color:#43e3ff;box-shadow:0 0 18px rgba(67,227,255,.18)}
   .vli-views{position:absolute;z-index:18;left:205px;bottom:18px;right:385px;display:flex;justify-content:center;gap:8px}.vli-views button{min-width:100px;background:rgba(3,22,38,.86);border:1px solid rgba(96,219,255,.18);color:#eaffff;border-radius:12px}.vli-views button.active{border-color:#43e3ff;box-shadow:0 0 16px rgba(67,227,255,.18)}
   .vli-studio .detail-sheet{width:370px!important;max-width:370px!important;background:rgba(2,12,22,.97)!important;color:#effcff!important;border-left:1px solid rgba(84,220,255,.25)!important}.vli-studio .structure-title{color:#fff!important;font-size:32px!important}.vli-studio .structure-description,.vli-studio .context-note{color:#a8c7d2!important}.metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.metric-card{border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:14px;background:rgba(255,255,255,.03)}.metric-value{font-size:38px;font-weight:900}.vli-list{display:grid;gap:8px;margin-top:10px}.vli-item{display:flex;gap:8px;font-size:13px}.empty-clinical{margin-top:14px;padding:14px;border-radius:14px;border:1px dashed rgba(112,223,255,.25);background:rgba(77,218,255,.05);color:#b8d5df;font-size:13px}.vli-studio .studio-footer,.vli-studio .scene-caption,.vli-studio .bottom-dock,.vli-studio .view-controls,.vli-studio .top-actions{display:none!important}
   @media(max-width:900px){.vli-studio .scene{inset:0!important}.vli-left{display:none}.vli-topnav{display:none}.vli-brand{left:16px;top:14px}.vli-logo{font-size:34px}.vli-badge{left:16px;top:84px;right:16px;text-align:center}.vli-tools{right:10px;top:145px}.vli-tools button{width:58px;height:50px}.vli-views{left:8px;right:8px;bottom:10px;overflow-x:auto;justify-content:flex-start}.vli-views button{min-width:100px}.vli-studio .detail-sheet{width:min(92vw,370px)!important;max-width:min(92vw,370px)!important}}
  `}</style>

  {atlas&&<AnatomyScene atlas={atlas} state={{...state,inspectorOpen:details&&selectedParts.length>0}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError} clinicalMode={organ?mode:null} clinicalFocus={!!chosen}/>} 
  <div className="vignette"/>
  <header className="vli-brand"><div className="vli-logo">VLI™</div><div className="vli-sub">GEMELO BIOLÓGICO CLÍNICO</div></header>
  <div className="vli-topnav"><b>Explorar</b><span>Comparar</span><span>Métricas</span><span>Plan</span><span>Informes</span></div>
  <div className="vli-badge">Paciente demo <strong>VLI-0001</strong> · Estado actual → objetivo</div>

  <aside className="vli-left"><Button variant="ghost" className={!organId?'active':''} onClick={reset}>Vista general</Button>{VLI_ORGANS.map(o=><Button key={o.id} variant="ghost" className={organId===o.id?'active':''} onClick={()=>openOrgan(o)}>{o.label}{o.isCoreClock&&<span className="core-tag">VLI CORE</span>}</Button>)}</aside>

  <div className="vli-tools"><Button variant="ghost" className={state.rotate?'active':''} onClick={rotateSelected} disabled={!chosen}>{state.rotate?<Pause size={18}/>:<RotateCw size={18}/>}<span>{state.rotate?'Pausar':'Rotar'}</span></Button><Button variant="ghost" onClick={isolateSelected} disabled={!chosen}><Focus size={18}/><span>Aislar</span></Button><Button variant="ghost" onClick={showBody}><span style={{fontSize:19}}>◎</span><span>Cuerpo</span></Button><Button variant="ghost" onClick={reset}><RotateCcw size={18}/><span>Reset</span></Button></div>

  <div className="vli-views">{(['front','three-quarter','side','back'] as View[]).map((v,i)=><Button key={v} variant="ghost" className={state.view===v?'active':''} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))}>{['Anterior','¾','Lateral','Posterior'][i]}</Button>)}</div>

  {progress<100&&!error&&<div className="loading glass"><Activity size={18}/><div><strong>Preparando gemelo VLI™</strong><span>{progress}%</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Recargar</Button></div>}

  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}>
   <div className="detail-header"><div className="detail-accent" style={{background:organ?accent:system?.color,boxShadow:organ?`0 0 24px ${accent}`:undefined}}/><div className="eyebrow">{organ?(organ.isCoreClock?'VLI™ · RELOJ BIOLÓGICO':'VLI™ · ÓRGANO SECUNDARIO'):(system?.name??'ANATOMÍA')}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{organ?.label??chosen?.name}</SheetTitle>{organ&&<div style={{fontSize:12,color:'#9dc7d6'}}>{organ.subtitle}</div>}</div>
   <div className="detail-scroll">{organ?<>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}><Button onClick={()=>setMode('actual')} variant={mode==='actual'?'default':'ghost'} style={{background:mode==='actual'?'#a94e17':undefined}}>ESTADO ACTUAL</Button><Button onClick={()=>setMode('target')} variant={mode==='target'?'default':'ghost'} style={{background:mode==='target'?'#147c59':undefined}}>ESTADO OBJETIVO</Button></div>
    {(score!==undefined||age!==undefined)?<><div className="metric-grid"><div className="metric-card"><div style={{fontSize:11,opacity:.7}}>Puntaje VLI</div><div className="metric-value" style={{color:accent}}>{score??'—'}{score!==undefined&&<span style={{fontSize:14,opacity:.6}}>/100</span>}</div></div><div className="metric-card"><div style={{fontSize:11,opacity:.7}}>Edad biológica*</div><div style={{fontSize:27,fontWeight:850,color:accent}}>{age??'—'}{age!==undefined&&<span style={{fontSize:13}}> años</span>}</div></div></div>{items?.length?<div style={{marginTop:14}}><div className="eyebrow">{mode==='actual'?'HALLAZGOS ACTUALES':'OBJETIVOS VLI'}</div><div className="vli-list">{items.map(item=><div className="vli-item" key={item}><span style={{color:accent}}>●</span><span>{item}</span></div>)}</div></div>:null}</>:<div className="empty-clinical">La anatomía e interacción 3D están activas. Este órgano todavía no tiene suficientes variables clínicas cargadas para mostrar un puntaje o edad biológica sin inventar datos.</div>}
    <p className="context-note" style={{marginTop:14}}>*Los puntajes y edades del prototipo son ilustrativos hasta definir y validar científicamente el algoritmo VLI™.</p>
   </>:<><SheetDescription className="structure-description">{chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription><p className="context-note">Estructura anatómica interactiva: puede tocarse, aislarse y rotarse en 360°.</p></>}</div>
   <div className="detail-actions"><Button className="primary-action" onClick={rotateSelected}>{state.isolate&&state.rotate?<Pause size={18}/>:<RotateCw size={18}/>} {state.isolate&&state.rotate?'Pausar rotación':'Aislar y rotar 360°'}</Button><Button variant="ghost" className="secondary-action" onClick={showBody}>Ver dentro del cuerpo</Button></div>
  </SheetContent></Sheet>
 </main>;
}
