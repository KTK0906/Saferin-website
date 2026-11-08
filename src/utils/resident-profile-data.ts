import type { ResidentDemographics } from './resident-form-prefill'
import type { RehabData } from './rehab-forms'
import { createResidentExtra, residentSections } from './resident-forms'
import type { ResidentExtra } from './resident-forms'

export interface ResidentProfile extends ResidentDemographics {
 birth_date?:string|null; admission_date?:string|null; room?:string|null;
 resident_number?:string|null; hkid?:string|null; marital_status?:string|null;
 care_level?:string|null; updated_at?:string; personal_details?:Record<string,unknown>;
 avatar_url?:string;resident_name?:string;main_caregiver?:string;
}
export interface ProfileBundle {
 resident:ResidentProfile;
 contacts:Record<string,string|null>;
 medical:{conditions?:string[]|null;allergies?:string[]|null;medications?:string|null};
}
export const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
export function residentAge(resident:{birth_date?:string|null;age?:number|null},date=localDate()):number|null {
 if(!resident.birth_date){const value=resident.age as number|string|null|undefined;return value==null||value===''?null:Number(value)}
 const [y,m,d]=date.split('-').map(Number),[by,bm,bd]=resident.birth_date.split('-').map(Number)
 return y-by-(m<bm||m===bm&&d<bd?1:0)
}
export const personalBackgroundKeys=residentSections['form-14'].filter(s=>s.id!=='personal').flatMap(s=>s.fields.map(f=>f.key))
export function profilePersonalData(resident:ResidentProfile):{rehab:RehabData;residentExtra:ResidentExtra} {
 const details=resident.personal_details||{},rehab:RehabData={}
 for(const field of residentSections['form-14'].filter(s=>s.id!=='personal').flatMap(s=>s.fields))rehab[field.key]=typeof details[field.key]==='string'||Array.isArray(details[field.key])?JSON.parse(JSON.stringify(details[field.key])):field.type==='multi'?[]:''
 Object.assign(rehab,{gender:resident.gender||'',birthDate:resident.birth_date||'',hkid:resident.hkid||'',marital:resident.marital_status||'',admissionDate:resident.admission_date||'',residentNumber:resident.resident_number||''})
 const residentExtra=createResidentExtra()
 residentExtra.relativesPresence=typeof details.relativesPresence==='string'?details.relativesPresence:''
 residentExtra.relatives=Array.isArray(details.relatives)?JSON.parse(JSON.stringify(details.relatives)):[]
 return {rehab,residentExtra}
}
export function personalDetails(rehab:RehabData,extra:ResidentExtra):Record<string,unknown> {
 const details:Record<string,unknown>={}
 for(const key of personalBackgroundKeys)if(key in rehab)details[key]=rehab[key]
 return {...details,relativesPresence:extra.relativesPresence,relatives:extra.relatives}
}
export function personalDifferences(saved:{rehab?:RehabData;residentExtra?:ResidentExtra;profileSnapshot?:ProfileBundle|null},current:ResidentProfile,related?:Pick<ProfileBundle,'contacts'|'medical'>) {
 const latest=profilePersonalData(current),differences:{field:string;saved:string;current:string}[]=[]
 const display=(v:unknown)=>v==null||v===''||Array.isArray(v)&&!v.length?'未記錄':typeof v==='string'?v:JSON.stringify(v)
 for(const section of residentSections['form-14'])for(const field of section.fields){const a=display(saved.rehab?.[field.key]),b=display(latest.rehab[field.key]);if(a!==b)differences.push({field:field.label,saved:a,current:b})}
 for(const [key,label] of [['relativesPresence','有否親屬／朋友'],['relatives','親友資料']] as const){const a=display(saved.residentExtra?.[key]),b=display(latest.residentExtra[key]);if(a!==b)differences.push({field:label,saved:a,current:b})}
 if(saved.profileSnapshot){
  const previous=saved.profileSnapshot
  for(const [key,label] of [['name','姓名'],['zone','Zone'],['room','房號'],['bed','床號'],['care_level','照顧級別']] as const){const a=display(previous.resident[key]),b=display(current[key]);if(a!==b)differences.push({field:label,saved:a,current:b})}
  if(related){
   for(const key of ['primary','secondary'])for(const [suffix,label] of [['contact','聯絡資料'],['relationship','關係'],['phone','電話']]){const field=`${key}_${suffix}`,a=display(previous.contacts[field]),b=display(related.contacts[field]);if(a!==b)differences.push({field:`${key==='primary'?'主要':'次要'}聯絡人：${label}`,saved:a,current:b})}
   for(const [key,label] of [['conditions','病歷'],['allergies','過敏'],['medications','藥物']] as const){const a=display(previous.medical[key]),b=display(related.medical[key]);if(a!==b)differences.push({field:label,saved:a,current:b})}
   const a=display(previous.contacts.doctor_contact),b=display(related.contacts.doctor_contact);if(a!==b)differences.push({field:'醫生聯絡資料',saved:a,current:b})
  }
 }
 return differences
}
