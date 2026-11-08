export const abilityLabels = ['語言理解能力','語言表達能力','口肌功能','呼吸及發聲能力','發音能力','吞嚥能力']
export const abilityLevels = ['大致正常','輕度障礙','中度障礙','嚴重障礙']
export const trainingAreas = ['語言','口部肌肉','呼吸及發聲','發音','吞嚥']
export interface SpeechCareReport {
  age: string; gender: string; room: string; conditions: string; abilities: string[];
  feeding: string; meal: string; liquid: string; previousDate: string; previousMasa: string; currentMasa: string;
  dysphagia: string; aspiration: string; outcomeLevel: string; plans: string[]; individualAreas: string[]; groupAreas: string[];
  remarks: string; therapist: string; signedDate: string;
}
export const createSpeechCareReport = (): SpeechCareReport => ({age:'',gender:'',room:'',conditions:'',abilities:Array(6).fill(''),feeding:'',meal:'',liquid:'',previousDate:'',previousMasa:'',currentMasa:'',dysphagia:'',aspiration:'',outcomeLevel:'',plans:[],individualAreas:[],groupAreas:[],remarks:'',therapist:'',signedDate:''})
export interface EmergencyVisit { id: string; date: string; reason: string }
export interface HospitalAdmission { id: string; date: string; period: string; hospital: string; diagnosis: string }
export interface AdmissionRecord { roomBed: string; period: string; emergency: EmergencyVisit[]; admissions: HospitalAdmission[] }
export const createAdmissionRecord = (): AdmissionRecord => ({roomBed:'',period:'',emergency:[],admissions:[]})
export function validateSpeechCareReport(data: SpeechCareReport, date: string): string {
  for(const key of ['age','previousMasa','currentMasa','outcomeLevel'] as const){ const v=data[key];if(v!=='' && (!Number.isInteger(Number(v)) || Number(v)<0 || (key.includes('Masa') && Number(v)>200)))return `${key.includes('Masa')?'MASA 分數（0–200）':'年齡／Level'}請輸入有效整數。` }
  if(data.previousDate && data.previousDate>date)return '上次評估日期不能遲於本次評估日期。'
  return ''
}
export function validateAdmissionRecord(data: AdmissionRecord, completed: boolean): string {
  const visits=data.emergency.filter(r=>r.date||r.reason.trim())
  const admissions=data.admissions.filter(r=>r.date||r.period.trim()||r.hospital.trim()||r.diagnosis.trim())
  if(completed && !visits.length && !admissions.length)return '請加入至少一項急症室或入院紀錄，或儲存為 Draft。'
  if(completed && visits.some(r=>!r.date||!r.reason.trim()))return '請填寫每項急症室紀錄的日期及使用原因。'
  if(completed && admissions.some(r=>!r.date||!r.hospital.trim()||!r.diagnosis.trim()))return '請填寫每項入院紀錄的日期、醫院及診斷。'
  return ''
}
