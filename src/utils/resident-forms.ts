import type { RehabField,RehabSection } from './rehab-forms'
const f=(key:string,label:string,type:RehabField['type']='text',items?:string[]):RehabField=>({key,label,type,items})
const n=(key:string,label:string,min=0,max?:number,suffix?:string):RehabField=>({...f(key,label,'number'),min,max,suffix})
const gender=f('gender','性別','select',['男','女','其他','未提供'])
const yesNo=['是','否']
const impairment=['正常','輕度受障','中度受障','嚴重受障']
const dated=(id:string,title:string,fields:RehabField[]):RehabSection=>({id,title,fields:[f(`${id}Date`,'本項評估日期','date'),...fields]})
export const nortonItems=[{key:'nortonPhysical',label:'一般健康情況',items:['良好（4分）','常（3分）','差（2分）','甚差（1分）']},{key:'nortonMental',label:'神智',items:['清醒警覺（4分）','冷淡無神（3分）','混亂（2分）','昏睡（1分）']},{key:'nortonActivity',label:'活動能力',items:['活動自如（4分）','需協助（用輔助架）（3分）','只能坐椅（2分）','臥床不起（1分）']},{key:'nortonMobility',label:'肢體活動',items:['完全（4分）','輕微受限（3分）','十分受限（2分）','不能活動（1分）']},{key:'nortonContinence',label:'失禁',items:['沒有（4分）','偶然（3分）','經常小便失禁（2分）','大小便失禁（1分）']}]
const carePlans:RehabField[]=[]
for(const [key,title] of [['nursing','護理部（副院長／護士／保健）'],['physio','復康部：物理治療'],['occupational','復康部：職業治療'],['speech','復康部：言語治療'],['social','社福部']])carePlans.push(f(`${key}Plan`,`${title}：照顧計劃`,'textarea'),f(`${key}Signature`,`${title}：職員姓名及簽署（輸入姓名）`),f(`${key}Date`,`${title}：日期`,'date'))
export const residentSections:Record<string,RehabSection[]>={
 'form-13':[
  {id:'personal',title:'A. 院友個人資料',fields:[gender,f('birthDate','出生日期','date'),f('residentNumber','院友編號（SWK/DRRP/）'),f('room','樓層／房間／床號'),f('stayFrom','住宿日期：由','date'),f('stayTo','住宿日期：至','date')]},
  {id:'medical',title:'B-1–4. 健康、精神及感官狀況',fields:[f('history','病歷','textarea'),f('mental','精神狀況','multi',['正常','呆滯','冷漠','混亂','其他']),f('mentalOther','其他精神狀況（如遊蕩行為）'),f('vision','視力','select',impairment),f('visionRemarks','視力備註'),f('hearing','聽力','select',impairment),f('hearingRemarks','聽力備註'),f('language','語言能力','select',impairment),f('languageRemarks','語言能力備註'),f('glasses','需配戴眼鏡','select',yesNo),f('hearingAid','需使用助聽器','select',yesNo),f('dialect','方言（原表：廣東話）'),f('dialectRemarks','方言備註'),f('dentures','牙齒及口腔','multi',['無假牙','有假牙：上顎','有假牙：下顎']),f('dentureCare','清洗假牙','select',['自理','協助'])]},
  {id:'nutrition',title:'B-5. 營養及飲食',fields:[n('weightKg','體重',0,undefined,'kg'),n('heightCm','身高',0,undefined,'cm'),f('diet','餐類','multi',['正常餐','碎餐','糊餐','胃喉餵飼','糖尿餐','低鹽餐','低普林餐','薄血餐','其他']),f('tubeMilk','胃喉餵飼：奶類／份量'),f('dietOther','其他餐類'),n('thickener','加凝固粉',0,undefined,'tsp/100ml'),f('feedingHelp','需協助餵食','select',yesNo)]},
  {id:'skin',title:'B-6. 皮膚狀況及 Norton Score',fields:[f('skin','皮膚狀況','multi',['正常','乾燥','皮疹','傷口','水腫','其他']),f('rashSite','皮疹位置'),f('woundSite','傷口位置'),f('oedemaSite','水腫位置'),f('skinOther','其他皮膚狀況'),...nortonItems.map(i=>f(i.key,i.label,'select',i.items))]},
  {id:'nursing',title:'B-7. 特別護理需要',fields:[n('oxygen','使用氧氣機',0,undefined,'L/min'),f('nursingNeeds','護理需要','multi',['尿喉護理','胃管餵飼護理','傷口護理','其他']),f('woundCare','傷口護理內容','textarea'),f('nursingOther','其他護理需要','textarea')]},
  {id:'mobility',title:'B-8. 活動能力評估（由物理治療師負責）',fields:[f('pain','痛症','select',['無','有']),f('painDetails','痛症詳情'),f('joint','關節活動','select',['正常','下降']),f('jointDetails','關節活動詳情'),f('muscle','肌肉力量','select',['正常','下降','弱']),f('muscleDetails','肌肉力量詳情'),f('transfer','移轉','multi',['自助','1 人協助','2 人協助','使用站立式電動移轉機','使用吊兜式電動移轉機','其他']),f('transferOther','其他移轉方式'),f('mobility','活動能力','multi',['獨自步行','用助行架步行','1 人協助步行','輪椅使用者','不能步行']),f('mobilityDetails','步行補充資料'),f('fallRisk','跌倒危機','select',['低','中','高'])]},
  {id:'cognition',title:'B-9. 認知能力及自理能力（由職業治療師負責）',fields:[f('cognition','認知能力','select',['無明顯受損','輕度受損','中度受損','嚴重受損']),f('wandering','遊走風險','select',['有','沒有']),f('toilet','自理能力（如廁）','multi',['全日自行如廁','日間自行如廁','晚上自行使用便椅／尿壺','全日使用尿片','晚上使用尿片']),f('bathing','自理能力（沐浴）','multi',['自行沐浴','協助用便椅沐浴','協助用浴床沐浴']),f('sitting','坐姿評估','multi',['一般靠背椅','扶手椅','輪椅（自行推／轉移）','老人椅'])]},
  {id:'social',title:'B-10. 社康評估（由社工負責）',fields:[f('socialBackground','個案背景及需要','textarea')]},
  {id:'plans',title:'C. 各部門照顧計劃',fields:carePlans},
  {id:'confirmation',title:'個案經理及院長確認',fields:[f('managerSignature','個案經理簽署（輸入姓名）'),f('managerDate','個案經理日期','date'),f('principalSignature','院長簽署（輸入姓名）'),f('principalDate','院長日期','date')]},
 ],
 'form-14':[
  {id:'personal',title:'院友個人資料',fields:[gender,f('birthDate','出生日期','date'),f('hkid','身份證號碼'),f('marital','婚姻狀況'),f('admissionDate','入住日期','date'),f('residentNumber','院友編號')]},
  {id:'background',title:'1–4. 背景資料',fields:[f('religion','宗教信仰','select',['佛教','天主教','基督教','回教','其他','沒有宗教信仰']),f('religionOther','其他宗教信仰'),f('education','教育程度','select',['文盲','小學程度','中學程度','大專程度','私塾']),f('occupation','曾任職業：請註明'),f('retired','已退休','select',yesNo),n('retiredYears','已退休年數',0,undefined,'年'),f('finance','經濟狀況','multi',['自行負擔','高齡津貼','綜合援助','傷殘津貼','由子女／親屬供養','長者生活津貼'])]},
  {id:'living',title:'5. 入住前居住狀況',fields:[f('living','居住狀況','multi',['露宿者','床位','木屋','艇戶','公共屋邨','私人樓宇','獨居','老人宿舍','私營安老院','與家人同住','日間獨自一人在家','全日由護老者照顧','其他']),f('carerRelationship','與護老者關係'),f('livingOther','其他居住狀況：請註明')]},
  {id:'habits',title:'6. 個人習慣',fields:[f('smoking','吸煙習慣','select',['經常吸煙','不吸煙']),f('alcohol','飲酒習慣','select',['經常飲酒','不飲酒'])]},
 ],
 'form-16':[
  dated('chronic','A. 慢性疾病記錄',[f('conditions','慢性疾病','multi',['肺部感染','慢性阻塞性呼吸道疾病','充血性心臟衰竭','高血壓','中風','柏金遜病','老人昏亂','腎臟衰竭','骨關節炎','退化性關節炎','認知障礙症','糖尿病','痛風症','缺血性心臟病','股骨骨折','白內障','其他']),f('conditionOther','其他疾病'),f('fractureSide','股骨骨折側別','multi',['右','左']),f('cataractSide','白內障側別','multi',['右眼','左眼'])]),
  dated('medication','B. 接受服藥的合作性',[f('cooperation','服藥合作性','multi',['非常合作','自我選擇服藥的數目','拒服','自行服用','偽裝服藥'])]),
  dated('hospital','C. 使用急症室及醫院記錄',[n('erCount','過去 12 個月使用急症室次數'),n('hospitalCount','過去 12 個月入住醫院次數')]),
  dated('cognition','D. 認知能力',[f('amtApplicability','AMT 適用情況','multi',['已經醫生診斷患有認知障礙症（不需填此項）','不能溝通（不需填此項）','沒有職業治療師之院舍']),n('amtScore','簡易記憶力測試（AMT）分數',0,10),f('amtAttachment','AMT 附頁編號／補充資料')]),
  dated('communication','E. 溝通與聽覺能力',[f('expression','自我表達方法','multi',['言語：清晰','言語：含糊不清','以文字表達','藉身體語言、聲音及圖畫表達','沒有表達方式']),f('dialect','方言'),f('hearingAid','使用助聽器','select',yesNo),f('hearing','聽覺（如有助聽器，按使用後聽力）','select',['聽力正常（可正常交談、看電視、聽電話）','輕微困難（在耳邊或需大聲說話）','缺乏聽覺能力']),f('hearingSide','缺乏聽覺能力側別','multi',['雙耳','右耳','左耳']),f('understanding','表達及理解','select',['明白旁人及作出適當回應','只能作簡單的溝通','極難／無法理解'])]),
  dated('vision','F. 視力',[f('vision','視力（如有眼鏡，按戴上後視力）','select',['適當（能看清細節，包括書報上的標準印刷字體）','輕微不健全（只能看到書報上大字體印刷）','中等不健全（只能識別物件，不能看清書報標題）','高度不健全（只能看到光、顏色）','失明']),f('blindSide','失明側別','multi',['雙眼','右眼','左眼'])]),
  dated('oral','G. 牙齒及口腔狀況',[f('oral','牙齒及口腔狀況','multi',['口腔衛生良好','口腔衛生欠佳','配戴全口假牙托','配戴部份假牙托','配戴牙冠或牙橋','牙齒鬆動或牙痛'])]),
  dated('nutrition','H. 營養及進食狀況',[f('feedingRoute','進食途徑','multi',['經口','經鼻飼','經胃造口']),f('feedingProblems','進食問題','multi',['沒有問題','咀嚼困難（牙齒問題、無力咀嚼）','吞嚥困難（有哽喉現象）']),f('diet','進食類別','multi',['正常','特別餐','軟餐','糊狀','加凝固粉']),f('intake','食量','select',['經常可食全份飯菜（管飼每日 >1200ml）','經常可食一半或以上全份飯菜（管飼每日 1000–1200ml）','經常食少於一半全份飯菜（管飼每日 <1000ml）','經常厭食或絕食']),f('otherNutrition','有其他營養食物：請註明'),n('heightM','身高',0,undefined,'m'),n('weightKg','體重',0,undefined,'kg')]),
  dated('skin','I. 皮膚狀況',[f('skin','皮膚狀況','multi',['完整','乾燥','濕疹','曾患疥瘡','手術疤痕','破損']),f('scabiesDate','曾患疥瘡日期','date'),f('woundAttachment','傷口表格附頁編號'),n('nortonScore','Norton Score',0,20)]),
  dated('continence','J. 理遺',[f('urination','排尿','multi',['完全受控制','間中失禁（1 週內失禁 1 次或少於 1 次）','有時失禁（1 週內 2 次或以上）','常失禁（每天失禁，有時可控制）','失禁（不能控制）','需要導尿管','小便頻密（少於 2 小時便需如廁）']),f('bowel','排便','multi',['有良好習慣','經常便秘（超過 3 天沒有排便）','不能控制'])]),
  dated('sleep','K. 睡眠狀態',[f('sleep','睡眠狀態','multi',['熟睡（晚間起床少於 3 次）','晚間起床超過 3 次（如廁、飲水等）','一週內多於兩晚失眠而沒有騷擾行為','常有呼叫行為','間中有呼叫行為','差不多整夜在遊蕩'])]),
  dated('mental','L. 精神健康（按院友需要進行評估）',[f('depressionScale','量表','select',['Geriatric Depression Scale','Cornell Scale for Depression in Dementia']),n('depressionScore','量表分數')]),
  dated('behaviour','M. 行為問題的徵象',[f('behaviour','行為問題','multi',['遊蕩','口語上的虐待行為（威脅、咒罵他人）','行動上的虐待行為（打人、推人、抓人、性侵犯他人）','社交上不適當行為（噪音、尖叫、公眾場合脫衣或性行為、亂丟食物排泄物、搜人東西、過早起床打擾他人）','粗暴地拒絕他人照顧（掉藥、推撞照顧者）','自虐行為（重複抓自己身體）','沒有行為上問題'])]),
  {id:'confirmation',title:'評估員確認',fields:[f('assessorName','評估員姓名'),f('assessorSignature','評估員簽署（輸入姓名）'),f('signedDate','日期','date')]},
 ],
}
export interface RelativeRow{id:string;name:string;gender:string;age:string;relationship:string;address:string;phone:string}
export interface ResidentExtra{relativesPresence:string;relatives:RelativeRow[];files:Record<string,string>}
export const createResidentExtra=():ResidentExtra=>({relativesPresence:'',relatives:[],files:{}})
export const residentFileGroups=[
 {title:'院友個人資料',rows:[['1','院友個人資料表','RS33.1'],['2','院友身份證影印本',''],['3a','院友肺片報告',''],['3b','MEF-A',''],['3c','MEF-B',''],['4','院友相片',''],['5','預設醫療指示影印本（如有）','']]},
 {title:'定期評估文件',rows:[['6','個案紀錄','RS30'],['7','接案撮要及面見報告','RS01 及 RS30'],['8','新院友入住面見','護理部 4.16'],['9','GDS / Cornell Scale for Depression in Dementia（如有）','RS33.8a/33.8b'],['10','入住首 24 小時及 7 天內評估及照顧計劃表','RS33.10'],['11','獨自外出協議書','']]},
 {title:'入住文件',rows:[['12','入住協議書','RS54'],['13a','殯葬事宜委託書','RS04'],['13b','殯葬事宜承諾書（欠缺認知能力院友）','RS05'],['14','私隱條例函件','RS09.2'],['15','接案工作—入住須知小冊子家人簽收','']]},
 {title:'社署文件',rows:[['16a','Result of Long Term Care Services Admission','FORM17'],['16b','通知行政部 AQ 宿位入住電郵',''],['17','醫療費用豁免證明書（如有）',''],['18','Referral for Admission for Long Term Care Services','LDS FORM 15'],['19','同意進入院舍照顧服務意向書','LDS FORM 13A'],['20','評估結果通知書','LDS FORM 4'],['21','入住「機構名額」宿位申請表相關文件（AQ）','AMD-007'],['22','Arrangement of Standardized Care Need Assessment for Admission to Care and Attention Places under Agency Quota (AQ)','AQ FORM I'],['23','入住機構配額宿位同意書（AQ）','AQ FORM V'],['24','Notification of Admission / Discharge (AQ)','AQ FORM VI']]},
]
export function validateResidentData(data:Record<string,string|string[]>,extra:ResidentExtra,id:string,completed:boolean,date:string){
 if(typeof data.birthDate==='string'&&data.birthDate&&data.birthDate>date)return '出生日期不能遲於評估／紀錄日期。'
 if(typeof data.stayFrom==='string'&&typeof data.stayTo==='string'&&data.stayFrom&&data.stayTo&&data.stayTo<data.stayFrom)return '住宿結束日期不能早於開始日期。'
 if(id==='form-14'&&extra.relativesPresence!=='沒有'){
  if(extra.relatives.some(r=>r.age!==''&&(!Number.isInteger(Number(r.age))||Number(r.age)<0)))return '親友年齡請輸入有效整數。'
  if(completed&&extra.relativesPresence==='有'&&(!extra.relatives.length||extra.relatives.some(r=>!r.name.trim())))return '請填寫親友姓名。'
 }
 if(id==='form-15'&&completed&&residentFileGroups.flatMap(g=>g.rows).some(([key])=>!['是','否','N/A'].includes(extra.files[key])))return '請為全部文件選擇是否儲存，或儲存為 Draft。'
 return ''
}
