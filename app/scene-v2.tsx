import {useEffect,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {SYSTEMS,type Atlas,type SceneState} from './anatomy';

type ClinicalMode='actual'|'target'|null;
interface Props {atlas:Atlas;state:SceneState;onSelect:(id:string)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void;clinicalMode?:ClinicalMode;clinicalFocus?:boolean}

type ShaderRef={uniforms:Record<string,{value:any}>};

export default function HologramScene({atlas,state,onSelect,onProgress,onError,clinicalMode=null,clinicalFocus=false}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect),modeRef=useRef<ClinicalMode>(clinicalMode),focusRef=useRef(clinicalFocus);
 latest.current=state;select.current=onSelect;modeRef.current=clinicalMode;focusRef.current=clinicalFocus;

 useEffect(()=>{
  const el=host.current!;
  let disposed=false,frame=0,ready=false,dirty=true,lastView='',lastReset=-1,lastIsolate='',lastFocus=false,lastSelection='';
  const abort=new AbortController();
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('Este navegador no pudo iniciar el motor holográfico 3D.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768?1.35:1.75));
  renderer.setClearColor('#010813');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Gemelo biológico VLI holográfico. Arrastre para rotar, pellizque para zoom y toque un órgano.');

  const scene=new T.Scene();
  scene.fog=new T.FogExp2(0x010813,.045);
  const camera=new T.PerspectiveCamera(32,1,.01,100);
  const controls=new OrbitControls(camera,renderer.domElement);
  camera.position.set(.85,1.08,3.35);controls.target.set(0,.92,0);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=.5;controls.maxDistance=8;controls.maxPolarAngle=Math.PI*.96;
  controls.addEventListener('change',()=>{dirty=true;});

  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.03);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0x75e9ff,0x01030b,1.15));
  const key=new T.DirectionalLight(0xb7f6ff,2.2);key.position.set(-2,3.5,2.5);scene.add(key);
  const rim=new T.DirectionalLight(0x17c7ff,3.2);rim.position.set(2,2,-2.5);scene.add(rim);
  const organLight=new T.PointLight(0xff9a32,4.2,2.2);organLight.position.set(.12,1.12,1.25);scene.add(organLight);
  const coolFill=new T.PointLight(0x17d8ff,2.3,4);coolFill.position.set(-.6,1.4,1.6);scene.add(coolFill);

  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new T.Vector2(1,1),.8,.55,.58);composer.addPass(bloom);composer.addPass(new OutputPass());

  const floorMat=new T.MeshBasicMaterial({color:0x051827,transparent:true,opacity:.45,depthWrite:false});
  const floor=new T.Mesh(new T.CircleGeometry(1.05,96),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
  const rings:T.Mesh[]=[];
  [0.64,0.78,.94].forEach((r,i)=>{const m=new T.Mesh(new T.RingGeometry(r,r+.008,128),new T.MeshBasicMaterial({color:i===0?0x65ecff:0x1cbbe4,transparent:true,opacity:i===0?.72:.3,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=-.005+i*.001;scene.add(m);rings.push(m);});
  const scanRing=new T.Mesh(new T.TorusGeometry(.58,.006,8,120),new T.MeshBasicMaterial({color:0x68f0ff,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false}));scanRing.rotation.x=Math.PI/2;scene.add(scanRing);

  const pCount=220,pPos=new Float32Array(pCount*3);
  for(let i=0;i<pCount;i++){const a=Math.random()*Math.PI*2,r=.75+Math.random()*1.2;pPos[i*3]=Math.cos(a)*r;pPos[i*3+1]=Math.random()*2.05-.03;pPos[i*3+2]=Math.sin(a)*r*.45;}
  const pGeo=new T.BufferGeometry();pGeo.setAttribute('position',new T.BufferAttribute(pPos,3));
  const particles=new T.Points(pGeo,new T.PointsMaterial({color:0x4fdcff,size:.008,transparent:true,opacity:.3,blending:T.AdditiveBlending,depthWrite:false}));scene.add(particles);

  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),partData=new Float32Array(width*4),partTexture=new T.DataTexture(partData,width,1,T.RGBAFormat,T.FloatType);partTexture.needsUpdate=true;
  const selData=new Uint8Array(width*4),selTexture=new T.DataTexture(selData,width,1);selTexture.needsUpdate=true;
  const pickers:(T.Mesh|undefined)[]=[],geometries:T.BufferGeometry[]=[],materials:T.Material[]=[],shaderRefs:ShaderRef[]=[],shellRefs:ShaderRef[]=[];
  const centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));

  const makeBase=(system:string)=>{
   const sys=SYSTEMS.find(s=>s.id===system);const integ=system==='integumentary';
   const m=new T.MeshStandardMaterial({color:sys?.color??'#70cfe0',metalness:.05,roughness:.38,transparent:true,opacity:1,side:T.DoubleSide,depthWrite:false,emissive:new T.Color(sys?.color??'#246070'),emissiveIntensity:.13});
   m.onBeforeCompile=shader=>{
    shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selTexture};shader.uniforms.stateWidth={value:width};shader.uniforms.selectedColor={value:new T.Color('#ff9636')};shader.uniforms.focus={value:0};shader.uniforms.pulse={value:0};shader.uniforms.baseOpacity={value:integ?.12:.30};shader.uniforms.focusOpacity={value:integ?.055:.13};
    shader.vertexShader='attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float vVisible; varying float vSelected;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 suv=vec2((partIndex+0.5)/stateWidth,0.5); vec4 st=texture2D(partState,suv); transformed += st.xyz; vVisible=st.w; vSelected=texture2D(selectionState,suv).r;');
    shader.fragmentShader='uniform vec3 selectedColor; uniform float focus; uniform float pulse; uniform float baseOpacity; uniform float focusOpacity; varying float vVisible; varying float vSelected;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vVisible<0.5) discard;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 cyan=vec3(0.08,0.46,0.70); diffuseColor.rgb=mix(diffuseColor.rgb,cyan,(1.0-vSelected)*0.28); diffuseColor.rgb=mix(diffuseColor.rgb,selectedColor,vSelected*0.92); float a=mix(baseOpacity,focusOpacity,focus); diffuseColor.a=mix(a,0.98,vSelected); diffuseColor.rgb*=mix(1.0,1.25+0.20*pulse,vSelected);');
    shaderRefs.push(shader as ShaderRef);
   };materials.push(m);return m;
  };

  const makeShell=()=>{
   const m=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{partState:{value:partTexture},selectionState:{value:selTexture},stateWidth:{value:width},selectedColor:{value:new T.Color('#ff9636')},focus:{value:0},time:{value:0}},vertexShader:`
    attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth;
    varying float vVisible; varying float vSelected; varying vec3 vWorld; varying vec3 vNormal;
    void main(){vec2 suv=vec2((partIndex+0.5)/stateWidth,0.5);vec4 st=texture2D(partState,suv);vec3 p=position+st.xyz;vVisible=st.w;vSelected=texture2D(selectionState,suv).r;vec4 wp=modelMatrix*vec4(p,1.0);vWorld=wp.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*wp;}
   `,fragmentShader:`
    uniform vec3 selectedColor; uniform float focus; uniform float time; varying float vVisible; varying float vSelected; varying vec3 vWorld; varying vec3 vNormal;
    void main(){if(vVisible<0.5)discard;vec3 viewDir=normalize(cameraPosition-vWorld);float fres=pow(1.0-abs(dot(normalize(vNormal),viewDir)),2.2);float scan=pow(max(0.0,sin(vWorld.y*165.0-time*4.0)),18.0);vec3 c=mix(vec3(0.05,0.62,0.92),selectedColor,vSelected);float ghost=mix(0.11,0.065,focus);float a=ghost+fres*0.22+scan*0.055;a=mix(a,0.48+fres*0.38,vSelected);gl_FragColor=vec4(c,a);}
   `});materials.push(m);shellRefs.push(m as unknown as ShaderRef);return m;
  };

  const baseMats=new Map(SYSTEMS.map(s=>[s.id,makeBase(s.id)]));
  const shellMat=makeShell();
  let loaded=0;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groups=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{if(p.chunk!==ci)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));g.boundingBox=bounds[i].clone();g.computeBoundingSphere();g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));const pick=new T.Mesh(g);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);const list=groups.get(p.system)??[];list.push(g);groups.set(p.system,list);});
   groups.forEach((gs,system)=>{const merged=mergeGeometries(gs,false);if(!merged)throw new Error('No se pudo ensamblar la anatomía VLI.');geometries.push(merged);const base=new T.Mesh(merged,baseMats.get(system as never));base.frustumCulled=false;scene.add(base);const shell=new T.Mesh(merged,shellMat);shell.frustumCulled=false;shell.renderOrder=4;scene.add(shell);});
   loaded++;onProgress(Math.round(loaded/atlas.chunks.length*100));dirty=true;
  };
  (async()=>{try{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<atlas.chunks.length){const i=cursor++;await loadChunk(i);}}));if(!disposed){ready=true;updateState();fitBody();dirty=true;}}catch(e){if(!disposed)onError(e instanceof Error?e.message:'No se pudo cargar la anatomía VLI.');}})();

  const fitBody=()=>{camera.clearViewOffset();const view=latest.current.view;const dir=view==='back'?new T.Vector3(0,.03,-1):view==='side'?new T.Vector3(1,.03,0):view==='three-quarter'?new T.Vector3(.36,.05,1).normalize():new T.Vector3(0,.03,1);controls.target.set(0,.9,0);camera.position.copy(controls.target).addScaledVector(dir,3.15);controls.update();dirty=true;};
  const fitSelection=()=>{const ids=new Set(latest.current.selected);const box=new T.Box3();atlas.parts.forEach((p,i)=>{if(ids.has(p.id))box.union(bounds[i].clone().translate(pickers[i]?.position??new T.Vector3()));});if(box.isEmpty())return;const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),radius=Math.max(size.x,size.y,size.z,.12);controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(.25,.12,1).normalize().multiplyScalar(Math.max(.65,radius*4.3)));controls.update();dirty=true;};

  const updateState=()=>{const s=latest.current,visible=new Set(s.visible),selection=new Set(s.selected),focus=focusRef.current;atlas.parts.forEach((p,i)=>{const selected=selection.has(p.id),show=s.isolate?selected:visible.has(p.system)||selected;const push=focus&&selected&&!s.isolate?.075:0;partData.set([0,0,push,show?1:0],i*4);selData[i*4]=selected?255:0;const pick=pickers[i];if(pick){pick.position.set(0,0,push);pick.updateMatrix();pick.updateMatrixWorld(true);}});partTexture.needsUpdate=true;selTexture.needsUpdate=true;lastFocus=focus;lastSelection=s.selected.join(',');dirty=true;};

  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
  const down=(e:PointerEvent)=>tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);
  const move=(e:PointerEvent)=>tap.move(e.pointerId,e.clientX,e.clientY);
  const cancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
  const up=(e:PointerEvent)=>{if(!tap.up(e.pointerId,e.clientX,e.clientY)||!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);let nearest=Infinity,found=-1;pickers.forEach((mesh,i)=>{if(!mesh||partData[i*4+3]<.5)return;worldBox.copy(bounds[i]).translate(mesh.position);if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hit=raycaster.intersectObject(mesh,false)[0];if(hit&&hit.distance<nearest){nearest=hit.distance;found=i;}});if(found>=0)select.current(atlas.parts[found].id);};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);

  const resize=()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768?1.35:1.75));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);composer.setSize(el.clientWidth,el.clientHeight);bloom.setSize(el.clientWidth,el.clientHeight);dirty=true;};const observer=new ResizeObserver(resize);observer.observe(el);resize();

  const clock=new T.Clock();
  const animate=()=>{if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime,s=latest.current,focus=focusRef.current,mode=modeRef.current,pulse=(Math.sin(time*3.3)+1)/2;
   if(lastFocus!==focus||lastSelection!==s.selected.join(','))updateState();
   shaderRefs.forEach(r=>{r.uniforms.focus.value=focus?1:0;r.uniforms.pulse.value=pulse;r.uniforms.selectedColor.value.set(mode==='target'?'#32f0a0':'#ff9138');});
   shellRefs.forEach(r=>{r.uniforms.focus.value=focus?1:0;r.uniforms.time.value=time;r.uniforms.selectedColor.value.set(mode==='target'?'#32f0a0':'#ff9138');});
   organLight.color.set(mode==='target'?0x33f0a0:0xff9138);organLight.intensity=focus?3.8+1.2*pulse:1.2;
   rings.forEach((r,i)=>{r.rotation.z+=(i%2?-.08:.1)*dt;});scanRing.position.y=.05+((time*.22)%1.85);scanRing.material instanceof T.MeshBasicMaterial&&(scanRing.material.opacity=.22+.28*pulse);particles.rotation.y+=.018*dt;
   if(s.view!==lastView||s.reset!==lastReset){if(s.isolate)fitSelection();else fitBody();lastView=s.view;lastReset=s.reset;}
   const isoKey=s.isolate?s.selected.join(',')+':'+s.reset:'';if(isoKey!==lastIsolate){if(s.isolate)fitSelection();else fitBody();lastIsolate=isoKey;}
   controls.autoRotate=s.rotate;controls.autoRotateSpeed=s.isolate?1.15:.45;controls.update();
   bloom.strength=focus?.88:.58;bloom.radius=.52;bloom.threshold=.52;
   if(controls.autoRotate||focus)dirty=true;
   if(dirty){composer.render();dirty=false;}
  };animate();

  const contextLost=(e:Event)=>{e.preventDefault();onError('La sesión holográfica 3D fue pausada por el dispositivo. Recargue para continuar.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();composer.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());pGeo.dispose();(particles.material as T.Material).dispose();floor.geometry.dispose();floorMat.dispose();rings.forEach(r=>{r.geometry.dispose();(r.material as T.Material).dispose();});scanRing.geometry.dispose();(scanRing.material as T.Material).dispose();env.dispose();partTexture.dispose();selTexture.dispose();renderer.dispose();renderer.domElement.remove();};
 },[atlas]);
 return <div className="scene" ref={host}/>;
}
