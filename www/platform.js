/* CLICQUE platform layer.
   Inside the Claude artifact viewer, window.claude already exists and this file does nothing.
   In the real app (Capacitor), it provides the same db / user / sample interface on top of
   Supabase (database + realtime + anonymous auth) and a Supabase Edge Function (Claude dialogue). */
(function(){
if(window.claude&&window.claude.use)return;
const C=window.CLICQUE_CONFIG||{};
let sbP=null;
function getSB(){if(sbP)return sbP;
sbP=(async()=>{try{
if(!window.supabase||!C.SUPABASE_URL||/YOUR/.test(C.SUPABASE_URL))return null;
const sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
let s=(await sb.auth.getSession()).data.session;
if(!s){const r=await sb.auth.signInAnonymously();if(r.error)return null;s=r.data.session}
sb.__uid=s.user.id;return sb}catch(e){return null}})();return sbP}
const merge=(a,b)=>{const o={...a};for(const k in b){const x=b[k];o[k]=(x&&typeof x==='object'&&!Array.isArray(x)&&a&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))?merge(a[k],x):x}return o};
const snapDoc=(id,data)=>Object.freeze({id,exists:data!==undefined&&data!==null,data:()=>(data===null?undefined:data),metadata:{fromCache:false,hasPendingWrites:false}});
const err=(code,message)=>({code,message});
const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
function mkDb(sb){
const parentOf=p=>p.split('/').slice(0,-1).join('/'),idOf=p=>p.split('/').pop();
function docRef(path){return{id:idOf(path),path,
async get(){const{data,error}=await sb.from('docs').select('data').eq('path',path).maybeSingle();if(error)throw err('unavailable',error.message);return snapDoc(idOf(path),data?data.data:null)},
async set(d){const{error}=await sb.from('docs').upsert({path,parent:parentOf(path),id:idOf(path),data:d});if(error)throw err('invalid_argument',error.message)},
async update(d){const s=await this.get();if(!s.exists)throw err('invalid_argument','document does not exist');await this.set(merge(s.data(),d))},
async delete(){const{error}=await sb.from('docs').delete().eq('path',path);if(error)throw err('unavailable',error.message)},
collection(sub){return colRef(path+'/'+sub)},
onSnapshot(next,error){let on=true;const emit=d=>{if(on)next(snapDoc(idOf(path),d))};
this.get().then(s=>emit(s.exists?s.data():null)).catch(e=>error&&error(e));
const ch=sb.channel('d:'+path+rid()).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'path=eq.'+path},p=>{emit(p.eventType==='DELETE'?null:p.new.data)}).subscribe();
return()=>{on=false;sb.removeChannel(ch)}}}}
function colRef(path){
const q=(filters,ord,lim)=>({
where(f,op,v){if(op!=='=='&&op!=='===')throw err('invalid_argument','only == is supported');return q([...filters,[f,v]],ord,lim)},
orderBy(f,dir){return q(filters,[f,dir||'asc'],lim)},
limit(n){return q(filters,ord,n)},
async _fetch(){let r=sb.from('docs').select('id,data').eq('parent',path);filters.forEach(([f,v])=>{r=r.eq('data->>'+f,String(v))});if(ord)r=r.order('data->'+ord[0],{ascending:ord[1]!=='desc'});if(lim)r=r.limit(lim);const{data,error}=await r;if(error)throw err('unavailable',error.message);return data||[]},
onSnapshot(next,error){let on=true,map=new Map(),prev=new Map();
const match=d=>filters.every(([f,v])=>String(d[f])===String(v));
const view=()=>{let a=[...map.entries()].map(([id,d])=>({id,d}));if(ord)a.sort((x,y)=>(x.d[ord[0]]>y.d[ord[0]]?1:x.d[ord[0]]<y.d[ord[0]]?-1:0)*(ord[1]==='desc'?-1:1));if(lim)a=a.slice(0,lim);return a};
const emit=()=>{if(!on)return;const a=view(),cur=new Map(a.map(x=>[x.id,x.d])),ch=[];
a.forEach((x,i)=>{if(!prev.has(x.id))ch.push({type:'added',doc:snapDoc(x.id,x.d),oldIndex:-1,newIndex:i});else if(prev.get(x.id)!==x.d)ch.push({type:'modified',doc:snapDoc(x.id,x.d),oldIndex:i,newIndex:i})});
prev.forEach((d,id)=>{if(!cur.has(id))ch.push({type:'removed',doc:snapDoc(id,d),oldIndex:0,newIndex:-1})});
prev=cur;next({docs:a.map(x=>snapDoc(x.id,x.d)),size:a.length,empty:!a.length,docChanges:()=>ch,metadata:{fromCache:false,hasPendingWrites:false}})};
this._fetch().then(rows=>{rows.forEach(r=>map.set(r.id,r.data));emit()}).catch(e=>error&&error(e));
const chn=sb.channel('c:'+path+rid()).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'parent=eq.'+path},p=>{if(p.eventType==='DELETE'){map.delete(p.old.id)}else{const r=p.new;if(match(r.data))map.set(r.id,r.data);else map.delete(r.id)}emit()}).subscribe();
return()=>{on=false;sb.removeChannel(chn)}}});
return{...q([],null,null),doc(id){return docRef(path+'/'+(id||rid()))},async add(d){const ref=docRef(path+'/'+rid());await ref.set(d);return ref}}}
return{doc:docRef,collection:colRef}}
function mkUser(sb){const id=sb.__uid;return{id:async()=>id,can:async()=>true,isOwner:async()=>false,canEdit:async()=>false,me:async()=>({id,name:''}),name:async()=>''}}
function mkSample(sb){
const sample=async(input)=>{const prompt=typeof input==='string'?input:input.map(m=>m.content).join('\n');
const r=await sb.functions.invoke('chat-ai',{body:{prompt}});
if(r.error){const st=r.error.context&&r.error.context.status;throw err(st===429?'rate_limited':st===401?'not_granted':'unavailable',String(r.error.message||''))}
return{text:(r.data&&r.data.text)||'',truncated:false}};
sample.json=async(input,o)=>{const r=await sample(input,o),m=r.text.match(/[\[{][\s\S]*[\]}]/);try{return JSON.parse(m?m[0]:r.text)}catch(e){throw{code:'invalid_json',message:'bad json',text:r.text}}};
return sample}
window.claude={use:async name=>{const sb=await getSB();if(!sb)return null;
if(name==='db')return mkDb(sb);if(name==='user')return mkUser(sb);if(name==='sample')return mkSample(sb);return null}};
window.__clicqueShim={mkDb,mkUser,mkSample,merge};
window.__clicqueAdmin={call:async body=>{const sb=await getSB();if(!sb)throw new Error('Server not configured');
const r=await sb.functions.invoke('admin-config',{body});
if(r.error){let msg='';try{msg=(await r.error.context.json()).error}catch(e){}throw new Error(msg||String(r.error.message||'error'))}return r.data}};
window.__clicqueRooms={call:async(action,code,details={})=>{const sb=await getSB();if(!sb)throw new Error('Server not configured');
const names={join:'clicque_room_join',heartbeat:'clicque_room_heartbeat',leave:'clicque_room_leave',start:'clicque_room_start'};const fn=names[action];if(!fn)throw new Error('Unknown room action');
const args=action==='start'||action==='leave'?{p_code:code}:{p_code:code,p_name:details.name||'',p_emo:details.emo||'',p_codeword:details.code||''};
const r=await sb.rpc(fn,args);if(r.error)throw err('unavailable',r.error.message);return r.data}};
window.__clicqueShim.diag=async()=>{const out=[],C2=window.CLICQUE_CONFIG||{};
out.push({ok:!!(C2.SUPABASE_URL&&!/YOUR/.test(C2.SUPABASE_URL)&&C2.SUPABASE_ANON_KEY&&!/YOUR/.test(C2.SUPABASE_ANON_KEY)),name:'config.js has your Supabase URL and key',hint:'Open www/config.js, paste the Project URL and anon key from Supabase (Project Settings, API), then upload the www folder again.'});
out.push({ok:!!window.supabase,name:'Supabase library loaded',hint:'The library did not load. Check the internet connection or run npm run vendor.'});
const sb=await getSB();out.push({ok:!!sb,name:'Connected and signed in',hint:'In Supabase turn on Authentication, Providers, Anonymous sign-ins, and check the URL and key in config.js.'});
if(sb)for(const fn of ['chat-ai','admin-config']){let ok=false;try{const x=await sb.functions.invoke(fn,{body:{}});const st=x.error&&x.error.context&&x.error.context.status;ok=!x.error||(typeof st==='number'&&st!==404)}catch(e){ok=false}
out.push({ok,name:'Function '+fn+' is deployed '+(fn==='chat-ai'?'(AI chat)':'(developer settings)'),hint:'Run: supabase functions deploy '+fn})}
return out};
})();
