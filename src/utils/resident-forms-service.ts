import { supabase } from '@/lib/supabaseClient'

export interface ResidentContext { id:string; name:string; age?:number|null; zone?:string|null; bed?:string|null }
export interface ResidentFormRow {
 id:string; elderly_id:string; form_type:string; assessment_date:string; completed_by:string;
 status:'Draft'|'Completed'; notes:string; payload?:Record<string,unknown>;
 created_at:string; updated_at:string;
}
export interface ResidentFormInput {
 elderly_id:string; form_type:string; assessment_date:string; completed_by:string;
 status:string; notes:string; payload:Record<string,unknown>;
}
const columns='id,elderly_id,form_type,assessment_date,completed_by,status,notes,created_at,updated_at'
const signal=()=>AbortSignal.timeout(15000)
export async function listResidentForms(residentId:string):Promise<ResidentFormRow[]> {
 const rows:ResidentFormRow[]=[]
 for(let from=0;;from+=500){
  const {data,error}=await supabase.from('elderly_form_records').select(columns).eq('elderly_id',residentId)
   .order('assessment_date',{ascending:false}).order('created_at',{ascending:false}).order('id').range(from,from+499).abortSignal(signal())
  if(error)throw error
  rows.push(...(data||[]) as ResidentFormRow[])
  if(!data||data.length<500)return rows
 }
}
export async function getResidentForm(residentId:string,id:string):Promise<ResidentFormRow> {
 const {data,error}=await supabase.from('elderly_form_records').select('*').eq('elderly_id',residentId).eq('id',id).abortSignal(signal()).single()
 if(error)throw error
 return data
}
export async function saveResidentForm(input:ResidentFormInput,existing?:{id:string;updatedAt:string}):Promise<ResidentFormRow> {
 const query=existing
  ? supabase.from('elderly_form_records').update(input).eq('id',existing.id).eq('elderly_id',input.elderly_id).eq('updated_at',existing.updatedAt)
  : supabase.from('elderly_form_records').insert(input)
 const {data,error}=await query.select('*').abortSignal(signal()).maybeSingle()
 if(error)throw error
 if(!data)throw new Error('This record changed or your permission was removed. Reopen it before saving.')
 return data
}
export async function deleteResidentForm(residentId:string,id:string,updatedAt:string) {
 const {data,error}=await supabase.from('elderly_form_records').delete().eq('elderly_id',residentId).eq('id',id).eq('updated_at',updatedAt).select('id').abortSignal(signal())
 if(error)throw error
 if(!data?.length)throw new Error('This record changed or your permission was removed. Refresh the list before deleting.')
}
