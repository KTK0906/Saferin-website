import type {RehabSection,RehabField} from './rehab-forms'
const f=(key:string,label:string,type:RehabField['type']='text',items?:string[]):RehabField=>({key,label,type,items})
const yn=['有','無']
const age:RehabField={...f('age','年齡','number'),min:0}
const sex=f('gender','性別','select',['男','女','其他','未提供'])
function yesNoFields(prefix:string,labels:string[]):RehabField[]{return labels.flatMap((label,index)=>[f(`${prefix}-${index}`,label,'select',yn)])}
export const intakeReferralSections:Record<string,RehabSection[]>={
 'form-18':[
 {id:'basic',title:'接見資料',fields:[f('accompanying','陪同親友姓名及關係')]},
 {id:'mobility',title:'第一部分：1–4. 行動、精神及護理需要',fields:[f('mobility','行動情況','select',['自如','需要用助行架／輔助器','坐輪椅','臥床']),f('mental','精神狀況','multi',['正常','呆滯','自殺傾向','滋擾行為（隨處大小便、尖聲怪叫、暴力、自殘等）','老年痴呆','其他']),f('behaviourOther','滋擾行為／其他精神狀況','textarea'),f('dementiaRules','老年痴呆嚴重程度是否影響遵守院規','select',['是','否']),f('continence','失禁情況','select',['無失禁','間中有大／小便失禁','經常大／小便失禁']),f('continenceDetails','失禁詳情'),f('nursing','護理服務需要','multi',['無特別需要','需要插胃喉','依賴氧氣機','壓瘡','傳染病']),f('oxygenSeverity','依賴氧氣機：嚴重性'),f('pressureStage','壓瘡：第幾期'),f('pressureDetails','壓瘡詳情'),f('infectiousSkin','傳染病：皮膚','select',yn),f('skinDetails','皮膚傳染病詳情'),f('tb','TB','select',yn),f('vdrl','VDRL','select',['正','負'])]},
 {id:'group',title:'第一部分：5. 群體生活的適切性',fields:[f('willingness','5.1 入住院舍的意願','select',['樂意','無奈／勉強（順從其他人的意願）','其他']),f('willingnessOther','其他入住意願'),f('rules','5.2 遵從院規','select',['樂意接受','勉強接受','不接受']),f('rulesReason','不接受院規：請註明'),f('language','5.3 語言表達能力','select',['流利','普通','模糊不清','其他']),f('languageOther','其他語言表達情況'),f('dialect','如不懂說廣東話，所操方言'),f('manners','5.4 禮貌／談吐','select',['斯文','粗魯','一般','其他']),f('mannersOther','其他禮貌／談吐'),f('personality','5.5 性格','multi',['開朗','文靜、內向','抑鬱','其他']),f('personalityOther','其他性格'),f('familyRelationship','5.6 同住／親人的關係','select',['好','一般','差']),f('friendRelationship','朋友的關係','select',['好','一般','差','沒有朋友'])]},
 {id:'habits',title:'第一部分：6. 特別生活習慣',fields:[...yesNoFields('habit',['6.1 偏食','6.2 吸煙','6.3 飲酒','6.4 上香拜神','6.5 堅持自己清洗衣物','6.6 特別沐浴習慣','6.7 日間睡眠習慣','6.8 其他生活習慣']),f('avoidFood','偏食／戒口內容'),f('bathing','沐浴習慣','select',['每天','每隔若干天','只肯抹身']),{...f('bathInterval','隔幾天沐浴','number'),min:1},f('bathTime','沐浴時間'),f('napTime','日間睡眠時間'),f('habitsOther','其他生活習慣','textarea')]},
 {id:'interests',title:'第一部分：7. 興趣',fields:[...yesNoFields('interest',['7.1 睇電視','7.2 聽收音機','7.3 打麻雀／天九等','7.4 閱讀書刊','7.5 養寵物','7.6 下棋','7.7 社交康樂活動','7.8 戶外活動','7.9 其他興趣']),f('petDetails','寵物：請註明'),f('interestsOther','其他興趣'),f('talents','7.10 才能（例如書法、繪畫、木工等）','textarea')]},
 {id:'finance',title:'第一部分：8. 經濟狀況',fields:[...yesNoFields('finance',['8.1 綜合社會保障援助／傷殘津貼／高齡津貼','8.2 儲蓄','8.3 家人資助']),f('savingsDetails','儲蓄詳情')]},
 {id:'health',title:'第二部分：健康狀況及護士補充',fields:[f('foodAllergy','食物敏感資料','select',['有','沒有資料']),f('foodAllergyDetails','食物敏感：請註明'),f('drugAllergy','藥物敏感資料','select',['有','沒有資料']),f('drugAllergyDetails','藥物敏感：請註明'),f('nurseNotes','註冊護士填寫：只記錄與 MDS-HC 及照肺報告不符或不足的資料','textarea'),f('nurseSignature','負責職員簽署（輸入姓名）'),f('nurseDate','填寫日期','date')]},
 {id:'admission',title:'第三部分：入住細節及適應',fields:[f('admissionDate','入住日期','date'),f('admissionTime','入住時間'),{...f('fees','所收院費','number'),min:0},f('passbook','存摺及圖章保管','select',['安老院','家人']),f('adaptation','周期出現之適應問題／可推動申請人發展之項目','textarea'),f('contacts','其他（包括接案後有關聯絡的重要資料）','textarea')]},
 {id:'outcome',title:'第四部分：評估結果',fields:[f('recommended','申請人是否獲推薦入住本院','select',['獲推薦','不獲推薦']),f('rejectionReason','不獲推薦原因','textarea'),f('principalSignature','院長簽署及姓名（輸入姓名）'),f('principalDate','日期','date')]},
 ],
 'form-19':[
 {id:'basic',title:'轉介資料',fields:[f('department','致','multi',['物理治療部 (PT)','職業治療部 (OT)','言語治療部 (ST)']),f('from','由（轉介職員）'),f('urgent','急件','select',['是','否']),f('room','房號／床號'),f('referralReasons','轉介原因','multi',['新院友','出院','跌倒','使用約束物品評估','獨自外出／離開樓層／遊走風險評估','其他']),f('admissionDate','新院友：入住日期','date'),f('newCondition','出院：新病症'),f('fallDetails','跌倒詳情'),f('referralOther','其他轉介原因','textarea')]},
 {id:'pt',title:'物理治療部（PT）',fields:[f('ptItems','轉介項目','multi',['步行評估','疼痛處理','胸肺治療','扶抱移轉評估','評估使用吊兜式／站立式轉移機','安裝／拆除：小型床欄／警報器','購買／維修：助行器／輪椅','輪椅使用評估／訓練']),f('ptEquipment','PT 安裝／拆除／購買／維修詳情','textarea')]},
 {id:'ot',title:'職業治療部（OT）',fields:[f('otItems','轉介項目','multi',['自理能力評估','認知能力評估','坐／臥姿改善','壓瘡護理用品','評估使用站立式轉移機／浴床／沐邊便椅','復康用品購買／維修','安裝／拆除警報器','輪椅使用評估／訓練']),f('otEquipment','OT 復康用品購買／維修詳情','textarea')]},
 {id:'st',title:'言語治療部（ST）',fields:[f('stItems','轉介項目','multi',['吞嚥能力評估','飯餐評估','餵食用具／方法評估','進食姿勢／位置評估','口部進食評估（適用於非口部進食院友）','語言溝通能力評估','聲線評估'])]},
 {id:'signoff',title:'轉介及治療師回覆',fields:[f('referrerSignature','轉介職員簽署（輸入姓名）'),f('referrerName','轉介職員姓名'),f('respondingDepartment','負責治療師部門','multi',['PT','OT','ST']),f('outcomes','處理情況','multi',['已評估及記錄，詳見院友護理紀錄 (CNC-09)／跌倒報告表 (CNC-01)','已完成安裝／維修']),f('recommendations','治療師建議','textarea'),f('therapistSignature','負責治療師簽署（輸入姓名）'),f('therapistName','負責治療師姓名'),f('therapistDate','日期','date')]},
 ],
 'form-20':[
 {id:'personal',title:'個人及健康資料',fields:[sex,age,f('education','教育程度','select',['無','小學','中學','大學']),f('religion','宗教信仰','select',yn),f('religionDetails','宗教信仰詳情'),f('drugAllergy','藥物過敏','select',yn),f('drugAllergyDetails','藥物過敏詳情'),f('foodAllergy','食物過敏','select',yn),f('foodAllergyDetails','食物過敏詳情'),f('history','病歷','textarea'),f('dentures','假牙','select',yn),f('denturesDetails','假牙詳情'),f('diet','進食餐類')]},
 {id:'assessment',title:'精神、護理及功能狀況',fields:[f('mental','精神狀況','textarea'),f('sleep','睡眠情況','textarea'),f('continence','失禁情況'),f('skin','皮膚'),f('wound','傷口'),f('communication','溝通能力'),f('vision','視力'),f('hearing','聽力'),f('mobility','活動能力','textarea'),f('recentFalls','最近三個月倒跌史','textarea'),f('recentHospital','最近入院／使用 A&E 情況','textarea')]},
 {id:'vaccines',title:'疫苗注射及特別護理',fields:[f('vaccines','疫苗注射','multi',['流感疫苗','肺炎球菌疫苗']),f('fluYear','流感疫苗年份'),f('pneumococcalYear','肺炎球菌疫苗年份'),f('restraints','約束物品','select',yn),f('restraintsDetails','約束物品種類'),f('specialCare','特別護理','select',yn),f('specialCareDetails','特別護理詳情','textarea'),f('careSuggestions','照顧建議','textarea')]},
 {id:'confirmation',title:'面見同事確認',fields:[f('interviewer','面見同事'),f('interviewDate','日期','date')]},
 ],
}
export const cornellGroups=[
 {title:'（一）情緒表徵',items:['焦慮：表現／表達焦慮、沉思／反覆思想某事情、擔憂','悲傷：表現／表達悲傷、哀傷憂鬱、哭泣','對於歡愉活動缺乏動力參與','過敏：容易被惹惱、脾氣暴躁']},
 {title:'（二）行為混亂',note:'給予分數準則：改變是突然發生，並非長期出現，即少於 1 個月內出現。',items:['煩亂：坐立不安、緊握雙手／磨拳擦掌、扯髮','遲緩：身體活動減慢、說話速度慢、反應慢','投訴多處身體不適（若只投訴腸胃問題則給予 1 分）','缺乏興趣：減少參加正常參與之活動']},
 {title:'（三）身體徵狀',note:'給予分數準則：改變是突然發生，並非長期出現，即少於 1 個月內出現。',items:['缺乏胃口：比平常食量減少','體重下降：如 1 個月內減少體重多於 5 磅則給予 2 分','缺乏能量：容易疲倦，不能持久參與活動']},
 {title:'（四）生理週期',items:['一日之間情緒變化較大：早上徵狀尤為嚴重','入睡困難：對於被評估者來說比以往較遲才能入睡','睡眠過程中經常扎醒','過早睡醒：對於被評估者來說比以往較早睡醒']},
 {title:'（五）思想混亂',items:['自殺：覺得生命不值得留戀、有自殺念頭或嘗試自殺','自信心低落：自責、自我貶值、感覺失敗','悲觀主義：只會預期發生不好的事情或較差的情況','影響情緒之妄想：妄想貧窮、生病或遺失等']},
].map((group,index,all)=>({...group,offset:all.slice(0,index).reduce((n,g)=>n+g.items.length,0)}))
export interface AppointmentRow{id:string;place:string;date:string;medications:string}
export interface IntakeExtra{floor:string;answers:string[];appointments:AppointmentRow[]}
export const createIntakeExtra=():IntakeExtra=>({floor:'',answers:Array(19).fill(''),appointments:[]})
export function cornellSummary(answers:string[]){let total=0,answered=0,unassessable=0;for(let i=0;i<19;i++){const a=answers[i];if(['0','1','2','a'].includes(a)){answered++;if(a==='a')unassessable++;else total+=Number(a)}}const complete=answered===19&&unassessable===0;return{total,answered,unassessable,complete,aboveThreshold:complete&&total>=8}}
