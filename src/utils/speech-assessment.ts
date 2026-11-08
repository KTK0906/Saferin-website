export type SpeechValue = string | string[]
export type SpeechAssessment = Record<string, SpeechValue>
export interface SpeechField { key: string; label: string; type: 'text'|'textarea'|'select'|'multi'|'date'|'number'; items?: string[]; min?: number; max?: number; suffix?: string }
interface SpeechSection { id: string; title: string; fields: SpeechField[]; oromotor?: boolean }
const field = (key: string,label: string,type: SpeechField['type']='text',items?: string[]): SpeechField => ({key,label,type,items})
export const liquidOptions = ['Thin','Slightly thick (IDDSI 1)','Mildly thick (IDDSI 2)','Moderately thick (IDDSI 3)','Extremely thick (IDDSI 4)']
const utensils = ['Cup','Straw','Chopsticks','Tablespoon','Teaspoon','Syringe']
function dietFields(prefix: string): SpeechField[] { return [
  field(`${prefix}FeedingMode`,'Feeding Mode / 進食方式','multi',['Non-oral','Oral feeding']),
  field(`${prefix}Liquid`,'Liquid / 液體稠度','multi',liquidOptions),
  field(`${prefix}Rice`,'Rice / 飯類','multi',['Regular','Soft','Puree']),
  field(`${prefix}Meat`,'Meat / 肉類','multi',['Regular','Chopped','Minced','Smooth Soft','Puree']),
  field(`${prefix}Vegetable`,'Vegetable / 蔬菜','multi',['Regular','Chopped','Minced','Smooth Soft','Puree']),
  field(`${prefix}FedBy`,'Fed by / 餵食者','multi',['Self','Family / Staff']),
  field(`${prefix}Utensils`,'Utensils / 餐具','multi',utensils),
] }
export const oromotorRows = ['Jaw','Lip','Tongue','Soft Palate']
export const oromotorColumns = ['Symmetry','Strength','ROM','Other']
export const oromotorKey = (row: string,column: string) => `oromotor-${row}-${column}`
export const speechSections: SpeechSection[] = [
  {id:'speech-personal',title:'I. 基本資料及病歷',fields:[
    field('gender','Sex / 性別','select',['男','女','其他','未提供']),{...field('age','Age / 年齡','number'),min:0,suffix:'歲'},field('birthDate','Date of Birth / 出生日期','date'),
    field('referral','Refer for / 轉介原因','multi',['New Admission','ICP Assessment','Others']),field('referralOther','Other referral reason / 其他轉介原因'),field('medicalHistory','Medical History / 病歷','textarea'),
  ]},
  {id:'speech-current-diet',title:'II. Current Liquids and Diet / 現時飲食',fields:dietFields('current')},
  {id:'speech-cognition',title:'III. Cognition / 認知',fields:[
    field('orientation','Orientation / 定向能力','multi',['Person','Place','Time','Cannot be assessed']),field('attention','Attention / 專注力','select',['Adequate','Reduced','No response']),field('cognitionOther','Others / 其他認知觀察','textarea'),
  ]},
  {id:'speech-communication',title:'IV. Communication / 溝通',fields:[
    field('communicationAssessment','Assessment availability / 評估情況','multi',['Cannot be assessed','Non-communicable','Others']),field('communicationOther','Others / 其他未能評估原因'),field('comprehension','Language Verbal Comprehension / 語言理解','textarea'),field('expression','Language Verbal Expression / 語言表達','textarea'),
  ]},
  {id:'speech-voice',title:'V. Speech & Voice / 言語及聲線',fields:[
    field('amr','AMR (/p, t, k/)','multi',['Normal','Reduced rate','Imprecise articulation','Irregular pattern']),field('smr','SMR (/pataka/)','multi',['Normal','Reduced rate','Imprecise articulation','Reduced coordination']),
    field('intelligibility','Intelligibility / 言語清晰度'),{...field('mpt','MPT / 最長發聲時間','number'),min:0,suffix:'s'},field('loudness','Vocal Loudness / 音量','select',['Adequate','Soft','Loud']),
    field('voiceQuality','Vocal Quality / 聲線質素','multi',['Normal','Breathy','Rough','Strained','Others']),field('voiceQualityOther','Other vocal quality / 其他聲線質素'),field('speechOther','Others (Speech rate, fluency, etc.) / 語速、流暢度等','textarea'),
  ]},
  {id:'speech-oromotor',title:'VI. Oromotor / 口腔肌能',oromotor:true,fields:[
    field('dentition','Dentition / 牙齒狀況','multi',['Full dentition','Partial dentition','Full denture','Partial denture','Edentulous']),field('oralHygiene','Oral Hygiene / 口腔衞生','select',['Good','Fair','Poor']),field('cough','Voluntary Cough Strength / 自主咳嗽力度','select',['Adequate','Fair','Weak','Cannot be assessed']),
  ]},
  {id:'speech-swallowing',title:'VII. Swallowing / 吞嚥',fields:[
    field('trialLiquid','Oral Trial on — Liquid / 液體測試','multi',liquidOptions),field('trialLiquidUtensils','Liquid trial utensils / 液體測試用具','multi',['Cup','Straw','Tablespoon','Teaspoon','Syringe']),
    field('trialSolids','Oral Trial on — Solids / 固體測試','multi',['Biscuit','Cake','Puree snacks','Meal']),field('trialSolidsDetails','Solids / 固體測試補充資料'),field('trialSolidUtensils','Solid trial utensils / 固體測試用具','multi',['Finger food','Chopsticks','Tablespoon','Teaspoon','Syringe']),field('oralPhase','Oral Phase / 口腔期','textarea'),field('pharyngealPhase','Pharyngeal Phase / 咽部期','textarea'),
  ]},
  {id:'speech-impression',title:'VIII. Impression / 評估印象',fields:[
    field('impressionSummary','Briefly summarize the features and conditions / 特徵及情況摘要','textarea'),field('impression','Impression / 評估印象','multi',['Functional Swallowing / Speech / Language abilities','Dysphagia','Dysarthria','Aphasia','Cognitive Communication Disorders','Apraxia of Speech','Others']),field('impressionOther','Other impression / 其他評估印象','textarea'),
  ]},
  {id:'speech-recommendations',title:'IX. Recommendations / 建議',fields:[...dietFields('recommended'),field('safety','Safety precautions/swallowing recommendations / 安全措施及吞嚥建議','textarea'),field('recommendationOther','Others / 其他建議','textarea')]},
  {id:'speech-followup',title:'X. 評分、訓練及覆評',fields:[
    {...field('masa','MASA Score','number'),min:0,max:200,suffix:'/ 200'},field('training','Regular training on / 定期訓練項目','multi',['Swallowing','Speech','Language']),{...field('trainingFrequency','Training frequency / 每星期訓練次數','number'),min:1,suffix:'times / week'},
    field('review','Review / 覆評安排','multi',['Review','Review PRN']),field('reviewDate','Review date / 覆評日期','date'),field('reviewDetails','Review details / 覆評補充資料'),field('therapist','Speech Therapist / 言語治療師'),
  ]},
]
export function createSpeechAssessment(): SpeechAssessment {
  const result: SpeechAssessment = {}
  for(const section of speechSections)for(const f of section.fields)result[f.key]=f.type==='multi'?[]:''
  for(const row of oromotorRows)for(const column of oromotorColumns)result[oromotorKey(row,column)]=''
  return result
}
export function validateSpeechAssessment(data: SpeechAssessment, assessmentDate: string): string {
  for(const section of speechSections)for(const f of section.fields) {
    const value=data[f.key]
    if(f.type!=='number' || value==='' || value===undefined)continue
    if(typeof value!=='string' || !Number.isFinite(Number(value)) || (f.min!==undefined && Number(value)<f.min) || (f.max!==undefined && Number(value)>f.max))return `${f.label}：請輸入有效範圍內的數字。`
    if(['age','trainingFrequency','masa'].includes(f.key) && !Number.isInteger(Number(value)))return `${f.label}：請輸入整數。`
  }
  if(data.birthDate && data.birthDate>assessmentDate)return '出生日期不能遲於評估日期。'
  if(data.reviewDate && data.reviewDate<assessmentDate)return '覆評日期不能早於評估日期。'
  return ''
}
