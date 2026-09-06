export type DiagramKind='patient'|'twin';
export type DiagramRecord={patientId:string;kind:DiagramKind;blob:Blob;updatedAt:string};

const DB='vli-diagrams-v1',STORE='diagrams';
function openDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:['patientId','kind']});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
export async function saveDiagram(patientId:string,kind:DiagramKind,file:File){
 const db=await openDb();
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({patientId,kind,blob:file,updatedAt:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
 db.close();
}
export async function getDiagram(patientId:string,kind:DiagramKind):Promise<DiagramRecord|undefined>{
 const db=await openDb();
 const result=await new Promise<DiagramRecord|undefined>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get([patientId,kind]);req.onsuccess=()=>resolve(req.result as DiagramRecord|undefined);req.onerror=()=>reject(req.error);});
 db.close();return result;
}
export async function deleteDiagram(patientId:string,kind:DiagramKind){
 const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete([patientId,kind]);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
}
