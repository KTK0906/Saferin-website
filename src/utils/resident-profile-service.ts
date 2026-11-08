import {supabase} from '@/lib/supabaseClient'
import type {ProfileBundle} from './resident-profile-data'
const timeout=()=>AbortSignal.timeout(15000)
export async function loadResidentProfile(id:string):Promise<ProfileBundle>{
 const [resident,contacts,medical]=await Promise.all([
  supabase.from('elderly').select('*').eq('id',id).abortSignal(timeout()).single(),
  supabase.from('emergency_contacts').select('*').eq('elderly_id',id).abortSignal(timeout()).maybeSingle(),
  supabase.from('medical_information').select('*').eq('elderly_id',id).abortSignal(timeout()).maybeSingle(),
 ])
 for(const response of [resident,contacts,medical])if(response.error)throw response.error
 return {resident:resident.data,contacts:contacts.data||{},medical:{conditions:medical.data?.conditions||[],allergies:medical.data?.allergies||[],medications:medical.data?.medications||''}}
}
export async function saveResidentProfile(bundle:ProfileBundle,isNew=false):Promise<ProfileBundle>{
 const {data,error}=await supabase.rpc('save_resident_profile',{
  resident_id:isNew?null:bundle.resident.id,profile:bundle.resident,contacts:bundle.contacts,medical:bundle.medical,
  expected_updated_at:isNew?null:bundle.resident.updated_at,
 }).abortSignal(timeout())
 if(error)throw error
 if(!data?.resident?.id)throw new Error('Unable to save resident profile.')
 return data
}
