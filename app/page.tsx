import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,Focus,Pause,RotateCcw,RotateCw,Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Sheet,SheetContent,SheetDescription,SheetTitle} from '@/components/ui/sheet';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,explanation,SYSTEMS,type Atlas,type Concept,type SceneState,type View} from './anatomy';

const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0};
type Mode='actual'|'target';

const liverVli={
 current:52,target:86,currentAge:57,targetAge:51,status:'Compromiso hepático moderado',
 findings:['Hígado graso grado 2','AST 50 U/L','ALT 45 U/L','Triglicéridos 190 mg/dL'],
 goals:['Reducir esteatosis hepática','Normalizar enzimas hepáticas','Mejorar perfil metabólico','Disminuir triglicéridos y adiposidad visceral'],
};

export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState<SceneState>(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[details,setDetails]=useState(false),[mode,setMode]=useState<Mode>('actual');

 useEffect(()=>{const abort=new AbortController();fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('No se pudo cargar el atlas anatómico.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);

 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])??[]),[atlas]);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const findLiver=()=>atlas?.concepts.find(c=>c.name.toLowerCase()==='liver')??atlas?.concepts.find(c=>c.name.toLowerCase().includes('liver'))??null;
 const openConcept=(c:Concept)=>{setChosen(c);setMode('actual');setState(s=>({...s,selected:c.elements,isolate:false,explode:0,rotate:false,reset:s.reset+1}));setDetails(true);};
 const openLiver=()=>{const liver=findLiver();if(liver)openConcept(liver);};
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p||!atlas)return;const lower=p.name.toLowerCase();if(lower.includes('liver')){openLiver();return;}const concept=atlas.concepts.find(c=>c.id===p.conceptId)??atlas.concepts.find(c=>c.elements.includes(id));if(concept)openConcept(concept);};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setDetails(false);setMode('actual');};
 const isLiver=chosen?.name.toLowerCase().includes('liver')??false;
 const score=mode==='actual'?liverVli.current:liverVli.target,age=mode==='actual'?liverVli.currentAge:liverVli.targetAge,accent=mode==='actual'?'#ff922e':'#36f29a';

 return <main className="studio vli-studio">
  <style>{`
   .vli-studio{background:#03131f;color:#effcff}.vli-studio .identity h1{color:#effcff;text-shadow:0 0 24px rgba(66,215,255,.18)}.vli-studio .identity-meta,.vli-studio .studio-footer,.vli-studio .scene-caption{color:#9dc7d6}.vli-studio .eyebrow{color:#67e8f9}.vli-studio .glass{background:rgba(4,24,38,.76)!important;border-color:rgba(84,220,255,.24)!important;box-shadow:0 20px 70px rgba(0,0,0,.28)!important;backdrop-filter:blur(16px)}.vli-studio .top-actions button,.vli-studio .view-controls button,.vli-studio .bottom-dock button{color:#effcff}.vli-studio .bottom-dock{color:#effcff}.vli-studio .detail-sheet{background:rgba(3,19,31,.95)!important;color:#effcff!important;border-left:1px solid rgba(84,220,255,.28)!important}.vli-studio .structure-title{color:#effcff!important}.vli-studio .structure-description,.vli-studio .context-note{color:#a9cbd6!important}.vli-studio .detail-actions{background:linear-gradient(180deg,transparent,rgba(3,19,31,.98))}.vli-studio .scene-caption{letter-spacing:.16em}.vli-studio .status-dot{box-shadow:0 0 18px #31dfff}
  `}</style>

  {atlas&&<AnatomyScene atlas={atlas} state={{...state,inspectorOpen:details&&selectedParts.length>0}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError} clinicalMode={isLiver?mode:null} clinicalFocus={isLiver}/>} 
  <div className="vignette"/>

  <header className="identity"><div className="eyebrow"><span className="status-dot"/> VLI™ · DIGITAL TWIN</div><h1>Gemelo Biológico Clínico <Badge variant="outline" className="edition">3D</Badge></h1><div className="identity-meta">Paciente demo VLI-0001 <span>·</span> Estado actual → objetivo</div></header>

  <div className="top-actions" style={{display:'flex',gap:8}}><Button variant="ghost" onClick={openLiver}><Search size={18}/><span>Hígado VLI</span></Button><Button variant="ghost" onClick={()=>setState(s=>({...s,rotate:!s.rotate,isolate:false}))}>{state.rotate?<Pause size={18}/>:<RotateCw size={18}/>}<span>{state.rotate?'Pausar':'Rotar 360°'}</span></Button></div>

  <nav className="view-controls glass" aria-label="Vistas 3D">{(['three-quarter','front','side','back'] as View[]).map((v,i)=><Button variant="ghost" key={v} className={state.view===v?'active':''} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))}><span>{['¾','F','S','B'][i]}</span></Button>)}<i/><Button variant="ghost" onClick={reset}><RotateCcw size={17}/></Button></nav>

  <div className="scene-caption"><span className="caption-line"/><span>{isLiver?`HÍGADO VLI · ${mode==='actual'?'ESTADO ACTUAL':'ESTADO OBJETIVO'}`:'TOQUE UN ÓRGANO PARA EXPLORARLO'}</span><span className="caption-line"/></div>

  <div className="bottom-dock glass" style={{padding:'10px 14px',gap:10}}><div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}><span style={{fontSize:11,letterSpacing:'.14em',fontWeight:800,color:'#67e8f9'}}>VLI™</span><span style={{fontSize:12,opacity:.72}}>Actual</span><strong style={{fontSize:22}}>61</strong><span style={{opacity:.45}}>→</span><span style={{fontSize:12,opacity:.72}}>Objetivo</span><strong style={{fontSize:22}}>85</strong></div><Button variant="ghost" onClick={openLiver}>Explorar hígado</Button></div>

  <footer className="studio-footer"><span>Arrastra para rotar <b>·</b> Pellizca para zoom <b>·</b> Toca para inspeccionar</span><span>BodyParts3D · CC BY 4.0</span></footer>

  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Preparando gemelo VLI™</strong><span>{progress}%</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Recargar</Button></div>}

  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}>
   <SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}>
    <div className="detail-header"><div className="detail-accent" style={{background:isLiver?accent:system?.color,boxShadow:isLiver?`0 0 24px ${accent}`:undefined}}/><div className="eyebrow">{isLiver?'VLI™ · RELOJ HEPÁTICO':system?.name??'ANATOMÍA'}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{isLiver?'Hígado':chosen?.name}</SheetTitle></div>
    <div className="detail-scroll">
     {isLiver?<>
      <div style={{display:'flex',gap:8,margin:'0 0 16px'}}><Button onClick={()=>setMode('actual')} variant={mode==='actual'?'default':'ghost'} style={{flex:1,background:mode==='actual'?'#b95511':undefined}}>ESTADO ACTUAL</Button><Button onClick={()=>setMode('target')} variant={mode==='target'?'default':'ghost'} style={{flex:1,background:mode==='target'?'#158f62':undefined}}>ESTADO OBJETIVO</Button></div>
      <div style={{border:`1px solid ${accent}55`,borderRadius:18,padding:16,background:`${accent}0d`,boxShadow:`0 0 34px ${accent}12`}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:12}}><div><div style={{fontSize:11,letterSpacing:'.12em',opacity:.65}}>PUNTAJE HEPÁTICO VLI™</div><div style={{fontSize:46,fontWeight:900,lineHeight:1,color:accent,textShadow:`0 0 22px ${accent}55`}}>{score}<span style={{fontSize:16,opacity:.6}}>/100</span></div></div><div style={{textAlign:'right'}}><div style={{fontSize:11,opacity:.65}}>Edad biológica hepática*</div><div style={{fontSize:26,fontWeight:800}}>{age} años</div></div></div><div style={{height:9,borderRadius:99,background:'rgba(255,255,255,.10)',marginTop:14,overflow:'hidden'}}><div style={{height:'100%',width:`${score}%`,background:accent,boxShadow:`0 0 16px ${accent}`,transition:'all .35s ease'}}/></div></div>
      <div style={{marginTop:18}}><div className="eyebrow">{mode==='actual'?'QUÉ ESTÁ PASANDO HOY':'A DÓNDE QUEREMOS LLEGAR'}</div><div style={{display:'grid',gap:8,marginTop:9}}>{(mode==='actual'?liverVli.findings:liverVli.goals).map(item=><div key={item} style={{display:'flex',gap:9,padding:'10px 12px',borderRadius:12,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',fontSize:13}}><span style={{color:accent}}>●</span><span>{item}</span></div>)}</div></div>
      <div style={{marginTop:18,padding:13,borderRadius:14,border:`1px solid ${accent}55`,background:`${accent}10`}}><div style={{fontSize:11,letterSpacing:'.11em',fontWeight:800,color:accent}}>{mode==='actual'?'ESTADO ACTUAL':'ESTADO BIOLÓGICO OBJETIVO'}</div><div style={{marginTop:5,fontWeight:800}}>{mode==='actual'?liverVli.status:'Perfil hepático-metabólico mejorado'}</div><div style={{marginTop:4,fontSize:12,opacity:.72}}>Actual {liverVli.current}/100 → Objetivo {liverVli.target}/100</div></div>
      <p className="context-note" style={{marginTop:16}}>*Los puntajes y edades biológicas de esta demo son ilustrativos. VLI™ todavía requiere definición y validación científica antes de uso clínico como índice validado.</p>
     </>:<><SheetDescription className="structure-description">{chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription><p className="context-note">Esta estructura todavía no tiene un reloj VLI configurado. La primera versión funcional está activa para hígado.</p></>}
    </div>
    <div className="detail-actions"><Button className="primary-action" onClick={()=>setState(s=>({...s,isolate:!s.isolate,explode:0,reset:s.reset+1}))}><Focus size={18}/>{state.isolate?'Volver al cuerpo holográfico':'Aislar órgano'}</Button>{isLiver&&<Button variant="ghost" className="secondary-action" onClick={()=>setMode(mode==='actual'?'target':'actual')}>Cambiar a {mode==='actual'?'objetivo':'actual'}</Button>}</div>
   </SheetContent>
  </Sheet>
 </main>;
}
