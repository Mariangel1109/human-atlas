import type {VliConsultation} from './vli-data';
import type {OrganResult} from './vli-core';

type PassportInput={patientId:string;consultation:VliConsultation;organs:Record<string,OrganResult>;global:number|null;completeness:number;version:string};

const W=1240,H=1754;
const enc=new TextEncoder();
const bytes=(s:string)=>enc.encode(s);
const concat=(parts:Uint8Array[])=>{const n=parts.reduce((a,b)=>a+b.length,0);const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;};
const latin=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function canvasPage(draw:(ctx:CanvasRenderingContext2D)=>void){
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d')!;draw(ctx);return c;
}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=24){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function text(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,size:number,color='#eafcff',weight=500){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Inter,Arial,sans-serif`;ctx.fillText(s,x,y);}
function wrap(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,max:number,line=34,size=24,color='#9fc1cc',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Inter,Arial,sans-serif`;let row='',yy=y;for(const word of s.split(/\s+/)){const t=row?row+' '+word:word;if(ctx.measureText(t).width>max&&row){ctx.fillText(row,x,yy);row=word;yy+=line}else row=t}if(row)ctx.fillText(row,x,yy);return yy;}
const tone=(score:number|null)=>score===null?'#6f91a0':score>=80?'#4ed7a4':score>=60?'#f2b65d':'#ff765f';

function header(ctx:CanvasRenderingContext2D,patientId:string,subtitle:string){
 ctx.fillStyle='#06111d';ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(900,170,0,900,170,560);g.addColorStop(0,'rgba(31,177,201,.18)');g.addColorStop(1,'rgba(6,17,29,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 text(ctx,'VLI™',72,94,54,'#ffffff',900);text(ctx,'LONGEVITY CLINICAL OS',72,130,16,'#6ed9ed',700);text(ctx,subtitle,72,205,20,'#88aab5',600);text(ctx,patientId,1010,96,20,'#c8e8ee',700);
 ctx.strokeStyle='rgba(108,214,232,.18)';ctx.beginPath();ctx.moveTo(72,154);ctx.lineTo(1168,154);ctx.stroke();
}

function pageOne(p:PassportInput){return canvasPage(ctx=>{header(ctx,p.patientId,'PASAPORTE DE LONGEVIDAD - ESTADO ACTUAL');
 text(ctx,'Tu estado biologico hoy',72,284,46,'#ffffff',800);
 wrap(ctx,'Una lectura estructurada de los datos disponibles para mostrar que variables estan moviendo tu estado actual y que informacion falta para completar la evaluacion.',72,330,1000,36,24,'#9fc1cc');
 rounded(ctx,72,430,430,330,30);ctx.fillStyle='rgba(9,31,47,.92)';ctx.fill();ctx.strokeStyle='rgba(105,214,232,.16)';ctx.stroke();
 text(ctx,'VLI GLOBAL',108,486,18,'#7fc7d5',700);text(ctx,p.global===null?'—':String(p.global),108,612,112,tone(p.global),900);text(ctx,'/100',294,612,32,'#7f9faa',700);text(ctx,'Prototipo no validado',108,670,18,'#ffb36b',700);
 text(ctx,`Completitud ${Math.round(p.completeness*100)}%`,108,718,22,'#d7eef2',700);
 rounded(ctx,530,430,638,330,30);ctx.fillStyle='rgba(9,31,47,.92)';ctx.fill();ctx.strokeStyle='rgba(105,214,232,.16)';ctx.stroke();
 text(ctx,'LECTURA CLINICA',566,486,18,'#7fc7d5',700);text(ctx,'Como estoy hoy',566,548,40,'#ffffff',800);
 const organs=Object.values(p.organs).filter(o=>o.score!==null).sort((a,b)=>(a.score??100)-(b.score??100));
 if(organs[0]){text(ctx,`Prioridad principal: ${organs[0].label}`,566,614,28,tone(organs[0].score),800);wrap(ctx,`Puntaje actual ${organs[0].score}/100 con completitud ${Math.round(organs[0].completeness*100)}%.`,566,654,540,34,22,'#b8d2d9');}
 text(ctx,'Relojes biologicos del prototipo',72,842,30,'#ffffff',800);
 const arr=Object.values(p.organs);arr.forEach((o,i)=>{const col=i%2,row=Math.floor(i/2),x=72+col*548,y=900+row*190;rounded(ctx,x,y,510,158,24);ctx.fillStyle='rgba(8,26,40,.86)';ctx.fill();ctx.strokeStyle='rgba(103,210,228,.12)';ctx.stroke();text(ctx,o.label,x+28,y+42,24,'#ffffff',800);text(ctx,o.score===null?'Sin calculo':`${o.score}/100`,x+28,y+93,36,tone(o.score),900);text(ctx,`${o.status} · ${Math.round(o.completeness*100)}% datos`,x+190,y+91,18,'#8eb1bc',600);});
 text(ctx,`Motor ${p.version}`,72,1680,17,'#6f909b',600);text(ctx,'Este documento no sustituye juicio clinico ni constituye un indice validado.',620,1680,17,'#6f909b',600);
});}

function pageTwo(p:PassportInput){return canvasPage(ctx=>{header(ctx,p.patientId,'PASAPORTE DE LONGEVIDAD - VARIABLES Y SEGUIMIENTO');
 text(ctx,'Que variables estan moviendo tu VLI',72,278,42,'#ffffff',800);
 const contrib=Object.values(p.organs).flatMap(o=>o.markers.map(m=>({...m,organ:o.label}))).sort((a,b)=>a.score-b.score).filter((m,i,a)=>a.findIndex(x=>x.key===m.key)===i).slice(0,6);
 let y=350;for(const m of contrib){rounded(ctx,72,y,1096,116,22);ctx.fillStyle='rgba(8,26,40,.86)';ctx.fill();ctx.strokeStyle='rgba(103,210,228,.12)';ctx.stroke();text(ctx,m.label,102,y+44,24,'#ffffff',800);text(ctx,m.organ,102,y+82,17,'#87abb7',600);text(ctx,String(m.value),780,y+58,28,'#dff6fa',800);text(ctx,`${m.score}/100`,1010,y+58,28,tone(m.score),900);y+=136;}
 if(!contrib.length)wrap(ctx,'Aun no hay suficientes marcadores para ordenar prioridades.',72,360,900,36,24,'#9fc1cc');
 y=Math.max(y+30,1170);text(ctx,'Datos de la ultima consulta',72,y,30,'#ffffff',800);y+=50;
 const c=p.consultation;const rows=[['HbA1c',c.hba1c==null?'—':`${c.hba1c}%`],['LDL',c.ldl==null?'—':`${c.ldl} mg/dL`],['Trigliceridos',c.triglycerides==null?'—':`${c.triglycerides} mg/dL`],['AST / ALT',`${c.ast??'—'} / ${c.alt??'—'} U/L`],['Presion arterial',`${c.systolic_bp??'—'} / ${c.diastolic_bp??'—'} mmHg`],['Cintura',c.waist==null?'—':`${c.waist} cm`]];
 rows.forEach((r,i)=>{const yy=y+i*58;text(ctx,r[0],72,yy,20,'#86aab6',600);text(ctx,r[1],700,yy,22,'#edfaff',800);ctx.strokeStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.moveTo(72,yy+18);ctx.lineTo(1168,yy+18);ctx.stroke();});
 text(ctx,'Seguimiento VLI',72,1585,28,'#ffffff',800);wrap(ctx,'La evolucion futura se mostrara como Inicial -> Actual -> Objetivo usando la misma fuente de datos y la misma version del motor para mantener trazabilidad.',72,1622,1040,32,20,'#9fc1cc');
});}

function jpegBytes(c:HTMLCanvasElement){const data=c.toDataURL('image/jpeg',.92).split(',')[1];const bin=atob(data);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
function makePdf(images:Uint8Array[]){const objects:(Uint8Array|null)[]=[null];const add=(b:Uint8Array)=>{objects.push(b);return objects.length-1};const catalog=add(bytes('<< /Type /Catalog /Pages 2 0 R >>'));void catalog;const pagesObj=add(bytes('PAGES_PLACEHOLDER'));const pageIds:number[]=[];
 images.forEach((img)=>{const imageId=add(concat([bytes(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`),img,bytes('\nendstream')]));const content=bytes(`q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ`);const contentId=add(concat([bytes(`<< /Length ${content.length} >>\nstream\n`),content,bytes('\nendstream')]));const pageId=add(bytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));pageIds.push(pageId);});objects[pagesObj]=bytes(`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
 const parts=[bytes('%PDF-1.4\n%VLI\n')];const offsets=[0];let pos=parts[0].length;for(let i=1;i<objects.length;i++){offsets[i]=pos;const block=concat([bytes(`${i} 0 obj\n`),objects[i]!,bytes('\nendobj\n')]);parts.push(block);pos+=block.length;}const xrefPos=pos;let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;parts.push(bytes(xref));return concat(parts);}

export async function downloadVliPassport(input:PassportInput){const p1=pageOne(input),p2=pageTwo(input);const pdf=makePdf([jpegBytes(p1),jpegBytes(p2)]);const blob=new Blob([pdf],{type:'application/pdf'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${latin(input.patientId)}_Pasaporte_VLI.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
