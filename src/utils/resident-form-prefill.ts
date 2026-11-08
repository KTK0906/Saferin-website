import {residentAge,profilePersonalData} from './resident-profile-data'
import type {ResidentProfile,ProfileBundle} from './resident-profile-data'
export interface ResidentDemographics {id:string;name:string;age?:number|null;gender?:string|null;zone?:string|null;bed?:string|null}
export function prefillResidentForm<T extends object>(blank:T,resident:ResidentProfile,related?:Pick<ProfileBundle,'contacts'|'medical'>,formType?:string) {
 const result=JSON.parse(JSON.stringify(blank)) as T & {residentSnapshot:ResidentProfile;profileSnapshot:ProfileBundle}
 const data=result as Record<string,unknown>
 const gender=({'male':'男','female':'女','m':'男','f':'女'} as Record<string,string>)[resident.gender?.toLowerCase()||'']||resident.gender||''
 const age=residentAge(resident),room=[resident.room,resident.bed].filter(Boolean).join(' / ')
 const values:Record<string,string>={age:age==null?'':String(age),gender,room,roomBed:room,zone:resident.zone||'',bed:resident.bed||'',bedNumber:resident.bed||'',birthDate:resident.birth_date||'',admissionDate:resident.admission_date||'',stayFrom:resident.admission_date||'',residentNumber:resident.resident_number||'',hkid:resident.hkid||'',marital:resident.marital_status||''}
 if(related?.medical){const history=related.medical.conditions?.join('、')||'';Object.assign(values,{history,medicalHistory:history,conditions:history,allergies:related.medical.allergies?.join('、')||'',medications:related.medical.medications||''})}
 function apply(target:unknown){if(!target||typeof target!=='object'||Array.isArray(target))return;const fields=target as Record<string,unknown>;for(const [key,value] of Object.entries(values))if(key in fields&&typeof fields[key]==='string'&&value!=='')fields[key]=value}
 for(const key of ['gds','speech','speechCare','rehab','admission'])apply(data[key])
 apply((data.careReview as {values?:unknown}|undefined)?.values)
 data.resident=resident.name
 result.residentSnapshot={...JSON.parse(JSON.stringify(resident)),age,gender:gender||null}
 result.profileSnapshot={resident:result.residentSnapshot,contacts:JSON.parse(JSON.stringify(related?.contacts||{})),medical:JSON.parse(JSON.stringify(related?.medical||{}))}
 if(formType==='form-14'){
  const personal=profilePersonalData(resident)
  data.rehab={...(data.rehab as object),...personal.rehab}
  data.residentExtra={...(data.residentExtra as object),...personal.residentExtra}
 }
 return result
}
