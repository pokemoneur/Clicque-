// Tests the Supabase-backed db shim against an in-memory mock of the supabase-js client.
const fs=require('fs'),assert=require('assert'),path=require('path');
const win={CLICQUE_CONFIG:{}};
new Function('window',fs.readFileSync(path.join(__dirname,'../www/platform.js'),'utf8'))(win);
const{mkDb,merge}=win.__clicqueShim;

function mockSB(){const rows=new Map(),ls=[];
const col=(r,c)=>c.startsWith('data->>')?String(r.data[c.slice(7)]):r[c];
const notify=(type,nw,old)=>{ls.forEach(l=>{const row=nw||old;const[k,v]=l.filter.split('=eq.');if(String(row[k])===v)l.cb({eventType:type,new:nw,old:old})})};
const from=()=>{const st={op:'select',f:[],ord:null,lim:null};
const exec=async single=>{if(st.op==='delete'){const p=st.f.find(x=>x[0]==='path')[1],old=rows.get(p);rows.delete(p);if(old)notify('DELETE',null,old);return{error:null}}
let a=[...rows.values()].filter(r=>st.f.every(([c,v])=>String(col(r,c))===String(v)));
if(st.ord){const k=st.ord[0].slice(6);a.sort((x,y)=>(x.data[k]-y.data[k])*(st.ord[1]?1:-1))}
if(st.lim)a=a.slice(0,st.lim);const out=a.map(r=>({id:r.id,data:r.data}));
return single?{data:out[0]?{data:out[0].data}:null,error:null}:{data:out,error:null}};
const api={select(){return api},eq(c,v){st.f.push([c,v]);return api},order(c,o){st.ord=[c,o.ascending!==false];return api},limit(n){st.lim=n;return api},
maybeSingle(){return exec(true)},then(a,b){return exec(false).then(a,b)},
upsert(r){const old=rows.get(r.path);rows.set(r.path,{...r});notify(old?'UPDATE':'INSERT',rows.get(r.path),old);return Promise.resolve({error:null})},
delete(){st.op='delete';return api}};return api};
return{from,channel(){const l={},ch={on(_,o,cb){l.filter=o.filter;l.cb=cb;return ch},subscribe(){ls.push(l);return ch},_l:l};return ch},removeChannel(ch){const i=ls.indexOf(ch._l);if(i>=0)ls.splice(i,1)}}}

(async()=>{
const db=mkDb(mockSB());
// documents
await db.doc('rooms/AAAAA').set({name:'r1',status:'lobby',n:6,x:{a:1,b:2}});
let s=await db.doc('rooms/AAAAA').get();assert(s.exists&&s.data().name==='r1');
await db.doc('rooms/AAAAA').update({cnt:2,x:{b:9}});
s=await db.doc('rooms/AAAAA').get();assert.deepStrictEqual(s.data().x,{a:1,b:9});assert.strictEqual(s.data().cnt,2);
await assert.rejects(()=>db.doc('rooms/NOPE').update({a:1}),e=>e.code==='invalid_argument');
assert.strictEqual((await db.doc('rooms/NOPE').get()).exists,false);
// collections, where / orderBy / limit
await db.doc('rooms/BBBBB').set({name:'r2',status:'playing',ts:2});
await db.doc('rooms/CCCCC').set({name:'r3',status:'lobby',ts:3});
const lobby=await db.collection('rooms').where('status','==','lobby')._fetch();assert.strictEqual(lobby.length,2);
// realtime on a collection with docChanges
const seen=[];let last;
const un=db.collection('rooms/AAAAA/chat').orderBy('ts').limit(50).onSnapshot(sn=>{last=sn;seen.push(sn.docChanges().map(c=>c.type+':'+c.doc.id))});
await new Promise(r=>setTimeout(r,5));
await db.collection('rooms/AAAAA/chat').add({txt:'one',ts:1});
await db.collection('rooms/AAAAA/chat').add({txt:'two',ts:2});
await new Promise(r=>setTimeout(r,5));
assert.strictEqual(last.size,2);assert.deepStrictEqual(last.docs.map(d=>d.data().txt),['one','two']);
assert(seen.flat().filter(x=>x.startsWith('added')).length===2);
const ref=await db.collection('rooms/AAAAA/chat').add({txt:'three',ts:3});await ref.update({txt:'three!'});
await new Promise(r=>setTimeout(r,5));assert(seen.flat().some(x=>x.startsWith('modified')));
await ref.delete();await new Promise(r=>setTimeout(r,5));assert(seen.flat().some(x=>x.startsWith('removed')));assert.strictEqual(last.size,2);
un();await db.collection('rooms/AAAAA/chat').add({txt:'after unsub',ts:9});await new Promise(r=>setTimeout(r,5));assert.strictEqual(last.size,2);
// realtime filtered collection (room list)
let list;const un2=db.collection('rooms').where('status','==','lobby').onSnapshot(sn=>{list=sn.docs.map(d=>d.id)});
await new Promise(r=>setTimeout(r,5));assert.deepStrictEqual(list.sort(),['AAAAA','CCCCC']);
await db.doc('rooms/AAAAA').update({status:'playing'});await new Promise(r=>setTimeout(r,5));assert.deepStrictEqual(list,['CCCCC']);un2();
// realtime single doc
let live;const un3=db.doc('rooms/DDDDD/live/state').onSnapshot(d=>{live=d.exists?d.data():null});
await new Promise(r=>setTimeout(r,5));assert.strictEqual(live,null);
await db.doc('rooms/DDDDD/live/state').set({html:'hi'});await new Promise(r=>setTimeout(r,5));assert.strictEqual(live.html,'hi');un3();
assert.deepStrictEqual(merge({a:{b:1,c:2},d:[1]},{a:{c:3},d:[2]}),{a:{b:1,c:3},d:[2]});
// developer admin bridge (needs a configured server, so it is checked with a stub client)
assert(typeof win.__clicqueAdmin.call==='function');
await assert.rejects(()=>win.__clicqueAdmin.call({action:'status'}),/Server not configured/);
console.log('shim tests passed');
})().catch(e=>{console.log('FAIL',e);process.exit(1)});
