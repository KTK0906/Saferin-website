import { emsRows,balanceRows,gaitRows } from './rehab-forms'
import type { ScoreRow } from './rehab-forms'
export type ReviewData=Record<string,string|string[]>
export interface CirculationRow{id:string;date:string;staff:string;signature:string;remarks:string}
export interface CareReviewData{values:ReviewData;circulation:CirculationRow[]}
export const fallItems=[
 {key:'history',label:'1. 三個月內曾有跌倒紀錄',options:[{title:'是',value:'25'},{title:'否',value:'0'}]},
 {key:'diagnoses',label:'2. 多於一項醫療診斷',options:[{title:'是',value:'15'},{title:'否',value:'0'}]},
 {key:'aids',label:'3. 步行輔助器',options:[{title:'無／長期臥床／輪椅活動',value:'0'},{title:'步行輔助器具／步行需協助',value:'15'},{title:'傢具作支持',value:'30'}]},
 {key:'iv',label:'4. 靜脈注射治療／Heparin Block',options:[{title:'是',value:'20'},{title:'否',value:'0'}]},
 {key:'gait',label:'5. 步態／輪椅活動',options:[{title:'正常／長期臥床',value:'0'},{title:'身體軟弱',value:'10'},{title:'衰弱',value:'20'}]},
 {key:'mental',label:'6. 精神狀態',options:[{title:'了解自我能力',value:'0'},{title:'自我評估過高或忽略自我能力限制',value:'15'}]},
]
export const fallMeasures=[
 '教導新入服務長者及家人有關預防跌倒知識，及介紹環境','消除環境誘因（如：滑地、地面濕滑、照明不足）','解釋及監察藥物對長者所引起的副作用','教導長者需要時使用「叫人鐘」或主動召喚以尋求護理人員協助','教導長者及家人，為長者安排合適鞋履','給予長者穿著合適長度的衣褲，需要時改裝衣服','從床或椅轉移長者時，確保圍床及輪椅已鎖好','調校睡床高度至長者合適的高度（約長者膝蓋位置）','安排合適助行器給長者使用','如使用輪椅之長者，可安排姿能訓練，並定期檢查輪椅功能','安排長者參加防跌講座','教導長者使用合適的助行器，並定期檢查','教導長者如廁時使用扶手及可上鎖的廁椅','協助長者如廁，或設定如廁時間表','協助長者設置常用物件及「叫人鐘」於長者容易看見範圍','安排小組活動，如講座、運動班、分享會等，改善長者健忘情況','轉介物理／職業治療師作「預防跌倒」訓練','需要時轉介物理／職業治療師評估及安裝小床欄','需要時轉介物理／職業治療師評估及安裝離床警報器','安排長者於當眼處作照顧，易於觀察','需要時使用約束物及定時觀察','張貼高危跌倒標示',
]
export const fallNotes='¹ 坐輪椅的長者如需協助過床／坐椅，評分須以輪椅活動或步態較高分數評定。\n² 長期臥床者，不需自行活動，例如：四肢癱瘓、昏迷。\n³ 步態為蹣跚，長者需員工及用具輕扶作支持。\n⁴ 軀幹從臀部以上前傾，並需用扶手借力站起；移動時需職員協助或使用用具作支持。'
export const circulationDocuments=['傳閱文件','使用急症室紀錄','「個人照顧計劃」評估表格 1－院友健康狀況評估','失禁評估及計劃表','Norton Score','物理治療評估報告及照顧計劃表','Individual Care Plan','職業治療評估及照顧計劃表','遊走風險評估 Wandering Risk Scale','老年人精神抑鬱量度表 Geriatric Depression Scale (GDS) Short Form','社康評估及計劃表','個人照顧計劃']
export const mobilityGroups=[{id:'ems',title:'Elderly Mobility Score',rows:emsRows,max:20},{id:'balance',title:'Tinetti — Balance Score',rows:balanceRows,max:16},{id:'gait',title:'Tinetti — Gait Score',rows:gaitRows,max:12}]
export const reviewKey=(group:string,col:number,item:string)=>`${group}:${col}:${item}`
export function createCareReview(id:string):CareReviewData{
 const values:ReviewData={age:'',gender:'',room:'',manager:'',documents:[],ambulatory:'',gaitAnalysis:'',stairs:'',tug:'',therapist:''}
 if(id==='form-10')for(let col=0;col<6;col++){for(const key of ['date','reason','staff','title','signature'])values[reviewKey('fall',col,key)]='';values[reviewKey('fall',col,'measures')]=[];for(const item of fallItems)values[reviewKey('fall',col,item.key)]=''}
 if(id==='form-11')for(const group of mobilityGroups)for(let col=0;col<4;col++){values[reviewKey(group.id,col,'date')]='';for(const row of group.rows)values[reviewKey(group.id,col,row.key)]=''}
 return{values,circulation:[]}
}
export function fallSummary(values:ReviewData,col:number){let score=0,answered=0;for(const item of fallItems){const value=values[reviewKey('fall',col,item.key)];if(typeof value==='string'&&value!==''&&item.options.some(o=>o.value===value)){score+=Number(value);answered++}}const complete=answered===6;return{score,answered,complete,risk:complete?(score<45?'輕度':score<80?'中度':'高度'):'未完成'}}
export function mobilitySummary(values:ReviewData,group:string,rows:ScoreRow[],col:number){let score=0,answered=0;for(const row of rows){const value=values[reviewKey(group,col,row.key)];if(typeof value==='string'&&value!==''&&row.options.includes(Number(value))){score+=Number(value);answered++}}return{score,answered,complete:answered===rows.length}}
export function validateCareReview(data:CareReviewData,id:string,completed:boolean){
 const age=data.values.age;if(age!==''&&age!==undefined&&(typeof age!=='string'||!Number.isInteger(Number(age))||Number(age)<0))return '年齡請輸入有效整數。'
 if(id==='form-10')for(let col=0;col<6;col++){const active=fallSummary(data.values,col).answered>0||!!data.values[reviewKey('fall',col,'date')];if(active&&completed&&(!fallSummary(data.values,col).complete||!data.values[reviewKey('fall',col,'date')]))return `第 ${col+1} 次跌倒評估請填齊日期及六項評分，或儲存為 Draft。`}
 if(id==='form-11')for(const group of mobilityGroups)for(let col=0;col<4;col++){const total=mobilitySummary(data.values,group.id,group.rows,col);if(completed&&(total.answered>0||!!data.values[reviewKey(group.id,col,'date')])&&(!total.complete||!data.values[reviewKey(group.id,col,'date')]))return `${group.title} 第 ${col+1} 次請填齊日期及分數，或儲存為 Draft。`}
 if(id==='form-12'&&completed&&data.circulation.some(r=>!r.date||!r.staff.trim()||!r.signature.trim()))return '請填寫每行傳閱紀錄的日期、職員姓名及簽署。'
 return ''
}
