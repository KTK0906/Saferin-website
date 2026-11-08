import type {RehabSection,RehabField,ScoreRow} from './rehab-forms'
const f=(key:string,label:string,type:RehabField['type']='text',items?:string[]):RehabField=>({key,label,type,items})
const num=(key:string,label:string,min=0,max?:number):RehabField=>({...f(key,label,'number'),min,max})
const basic=[f('gender','性別','select',['男','女','其他','未提供']),num('age','年齡'),f('room','樓層／房號／床號'),f('diagnosis','主要診斷','textarea')]
const mbi:ScoreRow[]=[['feeding','Feeding',[0,2,5,8,10]],['transfer','Transfers',[0,3,8,12,15]],['hygiene','Personal Hygiene',[0,1,3,4,5]],['toilet','Toilet Use',[0,2,5,8,10]],['bath','Bathing',[0,1,3,4,5]],['walk','Ambulation',[0,3,8,12,15]],['wheelchair','— Wheelchair',[0,1,3,4,5]],['stairs','Stair Climbing',[0,2,5,8,10]],['dress','Dressing',[0,2,5,8,10]],['bowel','Bowel Control',[0,2,5,8,10]],['bladder','Bladder Control',[0,2,5,8,10]]].map(r=>({key:r[0] as string,label:r[1] as string,options:r[2] as number[]}))
const signatures:RehabField[]=[]
for(const [key,label] of [['manager','個案經理'],['pt','物理治療師'],['nurse','副院長／護士'],['ot','職業治療師'],['st','言語治療師'],['principal','院長']])signatures.push(f(`${key}Signature`,`${label}簽署（輸入姓名）`),f(`${key}Date`,`${label}日期`,'date'))
export const finalSections:Record<string,RehabSection[]>={
 'form-21':[{id:'personal',title:'院友及診斷資料',fields:basic}],
 'form-23':[
 {id:'personal',title:'院友及診斷資料',fields:basic},
 {id:'mental',title:'A. Mental Function',fields:[f('alertness','Alertness','select',['alert','dull','confused']),f('orientation','Orientation','multi',['time','place','person']),f('speech','Speech','multi',['relevant','irrelevant','coherent','incoherent','slurred','receptive dysphasia','expressive dysphasia']),f('command','Follow command','select',['good','fair','poor']),f('memory','Memory','multi',['long term','short term'])]},
 {id:'sensory',title:'B. Sensory Motor Function',fields:[f('visionRight','Vision — Right'),f('visionLeft','Vision — Left'),f('hearingRight','Hearing — Right'),f('hearingLeft','Hearing — Left'),f('sittingStatic','Sitting balance — Static','select',['stable','unstable']),f('sittingDynamic','Sitting balance — Dynamic','select',['stable','unstable']),f('standingStatic','Standing balance — Static','select',['stable','unstable']),f('standingDynamic','Standing balance — Dynamic','select',['stable','unstable']),f('tolerance','Tolerance','select',['good','fair'])],tables:[{id:'ot-sensory',title:'Right / Left — Upper / Lower Limb',kind:'custom',matrixRows:['Muscle tone','AROM','Power (/5)','Deformity/contracture','Coordination','Oedema','Others'],matrixCols:['Right U/L','Right L/L','Left U/L','Left L/L']}]},
 {id:'limbs',title:'C. Function Use of Limbs',fields:[f('upperRemarks','Upper Extremity — Remarks','textarea'),f('handRemarks','Hand Functions — Remarks','textarea'),f('lowerExtremity','Lower Extremity','textarea')],tables:[{id:'ot-upper',title:'Upper Extremity',kind:'custom',matrixRows:['Hand to top of head','Hand to upper back','Hand to opposite shoulder','Hand to lower back','Hand to feet','Head reach forward'],matrixCols:['Right','Left','Remarks']},{id:'ot-hand',title:'Hand Functions',kind:'custom',matrixRows:['Open palm','Make fist','Opposition','Grip strength','Hand Dominant'],matrixCols:['Right','Left','Remarks']}]},
 {id:'mbi',title:'D. Self Care (Modified Barthel Index)',fields:[num('mbiTotal','Total（由評估人員確認）',0,100),f('mbiRemarks','Remarks','textarea')],tables:[{id:'ot-mbi',title:'Modified Barthel Index',kind:'scores',rows:mbi,manual:true,details:'remarks',guidance:'五級：Unable to Perform／Attempts but unsafe／Mod. help／Mini. help／Independent。\n原表指標：0–20 Total Dependence；21–60 Severe Dependence；61–90 Moderate Dependence；91–99 Slight Dependence；100 Independence。\n步行及輪椅依原表分別記錄，總分由評估人員確認。\nImproving The Sensitivity of Barthel Index (Shah k. 1989)。'}]},
 {id:'recommendation',title:'E. Recommendation',fields:[f('recommendation','Recommendation','textarea'),f('therapist','Occupational Therapist'),f('signedDate','Date','date')]},
 ],
 'form-24':[
 {id:'personal',title:'院友及會議資料',fields:[f('admissionDate','入住日期','date'),f('finance','財政狀況','multi',['OAA','OALA','HOALA','NDA','HAD','CSSA']),f('diagnosis','確診為','multi',['認知障礙','抑鬱']),f('careLevel','照顧程度','select',['療養院','護養院','護理安老院'])]},
 {id:'care',title:'護理及生活需要',fields:[f('bathing','沐浴需要','multi',['自行','沐浴椅','1 人協助','2 人協助','浴床']),f('specialCare','特別護理','multi',['傷口','打針','胃或尿導管','氧氣']),f('diet','餐膳','select',['正餐','剪碎餐','免治餐','軟滑餐','糊餐']),f('walking','步行狀況','multi',['自助','需要協助','坐老人椅','臥床','徒手','士的','四腳叉','助行架','有轆助行架','輪椅自由行']),num('assistancePeople','協助人數'),f('assistanceDetails','協助補充資料'),f('other','其他','textarea')]},
 {id:'family',title:'講解 ICP 形式及家人意見',fields:[f('icpMode','講解 ICP 形式','multi',['電話：致電家人','家人出席 ICP 會議']),f('phoneName','電話：家人姓名'),f('phoneRelationship','電話：家人關係'),f('explanationDate','講解日期','date'),f('explanationStaff','講解職員'),f('attendingFamily','出席家人姓名'),f('attendingRelationship','出席家人關係'),f('familyViews','家人表達意見','textarea'),f('followup','跟進行動','textarea')]},
 {id:'signatures',title:'簽署及確認',fields:[...signatures,f('familySignature','出席家人簽署（輸入姓名）')]},
 ],
}
export const wanderingItems=[
 {key:'mental',title:'精神狀態 MENTAL STATUS',options:[['能聽從指示 / can follow instructions','1'],['不能聽從指示 / cannot follow instructions','3']]},
 {key:'mobility',title:'活動能力 MOBILITY',options:[['能無需協助下自行使用輪椅活動 / can move without assistance while in wheelchair','1'],['能自行走動 / ambulatory','3']]},
 {key:'speech',title:'語言能力 SPEECH PATTERNS',options:[['能溝通 / can communicate','0'],['不能溝通 / cannot communicate','3']]},
 {key:'history',title:'遊走紀錄 HISTORY OF WANDERING',options:[['沒有遊走紀錄 / no history of wandering','0'],['有遊走紀錄（過往住院或個人／家人資料）/ with history of wandering','2']]},
 {key:'early',title:'新入院：入院後 72 小時／ICP 檢討：最近一星期',options:[['沒有遊走行為 / does not wander','0'],['有目的地閒蕩，懂得返回座位／床位 / intentional destination; knows how to return','1'],['漫遊但未離開院舍 / wanders within hospital grounds','2'],['漫無目的地遊蕩，曾嘗試離開或曾離開院舍 / wanders aimlessly or off hospital grounds','5']]},
 {key:'later',title:'新入院：入院後 1 個月及按指示／ICP 檢討：過去一年',options:[['沒有發生遊走事故 / no episode of wandering','0'],['過往 6 個月沒有遊走事故','1'],['過往 3 個月沒有遊走事故','2'],['過往 1 個月有遊走事故','3']]},
 {key:'dementia',title:'失智症診斷',options:[['沒有被診斷患上失智症 / No diagnosis of dementia','0'],['醫生確診患有失智症 / Medically diagnosed with dementia','5']]},
]
export const pressureItems=[
 {key:'physical',title:'Physical Condition / 健康情況',options:[['Good / 好','4'],['Fair / 一般','3'],['Poor / 差','2'],['Very Bad / 非常差','1']]},
 {key:'mental',title:'Mental Condition / 神智狀況',options:[['Alert / 清醒警覺','4'],['Apathetic / 冷淡無神','3'],['Confused / 混亂','2'],['Stuporous / 昏睡','1']]},
 {key:'activity',title:'Activity / 活動能力',options:[['Ambulant / 活動自如','4'],['Walks with help / 需協助','3'],['Chairbound / 只能坐椅','2'],['Bedfast / 長期臥床','1']]},
 {key:'mobility',title:'Mobility / 肢體活動能力',options:[['Full / 不受限制','4'],['Slightly Impaired / 輕微受限制','3'],['Very Limited / 十分受限制','2'],['Immobile / 不能活動','1']]},
 {key:'incontinence',title:'Incontinence / 大小便失禁情況',options:[['None / 沒有','4'],['Occasional / 偶然','3'],['Usually Urinary / 經常小便失禁','2'],['Urinary and Fecal / 大小便失禁','1']]},
]
export const memoryWords=['面孔','絲絨','教堂','雛菊','紅色']
export interface FinalAssessmentExtra{naReasons:string[];scores:Record<string,string>;assessor:string;risk:string;memoryFirst:string[];memorySecond:string[];words:{word:string;classification:string}[];fluencyDone:boolean;orientation:string[];recall:string[];educationYears:string;percentile:string}
export const createFinalExtra=():FinalAssessmentExtra=>({naReasons:[],scores:{},assessor:'',risk:'',memoryFirst:Array(5).fill(''),memorySecond:Array(5).fill(''),words:Array.from({length:30},()=>({word:'',classification:''})),fluencyDone:false,orientation:Array(6).fill(''),recall:Array(5).fill(''),educationYears:'',percentile:''})
export function riskSummary(data:FinalAssessmentExtra,pressure=false){const items=pressure?pressureItems:wanderingItems;let total=0,answered=0;for(const item of items){const v=data.scores[item.key];if(item.options.some(o=>o[1]===v)){total+=Number(v);answered++}}const na=!pressure&&data.naReasons.length>0,complete=answered===items.length&&!na;return{total,answered,na,complete,risk:complete&&!pressure?(total<=8?'低遊走風險':total<=10?'存在遊走風險':'高遊走風險'):''}}
export function mocaSummary(d:FinalAssessmentExtra){const first=d.memoryFirst.filter(v=>v==='1').length;const words=d.words.filter(v=>v.word.trim());const repeat=words.filter(v=>v.classification==='重複詞語').length,nonAnimal=words.filter(v=>v.classification==='非動物詞語').length;const correct=words.filter(v=>v.classification==='正確動物').length;const fluency=Math.min(9,correct*0.5);const orientation=d.orientation.filter(v=>v==='1').length;const free=d.recall.filter(v=>v==='回憶詞語').length;const totalRecall=d.recall.filter(v=>['回憶詞語','類目提示','多項選擇'].includes(v)).length;const complete=d.memoryFirst.every(v=>['0','1'].includes(v))&&d.fluencyDone&&words.every(v=>v.classification)&&d.orientation.every(v=>['0','1'].includes(v))&&d.recall.every(v=>v!=='');return{first,words:words.length,repeat,nonAnimal,correct,fluency,orientation,free,totalRecall,delayed:free+totalRecall,total:first+fluency+orientation+free+totalRecall,complete}}
export function validateFinalExtra(d:FinalAssessmentExtra,id:string,completed:boolean){
 if(d.educationYears!==''&&(!Number.isInteger(Number(d.educationYears))||Number(d.educationYears)<0))return '教育年數請輸入有效整數。'
 if(!completed)return ''
 if(id==='form-21'){const result=riskSummary(d);if(!result.na&&!result.complete)return '請填齊遊走評分或註明不適用情況，或儲存為 Draft。'}
 if(id==='form-22'&&!riskSummary(d,true).complete)return '請填齊五項 Norton 評分，或儲存為 Draft。'
 if(id==='form-23'&&!mocaSummary(d).complete)return '請填齊認知測試並確認語言流暢度分類，或儲存為 Draft。'
 return ''
}
