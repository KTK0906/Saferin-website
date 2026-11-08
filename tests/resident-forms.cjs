const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{createRequire}=require('node:module'),path=require('node:path');
const root=process.env.SAFERIN_TEST_ROOT||path.resolve(__dirname,'..'),req=createRequire(path.join(root,'package.json')),ts=req('typescript'),vue=req('vue'),compiler=req('@vue/compiler-sfc'),modules={};
function load(source,extra={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:n=>n==='vue'?vue:n.endsWith('.vue')?{}:modules[n.replace(/^\.\//,'@/utils/')]||req(n),console,AbortSignal,...extra});return m.exports;}
for(const name of ['resident-forms','intake-referral-forms','final-assessment-forms','gds-assessment','continence-assessment','speech-assessment','report-admission-forms','rehab-forms','care-review-forms','resident-profile-data','resident-form-prefill'])modules['@/utils/'+name]=load(fs.readFileSync(path.join(root,'src/utils/'+name+'.ts'),'utf8'));
const {descriptor,errors}=compiler.parse(fs.readFileSync(path.join(root,'src/components/ResidentForms.vue'),'utf8'));assert.equal(errors.length,0);
const template=compiler.compileTemplate({source:descriptor.template.content,filename:'ResidentForms.vue',id:'resident-forms',compilerOptions:{expressionPlugins:['typescript']}});assert.equal(template.errors.length,0,JSON.stringify(template.errors));
const database=new Map();let serial=0,failure=false;
const clone=value=>JSON.parse(JSON.stringify(value));
modules['@/utils/resident-forms-service']={
 listResidentForms:async id=>[...database.values()].filter(r=>r.elderly_id===id).map(clone),
 getResidentForm:async(id,key)=>{const row=database.get(key);if(!row||row.elderly_id!==id)throw Error('Not found');return clone(row)},
 saveResidentForm:async(input,existing)=>{if(failure)throw Error('Network unavailable');if(existing&&database.get(existing.id)?.updated_at!==existing.updatedAt)throw Error('Record changed');const id=existing?.id||'record-'+(++serial),row={...clone(input),id,created_at:'2026-11-05',updated_at:String(++serial)};database.set(id,row);return clone(row)},
 deleteResidentForm:async(resident,id,version)=>{const row=database.get(id);if(!row||row.elderly_id!==resident||row.updated_at!==version)throw Error('Record changed');database.delete(id)},
};
let lookupFailure=false;const residentReads=[];
modules['@/lib/supabaseClient']={supabase:{from(table){let id;const q={select(){return q},eq(key,value){id=value;return q},abortSignal(){return q},async maybeSingle(){return lookupFailure?{data:null,error:{message:'Resident lookup failed'}}:{data:table==='emergency_contacts'?{primary_contact:'Primary contact',primary_phone:'5555'}:{conditions:['Known history'],allergies:['Known allergy'],medications:'Existing medicine'},error:null}},async single(){assert.equal(table,'elderly');residentReads.push(id);return lookupFailure?{data:null,error:{message:'Resident lookup failed'}}:{data:{id,name:'Resident '+id,age:80,gender:'女',zone:'A',bed:'101'},error:null}}};return q}}};
modules['@/utils/resident-profile-service']=load(fs.readFileSync(path.join(root,'src/utils/resident-profile-service.ts'),'utf8'));
modules['@/utils/permissions']={getCurrentSession:async()=>null};
modules['@vueuse/core']={useWindowSize:()=>({width:vue.ref(1920)}),useEventListener(){}};
let currentAbility;
modules['@casl/vue']={useAbility:()=>currentAbility};
function mount(id='resident-a',actions=['read','manage','delete']){
 currentAbility=vue.reactive({rules:actions.map(action=>({action,subject:'elderly_list'})),can(action){return this.rules.some(rule=>rule.action===action||rule.action==='manage')}});
 const callbacks=[],ability=currentAbility;
 const source=descriptor.scriptSetup.content+'\nexport {form,records,selectedType,drawer,errors,openRecord,closeDrawer,save,loadRecords,visibleRecords,filteredRecords,page,perPage,recordSearch,filterType,deleteTarget,remove,canRead,canWrite,canDelete,catalog};';
 const api=load(source.replace(/onMounted\(/g,'mockMounted(').replace(/onUnmounted\(/g,'mockUnmounted('),{defineProps:()=>({resident:{id,name:'Resident '+id},showList:true,createOnMount:false}),withDefaults:(props,defaults)=>({...defaults,...props}),defineEmits:()=>()=>{},mockMounted:callback=>callbacks.push(callback),mockUnmounted:()=>{}});
 return {...api,ability};
}
(async()=>{
 const a=mount();assert.equal(a.catalog.length,24);assert.equal(a.drawer.value,false);
 for(let i=1;i<=24;i++){
  a.selectedType.value='form-'+i;await a.openRecord();assert.equal(a.errors.value,'');assert.equal(a.form.value.residentSnapshot.id,'resident-a');assert.equal(a.form.value.residentSnapshot.age,80);assert.equal(a.form.value.residentSnapshot.gender,'女');assert.equal(a.form.value.residentSnapshot.zone,'A');assert.equal(a.form.value.residentSnapshot.bed,'101');
  const target=i===2?a.form.value.gds:i===3?a.form.value.speech:i===4?a.form.value.speechCare:i===5?a.form.value.admission:[10,11].includes(i)?a.form.value.careReview.values:a.form.value.rehab;
  for(const [key,value] of Object.entries({age:'80',gender:'女',room:'101',roomBed:'101'}))if(key in target)assert.equal(target[key],value,'Form '+i+' '+key);
  a.form.value.author='Test Staff';a.form.value.notes='Form '+i;await a.save();assert.equal(a.errors.value,'');assert.equal(a.drawer.value,false);
 }
 assert.equal(database.size,24);assert.equal(a.visibleRecords.value.length,5);
 a.filterType.value='form-3';await vue.nextTick();assert.equal(a.filteredRecords.value.length,1);a.filterType.value=null;
 const b=mount('resident-b');await b.loadRecords();assert.equal(b.records.value.length,0);b.selectedType.value='form-3';await b.openRecord();assert.equal(b.form.value.residentSnapshot.id,'resident-b');b.closeDrawer();assert.equal(residentReads.at(-1),'resident-b');
 const reload=mount();await reload.loadRecords();assert.equal(reload.records.value.length,24);
 const record=reload.records.value.find(r=>r.formId==='form-3');await reload.openRecord(record,true);assert.equal(reload.form.value.notes,'Form 3');reload.form.value.notes='view cannot save';await reload.save();assert.equal(database.get(record.id).notes,'Form 3');reload.closeDrawer();
 await reload.openRecord(record);reload.form.value.speech.currentLiquid.push('Thin');reload.closeDrawer();assert.equal(database.get(record.id).payload.speech.currentLiquid.length,0);
 await reload.openRecord(record);reload.form.value.notes='Updated';reload.form.value.speech.age='85';await reload.save();assert.equal(database.get(record.id).notes,'Updated');
 const readCount=residentReads.length;await reload.openRecord(record,true);assert.equal(reload.form.value.speech.age,'85','Historical assessment age must not be overwritten');assert.equal(reload.form.value.residentSnapshot.age,80);assert.equal(residentReads.length,readCount,'Existing records must not reload present demographics');reload.closeDrawer();
 const stale=mount();await stale.loadRecords();const old=stale.records.value.find(r=>r.id===record.id);await stale.openRecord(old);
 await reload.openRecord(reload.records.value.find(r=>r.id===record.id));reload.form.value.notes='Latest';await reload.save();await stale.save();assert.equal(stale.drawer.value,true);assert(stale.errors.value.includes('changed'));assert.equal(database.get(record.id).notes,'Latest');
 reload.selectedType.value='form-1';await reload.openRecord();reload.form.value.author='Test Staff';failure=true;await reload.save();assert.equal(reload.drawer.value,true);assert(reload.errors.value.includes('Network'));failure=false;reload.closeDrawer();
 const readonly=mount('resident-a',['read']);assert(readonly.canRead());assert(!readonly.canWrite());assert(!readonly.canDelete());await readonly.loadRecords();await readonly.openRecord(readonly.records.value[0],true);assert(readonly.drawer.value);
 const writer=mount('resident-a',['read','manage']);assert(writer.canWrite());assert(!writer.canDelete(),'write must not imply delete');
 const noRead=mount('resident-a',['manage']);assert(!noRead.canRead());assert(!noRead.canWrite());
 readonly.ability.rules=[];await vue.nextTick();assert.equal(readonly.records.value.length,0);assert.equal(readonly.drawer.value,false);
 await reload.loadRecords();reload.deleteTarget.value=reload.records.value.find(r=>r.id===record.id);await reload.remove();assert(!database.has(record.id));
 const {prefillResidentForm}=modules['@/utils/resident-form-prefill'];const original={rehab:{age:'',gender:'',room:'',birthDate:'',admissionDate:''},residentExtra:{relatives:[{age:'40',gender:'男'}]},intakeExtra:{floor:''}};
 const missing=prefillResidentForm(original,{id:'unknown',name:'Unknown',age:0,gender:null,zone:null,bed:null});assert.equal(missing.rehab.age,'0');assert.equal(missing.rehab.gender,'');assert.equal(missing.rehab.birthDate,'');assert.equal(missing.rehab.admissionDate,'');assert.equal(missing.intakeExtra.floor,'');assert.equal(missing.residentExtra.relatives[0].age,'40');assert.equal(original.rehab.age,'');
 const legacy=clone(database.values().next().value);delete legacy.payload.residentSnapshot;delete legacy.payload.profileSnapshot;legacy.payload.gds.age='72';database.set(legacy.id,legacy);const older=mount();await older.openRecord({id:legacy.id},true);assert.equal(older.form.value.residentSnapshot,null);assert.equal(older.form.value.gds.age,'72');older.closeDrawer();
 lookupFailure=true;older.selectedType.value='form-2';await older.openRecord();assert.equal(older.drawer.value,false);assert(older.errors.value.includes('Resident lookup failed'));lookupFailure=false;
 console.log('PASS: all 24 forms prefill from selected resident ID, demographic snapshot persistence, historical/legacy preservation, missing-data handling, relative isolation, lookup failures; create/save/reload/view/edit/delete, filters and permissions.');
})().catch(error=>{console.error(error);process.exitCode=1});
