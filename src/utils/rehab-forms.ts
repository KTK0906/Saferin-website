import { residentSections } from './resident-forms'
import { intakeReferralSections } from './intake-referral-forms'
import { finalSections } from './final-assessment-forms'
export type RehabData = Record<string,string|string[]>
export interface RehabField {key:string;label:string;type:'text'|'textarea'|'select'|'multi'|'date'|'number';items?:string[];min?:number;max?:number;suffix?:string}
export interface ScoreRow {key:string;label:string;options:number[]}
export interface RehabTable {id:string;title:string;kind:'scores'|'motor'|'yearly'|'custom';rows?:ScoreRow[];dates?:boolean;details?:boolean|'remarks';maximum?:number;manual?:boolean;guidance?:string;matrixRows?:string[];matrixCols?:string[]}
export interface RehabSection {id:string;title:string;fields:RehabField[];tables?:RehabTable[]}
const f=(key:string,label:string,type:RehabField['type']='text',items?:string[]):RehabField=>({key,label,type,items})
const num=(key:string,label:string,min=0,max?:number,suffix?:string):RehabField=>({...f(key,label,'number'),min,max,suffix})
const basic=[num('age','年齡'),f('gender','性別','select',['男','女','其他','未提供']),f('room','房間／床號'),f('conditions','病症／Medical History','textarea')]
const end=[f('therapist','治療師'),f('signedDate','日期','date')]
const score=(key:string,label:string,options:number[]):ScoreRow=>({key,label,options})
export const mbiRows:ScoreRow[]=[score('feeding','進食',[0,2,5,8,10]),score('transfer','轉移',[0,3,8,12,15]),score('grooming','梳洗',[0,1,3,4,5]),score('toilet','如廁',[0,2,5,8,10]),score('bathing','洗澡',[0,1,3,4,5]),score('walking','步行能力',[0,3,8,12,15]),score('wheelchair','～使用輪椅',[0,1,3,4,5]),score('stairs','上落樓梯',[0,2,5,8,10]),score('dressing','更衣',[0,2,5,8,10]),score('bowel','大便控制',[0,2,5,8,10]),score('bladder','小便控制',[0,2,5,8,10])]
export const emsRows:ScoreRow[]=[score('lying-sitting','I. Lying to sitting',[0,1,2]),score('sitting-lying','II. Sitting to lying',[0,1,2]),score('sit-stand','III. Sit to Stand',[0,1,2,3]),score('stand','IV. Stand',[0,1,2,3]),score('gait','V. Gait',[0,1,2,3]),score('walk','VI. Timed Walk (6 m)',[0,1,2,3]),score('reach','VII. Functional Reach Test',[0,2,4])]
export const balanceRows:ScoreRow[]=[score('sitting','I. Sitting Balance',[0,1]),score('arise','II. Arises',[0,1,2]),score('attempt','III. Attempt to arise',[0,1,2]),score('immediate','IV. Immediate standing balance',[0,1,2]),score('stand','V. Standing Balance',[0,1,2]),score('nudged','VI. Nudged (3 times)',[0,1,2]),score('eyes','VII. Eyes closed',[0,1]),score('turn-continuity','VIII. Turning 360° — Continuity',[0,1]),score('turn-steady','VIII. Turning 360° — Steadiness',[0,1]),score('sit','IX. Sitting down',[0,1,2])]
export const gaitRows:ScoreRow[]=[score('start','X. Initiation of gait',[0,1]),score('r-pass','XI-a. R swing foot passes L foot',[0,1]),score('r-clear','XI-b. R foot completely clears floor',[0,1]),score('l-pass','XI-c. L swing foot passes R foot',[0,1]),score('l-clear','XI-d. L foot completely clears floor',[0,1]),score('symmetry','XII. Step symmetry',[0,1]),score('continuity','XIII. Step continuity',[0,1]),score('path','XIV. Path',[0,1,2]),score('trunk','XV. Trunk',[0,1,2]),score('heels','XVI. Heels almost touching while walking',[0,1])]
export const motorMovements=['Shoulder — Flexion','Shoulder — Abduction','Elbow — Flexion','Elbow — Extension','Forearm — Supination','Forearm — Pronation','Wrist — Flexion','Wrist — Extension','Hand — Grasp','Hand — Opening','Hip — Flexion','Hip — Abduction','Hip — Extension','Knee — Flexion','Knee — Extension','Ankle — DF','Ankle — PF']
export const motorColumns=['AROM L','AROM R','PROM L','PROM R','Muscle Power L','Muscle Power R','Remarks']
export const yearlyMetrics=['活動能力測試 (EMS)','平衡測試 (TMS)','計時起走測試 (TUG)','體能級別 (MFAC)','骨質密度 (T-Score)']
export const cellKey=(table:string,row:string,col:string)=>`${table}:${row}:${col}`
const emsGuide='I–II：2 Independent；1 Needs help of 1 person；0 Needs help of 2+ person。\nIII Sit to stand：3 Independent in under 3 seconds；2 Independent in over 3 seconds；1 Needs help of 1 person (verbal/physical)；0 Needs help of 2+ person。\nIV Stand：3 Stands without support and able to reach；2 Stands without support but needs support to reach；1 Stands but needs support；0 Stands only with physical support。Support means needs to use upper limbs to steady self。\nV Gait：3 Independent (including use of stick)；2 Independent with frame；1 Mobile with walking aid but erratic/unsafe turning (needs occasional supervision)；0 Needs physical help/constant supervision。\nVI Timed Walk：3 Under 15 seconds；2 16–30 seconds；1 Over 30 seconds；0 Unable to cover 6 metres。\nVII Functional Reach：4 Over 20 cm；2 10–20 cm；0 Under 10 cm/unable。\n原表 Outcome Indication：>14 Independent & safe functional mobility；10–13 Needs some help with some mobility manoeuvres；<10 Dependent in functional mobility。'
const balanceGuide='I：1 Steady, safe；0 Leans/slides in chair。\nII：2 Able without using arms；1 Able, uses arms to help；0 Unable without help。\nIII：2 Able to arise 1 attempt；1 Able, requires >1 attempt；0 Unable without help。\nIV：2 Steady without aids/support；1 Steady with aids/support；0 Unsteady (swagger, moves feet, trunk sway)。\nV：2 Narrow stance without support；1 Steady but wide stance (medial heels >4 inch apart)/use aids/support；0 Unsteady。\nVI：2 Steady；1 Stagger, grabs, catches self；0 Begins to fall。\nVII：1 Steady；0 Unsteady。\nVIII Continuity：1 Continuous；0 Discontinuous。Steadiness：1 Steady；0 Unsteady (grabs, staggers)。\nIX：2 Safe, smooth motion；1 Uses arms/not a smooth motion；0 Unsafe (misjudged distances, falls into chair)。'
const gaitGuide='X：1 No hesitation；0 Any hesitancy or multiple attempts to start。\nXI：各項 0／1；左右腳跨越對側腳及離地情況。\nXII：1 R & L step length appears equal；0 Appears not equal。\nXIII：1 Step appears continuous；0 Stopping/discontinuity between steps。\nXIV：2 Straight without aids；1 Mild/moderate deviation/use walking aids；0 Marked deviation。\nXV：2 No sway, no flexion, no use of arms & without aids；1 No sway but flexion of knees/spread of arms；0 Marked sway/uses aids。\nXVI：1 Heels almost touching while walking；0 Heels apart。\n原表 Outcome：25–28 Less chance of falling；19–24 Greater chance of falling but is not a high risk candidate；<19 High risk of falling。'
const dept=['舒展關節運動','強化肌肉運動','心肺功能／耐力訓練','平衡運動','步行運動','姿位轉移訓練','被動式肢體運動','胸肺治療','減痛治療','小組運動','其他']
const floor=['舒展關節運動','強化肌肉運動','平衡運動','步行運動','姿位轉移訓練','被動式肢體運動','床邊胸肺治療','減痛治療','小組運動','其他']
const transferFields:RehabField[]=[]
for(const [key,label,options] of [['turn','轉身',['自助','需要協助','完全依賴']],['lying','臥 ⇔ 坐',['自助','需要協助','完全依賴']],['sitStand','坐 ⇔ 企',['自助','需要協助','完全依賴','不適用（不能站立）']],['chairBed','椅 ⇔ 床',['自助','需要協助','完全依賴']],['walking','步行',['自助','需要協助','不能步行']],['stairs','行樓梯',['自助','需要協助','不適用']]] as const){transferFields.push(f(`${key}Mode`,label,'select',[...options]),num(`${key}People`,`${label}：協助人數`),f(`${key}Amount`,`${label}：協助程度／量`))}
const frequencies=['沒有','很少','間中','經常','不適用']
function socialFrequency(prefix:string,labels:string[]):RehabField[]{return labels.flatMap((label,i)=>[f(`${prefix}-${i}`,label,'select',frequencies),f(`${prefix}-${i}-details`,`${label}：不適用原因／補充`)])}
const socialSections:RehabSection[]=[
 {id:'resident',title:'I. 院友資料',fields:[num('age','年齡'),f('gender','性別','select',['男','女','其他','未提供']),f('residentNumber','院友編號'),f('admissionDate','入院日期','date'),f('room','樓層／房號／床號')]},
 {id:'background',title:'II–III. 背景及入住院舍原因',fields:[f('background','背景 (Background)','textarea'),f('institutionReason','入住院舍原因 (Reason for institutionalization)','textarea')]},
 {id:'relatives',title:'IV-1. 社交及發展：親友',fields:socialFrequency('relative',['1.1 保證人到訪','1.2 親友到訪','1.3 外宿','1.4 電話'])},
 {id:'residents',title:'IV-2. 社交及發展：院友',fields:[...socialFrequency('resident',['2.1 與院友閒聊／玩樂','2.2 在院內有較親密院友','2.3 在院內幫助其他院友','2.4 與其他院友互相爭吵','2.5 與其他院友互相打架']),f('roommateRelationship','2.6 與同房關係','textarea'),f('residentRemarks','備註','textarea')]},
 {id:'staff',title:'IV-3. 社交及發展：職員',fields:[...socialFrequency('staff',['3.1 諮詢','3.2 閒談','3.3 求助','3.4 提供意見','3.5 投訴']),f('staffRemarks','備註','textarea')]},
 {id:'leisure',title:'IV-4. 消閒生活',fields:[...socialFrequency('leisure',['4.1 看電視','4.2 聽收音機','4.3 閱報／閱讀','4.4 做運動','4.5 參加小組','4.6 參加活動','4.7 參與社區','4.8 參與院友例會','4.9 參加宗教活動']),f('leisureRemarks','備註','textarea')]},
 {id:'mental',title:'V. 精神健康狀況及社交評估',fields:[f('personality','1.1 性格','multi',['樂觀','文靜','友善','悲觀','害羞','多疑','內向','情緒化']),f('appearance','1.2 外表','select',['整齊清潔','尚算合適','衣衫不整／骯髒／衣著不合適']),f('cognition','1.3 認知','select',['正常','有困難（不能分辨日夜、時間或記憶力差、日常生活事務自決能力差）']),f('emotion','1.4 情緒','multi',['穩定','起伏不定','焦慮緊張','抑鬱','憤怒','過分喜悅','遲鈍']),f('behaviour','1.5 行為','select',['正常','不確定']),f('behaviourRemarks','行為備註'),f('thinking','1.6 思維','multi',['正常','幻聽','幻視','幻覺','其他']),f('thinkingOther','其他思維：請註明'),f('interaction','1.7 與人交往','select',['主動','不接觸','需鼓勵']),f('psychosocialNeeds','1.8 心理及社交需要評估','textarea')]},
 {id:'finance',title:'VI. 經濟狀況',fields:[f('finance','經濟來源','multi',['綜合社會保障援助','傷殘津貼','高齡津貼','長者生活津貼','家人資助','儲蓄'])]},
 {id:'followup',title:'VII. 建議及跟進計劃',fields:[f('followupPlan','建議及跟進計劃','textarea'),f('staffSignature','負責職員姓名及簽署（輸入姓名）'),f('staffDate','負責職員日期','date'),f('supervisorSignature','直屬上司姓名及簽署（輸入姓名）'),f('supervisorDate','直屬上司日期','date')]},
]
export const rehabForms:Record<string,RehabSection[]>={
 ...residentSections,
 ...intakeReferralSections,
 ...finalSections,
 'form-9':socialSections,
 'form-6':[
  {id:'basic',title:'基本資料及病症',fields:basic},
  {id:'mbi',title:'自我照顧能力評分（Modified Barthel Index）',fields:[num('mbiTotal','總分（由評估人員確認）',0,100)],tables:[{id:'mbi',title:'MBI',kind:'scores',rows:mbiRows,dates:true,manual:true,guidance:'五級：完全不能執行／嘗試但不安全／需中等協助／需少量協助／可獨立完成。\n體能分類：0–20 完全依賴；21–60 嚴重依賴；61–90 中度依賴；91–99 輕度依賴；100 獨立自主。\n步行及輪椅項目依原表分別記錄，總分由評估人員確認。'}]},
  {id:'functional',title:'功能問題：智能方面及體能方面',fields:[f('cognitiveIssues','智能方面','multi',['記憶力','理解力','語言表達']),f('memory','記憶力：補充'),f('understanding','理解力：補充'),f('expression','語言表達：補充'),f('physicalIssues','體能方面','multi',['肢體活動幅度減少','肢體力度減弱','手部靈活度減弱']),f('range','肢體活動幅度：補充'),f('strength','肢體力度：補充'),f('dexterity','手部靈活度：補充'),{...num('rightGrip','右手手握力'),suffix:'kgf'},{...num('leftGrip','左手手握力'),suffix:'kgf'},num('wandering','遊走風險評估',0,11)]},
  {id:'training',title:'訓練及照顧計劃',fields:[f('training','訓練','multi',['肢體活動訓練','手部訓練','日常生活訓練','坐姿改善','購買／暫借輔助器材','治療性小組']),f('dailyTraining','日常生活訓練內容','textarea'),f('equipment','購買／暫借輔助器材內容','textarea'),f('group','治療性小組內容','textarea'),f('remarks','備註','textarea'),...end]},
 ],
 'form-7':[
  {id:'history',title:'基本資料及病史',fields:[...basic,f('reference','Ref. No.'),f('admissionDate','Date of Admission','date'),f('socialHistory','Social Hx.','textarea'),f('mentalState','Mental State','textarea'),f('vision','Vision','select',['Normal','Mildly Impaired','Moderately Impaired','Blind']),f('hearing','Hearing','select',['Normal','Mildly Impaired','Moderately Impaired','Deaf']),f('speech','Speech','select',['Normal','Language Barrier','Abnormal']),f('speechDetails','Abnormal speech — details')]},
  {id:'falls',title:'History of Fall',fields:[f('yearFallStatus','Recent one year','select',['Nil','Yes']),num('yearFalls','Frequency in recent one year'),f('quarterFallStatus','Recent three months','select',['Nil','Yes']),num('quarterFalls','Frequency in recent three months')]},
  {id:'pain',title:'Pain / Discomfort',fields:[f('complaint','C/O','textarea'),f('symptoms','Behaviour of symptoms','textarea'),f('painIntensity','Intensity of pain'),f('painFrequency','Frequency of pain','select',['No pain','< Once per day','Once per day','Several times per day','Continuous'])]},
  {id:'objective',title:'Objective Examination',fields:[f('standingPosture','Posture — Standing','textarea'),f('sittingPosture','Posture — Sitting','textarea'),f('deformity','Deformities / Contractures','textarea'),f('oedema','Oedema','textarea'),f('sensation','Sensation','textarea'),f('pressureSore','Pressure Sore','textarea')]},
  {id:'motor',title:'Motor Assessment',fields:[f('tone','Tone'),f('coordination','Co-ordination'),f('trunkMobility','Trunk Mobility','textarea'),f('motorOther','Others','textarea')],tables:[{id:'motor',title:'AROM / PROM / Muscle Power — L / R',kind:'motor'}]},
  {id:'ems',title:'Elderly Mobility Score',fields:[num('walkSeconds','Timed Walk (6 m)',0,undefined,'seconds'),num('reachCm','Functional Reach',0,undefined,'cm')],tables:[{id:'ems',title:'EMS',kind:'scores',rows:emsRows,maximum:20,details:true,guidance:emsGuide}]},
  {id:'tinetti',title:'Tinetti Mobility Score',fields:[],tables:[{id:'balance',title:'Balance Score',kind:'scores',rows:balanceRows,maximum:16,details:true,guidance:balanceGuide},{id:'gait',title:'Gait Score',kind:'scores',rows:gaitRows,maximum:12,details:true,guidance:gaitGuide}]},
  {id:'ambulation',title:'Ambulation',fields:[f('ambulatoryState','Ambulatory State','textarea'),f('gaitAnalysis','Gait Analysis','textarea'),f('stairClimbing','Stair Climbing','textarea'),num('tug','Timed Up and Go Test',0,undefined,'seconds')]},
  {id:'recommendation',title:'Chest Condition and Recommendation',fields:[f('chest','Chest Condition','textarea'),f('recommendation','Recommendation','textarea'),...end]},
 ],
 'form-8':[
  {id:'basic',title:'基本資料',fields:basic},
  {id:'symptoms',title:'1–4. 身體狀況及平衡力',fields:[f('pain','痛症','select',['無','有']),f('painDetails','痛症詳情'),f('contracture','肢體僵硬／攣縮','select',['無','有']),f('contractureDetails','肢體僵硬／攣縮詳情'),f('weakness','肌力減弱','select',['無','有']),f('weaknessDetails','肌力減弱詳情'),f('sittingBalance','平衡力：坐','select',['穩定','需要幫助','不穩定']),f('standingBalance','平衡力：立','select',['穩定','需要幫助','不穩定','不適用（不能站立）'])]},
  {id:'transfer',title:'5–6. 姿位轉移及活動能力',fields:[...transferFields,f('walkingAids','步行輔助器材','multi',['徒手','士的','四腳叉','助行架','有轆助行架','治療室平衡杆']),f('wheelchair','輪椅使用','select',['輪椅使用者（可自助移轉）','輪椅使用者（需協助移轉）','不適用'])]},
  {id:'outcomes',title:'7–8. 跌倒次數及其他指標',fields:[num('yearFalls','一年內跌倒次數'),num('quarterFalls','三個月內跌倒次數')],tables:[{id:'yearly',title:'今年／去年指標',kind:'yearly',guidance:'原表註：EMS ≥14 可獨立安全活動；10–13 部份活動需協助；<10 活動時完全依賴。\nTMS 25–28 跌倒機會較低；19–24 跌倒機會較高；<19 跌倒機會極高。'}]},
  {id:'plan',title:'9. 治療計劃',fields:[f('departmentPlan','於治療部進行','multi',dept),f('departmentOther','治療部：其他內容','textarea'),f('floorPlan','於樓層進行','multi',floor),f('floorOther','樓層：其他內容','textarea')]},
  {id:'confirmation',title:'10–11. 參與程度及評語',fields:[f('participation','參與程度','select',['熱衷','間中','被動','不參與']),f('comments','評語','textarea'),...end]},
 ],
}
export function createRehabData(id:string):RehabData {
 const data:RehabData={}
 for(const section of rehabForms[id]||[]){
  for(const field of section.fields)data[field.key]=field.type==='multi'?[]:''
  for(const table of section.tables||[]){
   if(table.kind==='scores')for(const row of table.rows||[])for(const col of ['score',...(table.dates?['date']:[]),...(table.details?(table.details==='remarks'?['remarks']:['aids','remarks']):[])])data[cellKey(table.id,row.key,col)]=''
   const rows=table.kind==='motor'?motorMovements:table.kind==='yearly'?yearlyMetrics:table.matrixRows||[]
   const cols=table.kind==='motor'?motorColumns:table.kind==='yearly'?['本年','去年']:table.matrixCols||[]
   for(const row of rows)for(const col of cols)data[cellKey(table.id,row,col)]=''
  }
 }
 return data
}
export function scoreSummary(data:RehabData,table:RehabTable){let total=0,answered=0;for(const row of table.rows||[]){const value=data[cellKey(table.id,row.key,'score')];if(typeof value==='string'&&value!==''&&row.options.includes(Number(value))){total+=Number(value);answered++}}return{total,answered,complete:answered===(table.rows||[]).length}}
export function validateRehab(data:RehabData,id:string){for(const section of rehabForms[id]||[]){for(const field of section.fields){const value=data[field.key];if(field.type==='number'&&value!==''&&value!==undefined&&(typeof value!=='string'||!Number.isFinite(Number(value))||(field.min!==undefined&&Number(value)<field.min)||(field.max!==undefined&&Number(value)>field.max)))return `${field.label}：請輸入有效範圍的數字。`}
for(const table of section.tables||[])if(table.kind==='scores')for(const row of table.rows||[]){const value=data[cellKey(table.id,row.key,'score')];if(value!==''&&value!==undefined&&!row.options.includes(Number(value)))return `${row.label}：請選擇原表提供的分數。`}}return ''}
