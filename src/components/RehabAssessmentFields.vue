<script setup lang="ts">
import { computed, ref } from 'vue'
import { rehabForms, motorMovements, motorColumns, yearlyMetrics, cellKey, scoreSummary, balanceRows, gaitRows } from '@/utils/rehab-forms'
import type { RehabData, RehabSection, ScoreRow, RehabTable } from '@/utils/rehab-forms'
import { nortonItems } from '@/utils/resident-forms'
const props=defineProps<{modelValue:RehabData;formId:string;readonly?:boolean;hiddenSections?:string[]}>()
const emit=defineEmits<{(e:'update:modelValue',value:RehabData):void}>()
const root=ref<HTMLElement|null>(null)
const sections=computed(()=>(rehabForms[props.formId]||[]).filter(section=>!props.hiddenSections?.includes(section.id)))
const socialMentalGroups = computed(() => {
 const fields = rehabForms['form-9'].find(section => section.id==='mental')?.fields || []
 return [
  ['personality'], ['appearance','cognition'],
  ['emotion'], ['behaviour','behaviourRemarks'],
  ['thinking'], ['thinkingOther','interaction'],
  ['psychosocialNeeds'],
 ].map(keys => keys.flatMap(key => fields.filter(field => field.key===key)))
})
interface FieldLayout { keys:string[]; wide?:boolean; columns?:boolean }
const careLayout = (keys:string[], wide=false, columns=false):FieldLayout => ({keys,wide,columns})
const residentCareLayout:Record<string,FieldLayout[]> = {
 medical:[
  careLayout(['history'],true),
  careLayout(['mental','mentalOther']), careLayout(['dentures','dentureCare']),
  careLayout(['vision','glasses','visionRemarks']), careLayout(['hearing','hearingAid','hearingRemarks']),
  careLayout(['language','languageRemarks']), careLayout(['dialect','dialectRemarks']),
 ],
 nutrition:[
  careLayout(['weightKg']), careLayout(['heightCm']),
  careLayout(['diet','tubeMilk','dietOther'],true,true),
  careLayout(['thickener']), careLayout(['feedingHelp']),
 ],
 skin:[
  careLayout(['skin','rashSite','woundSite','oedemaSite','skinOther'],true,true),
  ...nortonItems.map(item => careLayout([item.key])),
 ],
 nursing:[careLayout(['oxygen','nursingNeeds']),careLayout(['woundCare','nursingOther'])],
 mobility:[
  careLayout(['pain']), careLayout(['painDetails']),
  careLayout(['joint']), careLayout(['jointDetails']),
  careLayout(['muscle']), careLayout(['muscleDetails']),
  careLayout(['transfer','transferOther']), careLayout(['mobility','mobilityDetails']),
  careLayout(['fallRisk'],true),
 ],
 cognition:[
  careLayout(['cognition']), careLayout(['wandering']), careLayout(['toilet'],true),
  careLayout(['bathing']), careLayout(['sitting']),
 ],
 plans:['nursing','physio','occupational','speech','social'].map(key => careLayout([`${key}Plan`,`${key}Signature`,`${key}Date`],true,true)),
 confirmation:[careLayout(['managerSignature','managerDate']),careLayout(['principalSignature','principalDate'])],
}
const residentProfileLayout:Record<string,FieldLayout[]> = {
 background:[
  careLayout(['religion','religionOther']), careLayout(['education','occupation']),
  careLayout(['retired','retiredYears'],true,true), careLayout(['finance'],true),
 ],
 living:[careLayout(['living','carerRelationship','livingOther'],true,true)],
}
const residentHealthLayout:Record<string,FieldLayout[]> = {
 chronic:[careLayout(['conditions'],true),careLayout(['conditionOther'],true),careLayout(['fractureSide']),careLayout(['cataractSide'])],
 medication:[careLayout(['cooperation'],true)],
 hospital:[careLayout(['erCount']),careLayout(['hospitalCount'])],
 cognition:[careLayout(['amtApplicability'],true),careLayout(['amtScore']),careLayout(['amtAttachment'])],
 communication:[careLayout(['expression','dialect']),careLayout(['hearingAid','hearing','hearingSide']),careLayout(['understanding'],true)],
 vision:[careLayout(['vision'],true),careLayout(['blindSide'],true)],
 oral:[careLayout(['oral'],true)],
 nutrition:[
  careLayout(['feedingRoute']),careLayout(['feedingProblems']),
  careLayout(['diet']),careLayout(['intake','otherNutrition']),
  careLayout(['heightM']),careLayout(['weightKg']),
 ],
 skin:[careLayout(['skin']),careLayout(['scabiesDate','woundAttachment','nortonScore'])],
 continence:[careLayout(['urination'],true),careLayout(['bowel'],true)],
 sleep:[careLayout(['sleep'],true)],
 mental:[careLayout(['depressionScale']),careLayout(['depressionScore'])],
 behaviour:[careLayout(['behaviour'],true)],
 confirmation:[careLayout(['assessorName']),careLayout(['assessorSignature']),careLayout(['signedDate'],true)],
}
const assessmentLayouts:Record<string,Record<string,FieldLayout[]>> = {
 'form-18':{
  basic:[careLayout(['accompanying'],true)],
  mobility:[
   careLayout(['mobility'],true),careLayout(['mental','behaviourOther'],true),careLayout(['dementiaRules'],true),
   careLayout(['continence','continenceDetails'],true,true),careLayout(['nursing'],true),
   careLayout(['oxygenSeverity']),careLayout(['pressureStage']),careLayout(['pressureDetails'],true),
   careLayout(['infectiousSkin','skinDetails'],true,true),careLayout(['tb']),careLayout(['vdrl']),
  ],
  group:[
   careLayout(['willingness','willingnessOther']),careLayout(['rules','rulesReason']),
   careLayout(['language','languageOther','dialect'],true,true),
   careLayout(['manners','mannersOther']),careLayout(['personality','personalityOther']),
   careLayout(['familyRelationship']),careLayout(['friendRelationship']),
  ],
  habits:[
   careLayout(['habit-0','avoidFood'],true,true),
   ...[1,2,3,4].map(index=>careLayout([`habit-${index}`])),
   careLayout(['habit-5','bathing','bathInterval','bathTime'],true,true),
   careLayout(['habit-6','napTime'],true,true),careLayout(['habit-7','habitsOther'],true),
  ],
  interests:[
   ...[0,1,2,3].map(index=>careLayout([`interest-${index}`])),
   careLayout(['interest-4','petDetails'],true,true),
   ...[5,6,7,8].map(index=>careLayout([`interest-${index}`])),
   careLayout(['interestsOther'],true),careLayout(['talents'],true),
  ],
  finance:[careLayout(['finance-0'],true),careLayout(['finance-1','savingsDetails'],true,true),careLayout(['finance-2'],true)],
  health:[careLayout(['foodAllergy','foodAllergyDetails']),careLayout(['drugAllergy','drugAllergyDetails']),careLayout(['nurseNotes'],true),careLayout(['nurseSignature']),careLayout(['nurseDate'])],
  admission:[...['admissionDate','admissionTime','fees','passbook'].map(key=>careLayout([key])),careLayout(['adaptation'],true),careLayout(['contacts'],true)],
  outcome:[careLayout(['recommended','rejectionReason'],true),careLayout(['principalSignature']),careLayout(['principalDate'])],
 },
 'form-19':{
  basic:[
   careLayout(['department'],true),careLayout(['from']),careLayout(['urgent']),careLayout(['room'],true),
   careLayout(['referralReasons'],true),careLayout(['admissionDate']),careLayout(['newCondition']),
   careLayout(['fallDetails'],true),careLayout(['referralOther'],true),
  ],
  pt:[careLayout(['ptItems'],true),careLayout(['ptEquipment'],true)],
  ot:[careLayout(['otItems'],true),careLayout(['otEquipment'],true)],
  st:[careLayout(['stItems'],true)],
  signoff:[
   careLayout(['referrerName']),careLayout(['referrerSignature']),careLayout(['respondingDepartment'],true),
   careLayout(['outcomes'],true),careLayout(['recommendations'],true),
   careLayout(['therapistName']),careLayout(['therapistSignature']),careLayout(['therapistDate'],true),
  ],
 },
 'form-23':{
  personal:[careLayout(['gender']),careLayout(['age']),careLayout(['room'],true),careLayout(['diagnosis'],true)],
  mental:[careLayout(['alertness']),careLayout(['command']),careLayout(['orientation']),careLayout(['memory']),careLayout(['speech'],true)],
  sensory:[
   ...[['visionRight','visionLeft'],['hearingRight','hearingLeft'],['sittingStatic','sittingDynamic'],['standingStatic','standingDynamic']].map(keys=>careLayout(keys,true,true)),
   careLayout(['tolerance'],true),
  ],
  limbs:[careLayout(['upperRemarks'],true),careLayout(['handRemarks'],true),careLayout(['lowerExtremity'],true)],
  mbi:[careLayout(['mbiTotal'],true),careLayout(['mbiRemarks'],true)],
  recommendation:[careLayout(['recommendation'],true),careLayout(['therapist']),careLayout(['signedDate'])],
 },
 'form-24':{
  personal:[careLayout(['admissionDate']),careLayout(['careLevel']),careLayout(['finance'],true),careLayout(['diagnosis'],true)],
  care:[
   careLayout(['bathing']),careLayout(['specialCare']),careLayout(['diet'],true),
   careLayout(['walking','assistancePeople','assistanceDetails'],true,true),careLayout(['other'],true),
  ],
  family:[
   careLayout(['icpMode'],true),careLayout(['phoneName','phoneRelationship'],true,true),
   careLayout(['attendingFamily','attendingRelationship'],true,true),careLayout(['explanationDate']),careLayout(['explanationStaff']),
   careLayout(['familyViews'],true),careLayout(['followup'],true),
  ],
  signatures:[...['manager','pt','nurse','ot','st','principal'].map(key=>careLayout([`${key}Signature`,`${key}Date`],true,true)),careLayout(['familySignature'],true)],
 },
}
const longOptionFields:Record<string,string[]> = {
 'form-16':['behaviour','urination','amtApplicability','feedingProblems','skin'],
 'form-18':['mental'], 'form-19':['referralReasons','outcomes'],
}
const healthDateField=(section:RehabSection)=>section.fields.find(field => field.type==='date'&&field.key===`${section.id}Date`)
function groupedFields(section:RehabSection) {
 if (props.formId==='form-9') return socialMentalGroups.value.map(fields => ({fields,wide:fields[0].key==='psychosocialNeeds',columns:false,plain:false}))
 const layoutBySection=assessmentLayouts[props.formId] || (props.formId==='form-16'?residentHealthLayout:props.formId==='form-14'?residentProfileLayout:residentCareLayout)
 const sectionFields=props.formId==='form-16'?section.fields.filter(field=>field!==healthDateField(section)):section.fields
 const layouts=layoutBySection[section.id] || sectionFields.map(field => careLayout([field.key],field.type==='textarea'))
 const assigned=new Set(layouts.flatMap(layout => layout.keys))
 const allLayouts=[...layouts,...sectionFields.filter(field => !assigned.has(field.key)).map(field => careLayout([field.key],field.type==='textarea'))]
 return allLayouts.map(layout => {
  const fields=layout.keys.flatMap(key => sectionFields.filter(field => field.key===key))
  return {...layout,fields,plain:fields.length===1 && !['multi','textarea'].includes(fields[0].type)}
 }).filter(group => group.fields.length)
}
const functionalGroups = [
 {key:'cognitiveIssues',title:'智能方面',rows:[
  {option:'記憶力',detail:'memory',label:'記憶力：補充'},
  {option:'理解力',detail:'understanding',label:'理解力：補充'},
  {option:'語言表達',detail:'expression',label:'語言表達：補充'},
 ]},
 {key:'physicalIssues',title:'體能方面',rows:[
  {option:'肢體活動幅度減少',detail:'range',label:'肢體活動幅度：補充'},
  {option:'肢體力度減弱',detail:'strength',label:'肢體力度：補充'},
  {option:'手部靈活度減弱',detail:'dexterity',label:'手部靈活度：補充'},
 ]},
]
const groupedFunctionalKeys = new Set(functionalGroups.flatMap(group => [group.key,...group.rows.map(row => row.detail)]))
function visibleFields(section: (typeof sections.value)[number]) {
 return props.formId==='form-6' && section.id==='functional'
  ? section.fields.filter(field => !groupedFunctionalKeys.has(field.key))
  : section.fields
}
const scalar=(key:string)=>typeof props.modelValue[key]==='string'?props.modelValue[key] as string:''
function set(key:string,value:string|string[]){if(!props.readonly)emit('update:modelValue',{...props.modelValue,[key]:value})}
function checked(key:string,value:string){const list=props.modelValue[key];return Array.isArray(list)&&list.includes(value)}
function toggle(key:string,value:string,on:unknown){const values=props.modelValue[key];const list=Array.isArray(values)?values:[];set(key,on?[...new Set([...list,value])]:list.filter(v=>v!==value))}
const levels=['完全不能執行','嘗試但不安全','需中等協助','需少量協助','可獨立完成']
function scoreOptions(table:RehabTable,row:ScoreRow){return row.options.map((value,index)=>({title:table.id==='mbi'?`${value} — ${levels[index]}`:String(value),value:String(value)}))}
function jump(id:string){root.value?.querySelector(`[id="rehab-${id}"]`)?.scrollIntoView({block:'start',behavior:'auto'})}
const tableRows=(table:RehabTable)=>table.kind==='motor'?motorMovements:table.kind==='yearly'?yearlyMetrics:table.matrixRows||[]
const tableCols=(table:RehabTable)=>table.kind==='motor'?motorColumns:table.kind==='yearly'?['本年','去年']:table.matrixCols||[]
const balance=computed(()=>scoreSummary(props.modelValue,{id:'balance',title:'',kind:'scores',rows:balanceRows}))
const gait=computed(()=>scoreSummary(props.modelValue,{id:'gait',title:'',kind:'scores',rows:gaitRows}))
const bmi=computed(()=>{const h=Number(scalar(props.formId==='form-13'?'heightCm':'heightM'))/(props.formId==='form-13'?100:1);const w=Number(scalar('weightKg'));return h>0&&w>0?(w/(h*h)).toFixed(1):'—'})
const norton=computed(()=>{let total=0,answered=0;for(const item of nortonItems){const m=scalar(item.key).match(/（([1-4])分）/);if(m){total+=Number(m[1]);answered++}}return{total,answered}})
</script>
<template>
 <div ref="root" class="rehab-fields mt-6" :class="{'ot-assessment':formId==='form-23'}">
  <div v-if="formId==='form-6'" class="text-body-2 mb-3">職業治療個人照顧計劃評估報告</div>
  <nav class="rehab-nav d-flex flex-wrap gap-2 py-3" aria-label="評估章節"><VBtn v-for="section in sections" :key="section.id" type="button" variant="tonal" size="small" @click="jump(section.id)">{{section.title}}</VBtn></nav>
  <section v-for="section in sections" :id="`rehab-${section.id}`" :key="section.id" class="rehab-section my-6" :aria-labelledby="`rehab-title-${section.id}`">
   <div v-if="formId==='form-16'&&healthDateField(section)" class="health-section-heading mb-5">
    <h5 :id="`rehab-title-${section.id}`" class="text-h5">{{section.title}}</h5>
    <AppTextField :model-value="scalar(healthDateField(section)!.key)" :label="healthDateField(section)!.label" type="date" :readonly="props.readonly" hide-details @update:model-value="set(healthDateField(section)!.key,String($event??''))" />
   </div>
   <h5 v-else :id="`rehab-title-${section.id}`" class="text-h5 mb-5">{{section.title}}</h5>
   <div v-for="table in section.tables||[]" :key="table.id" class="mb-6">
    <h6 class="text-subtitle-1 mb-3">{{table.title}}</h6>
    <div class="rehab-table-scroll">
     <table v-if="table.kind==='scores'" class="rehab-table"><thead><tr><th scope="col">項目</th><th scope="col">分數</th><th v-if="table.dates" scope="col">日期</th><template v-if="table.details"><th v-if="table.details!=='remarks'" scope="col">Aids</th><th scope="col">Remarks</th></template></tr></thead><tbody><tr v-for="row in table.rows" :key="row.key"><th scope="row">{{row.label}}</th><td class="score-cell"><AppSelect :model-value="scalar(cellKey(table.id,row.key,'score'))" :items="scoreOptions(table,row)" :aria-label="`${table.title} ${row.label} 分數`" :readonly="props.readonly" clearable hide-details @update:model-value="set(cellKey(table.id,row.key,'score'),String($event??''))" /></td><td v-if="table.dates"><AppTextField :model-value="scalar(cellKey(table.id,row.key,'date'))" type="date" :aria-label="`${row.label} 日期`" :readonly="props.readonly" hide-details @update:model-value="set(cellKey(table.id,row.key,'date'),String($event??''))" /></td><template v-if="table.details"><td v-for="col in table.details==='remarks'?['remarks']:['aids','remarks']" :key="col"><AppTextField :model-value="scalar(cellKey(table.id,row.key,col))" :aria-label="`${row.label} ${col}`" :readonly="props.readonly" hide-details @update:model-value="set(cellKey(table.id,row.key,col),String($event??''))" /></td></template></tr></tbody></table>
     <table v-else class="rehab-table matrix"><thead><tr><th scope="col">{{table.kind==='motor'?'Movement':'項目／指標'}}</th><th v-for="col in tableCols(table)" :key="col" scope="col">{{col}}</th></tr></thead><tbody><tr v-for="row in tableRows(table)" :key="row"><th scope="row">{{row}}</th><td v-for="col in tableCols(table)" :key="col"><AppTextField :model-value="scalar(cellKey(table.id,row,col))" :aria-label="`${row} ${col}`" :readonly="props.readonly" hide-details @update:model-value="set(cellKey(table.id,row,col),String($event??''))" /></td></tr></tbody></table>
    </div>
    <div v-if="table.kind==='scores'&&!table.manual" class="d-flex flex-wrap justify-space-between gap-2 mt-4" aria-live="polite"><span>{{scoreSummary(modelValue,table).complete?'總分':'暫計分數'}}：{{scoreSummary(modelValue,table).total}} / {{table.maximum}}</span><span>已填 {{scoreSummary(modelValue,table).answered}} / {{table.rows?.length}} 項</span></div>
    <details v-if="table.guidance" class="mt-4"><summary>原表評分說明及參考指標</summary><p class="guidance mt-3">{{table.guidance}}</p></details>
   </div>
   <div v-if="formId==='form-6'&&section.id==='functional'" class="functional-groups mb-6">
    <div v-for="group in functionalGroups" :key="group.key" class="functional-group" role="group" :aria-labelledby="`functional-${group.key}-heading`">
     <h6 :id="`functional-${group.key}-heading`" class="text-subtitle-1 font-weight-medium mb-4">{{group.title}}</h6>
     <div v-for="row in group.rows" :key="row.detail" class="functional-issue-row">
      <VCheckbox :model-value="checked(group.key,row.option)" :label="row.option" :readonly="props.readonly" hide-details density="compact" class="functional-checkbox" @update:model-value="toggle(group.key,row.option,$event)" />
      <AppTextField :model-value="scalar(row.detail)" :label="row.label" :readonly="props.readonly" hide-details class="functional-detail" @update:model-value="set(row.detail,String($event??''))" />
     </div>
    </div>
   </div>
   <div v-if="assessmentLayouts[formId]||['form-13','form-14','form-16'].includes(formId)||(formId==='form-9'&&section.id==='mental')" class="rehab-group-grid">
    <div v-for="group in groupedFields(section)" :key="group.fields[0].key" class="rehab-field-group" :class="{'rehab-group-wide':group.wide,'rehab-group-columns':group.columns,'rehab-group-plain':group.plain}">
     <div v-for="field in group.fields" :key="field.key" class="rehab-group-control" :class="{'rehab-control-wide':['multi','textarea'].includes(field.type)}">
      <div v-if="field.type==='multi'" role="group" :aria-labelledby="`social-${field.key}-label`">
       <div :id="`social-${field.key}-label`" class="rehab-group-label">{{field.label}}</div>
       <div class="rehab-group-options" :class="{'rehab-long-options':longOptionFields[formId]?.includes(field.key)}"><VCheckbox v-for="item in field.items" :key="item" :model-value="checked(field.key,item)" :label="item" :readonly="props.readonly" hide-details density="compact" @update:model-value="toggle(field.key,item,$event)" /></div>
      </div>
      <AppSelect v-else-if="field.type==='select'" :model-value="scalar(field.key)" :label="field.label" :items="field.items" :readonly="props.readonly" clearable hide-details @update:model-value="set(field.key,String($event??''))" />
      <AppTextarea v-else-if="field.type==='textarea'" :model-value="scalar(field.key)" :label="field.label" :readonly="props.readonly" rows="3" auto-grow hide-details @update:model-value="set(field.key,String($event??''))" />
      <AppTextField v-else :model-value="scalar(field.key)" :label="field.label" :type="field.type" :min="field.min" :max="field.max" :suffix="field.suffix" :step="field.type==='number'?'any':undefined" :readonly="props.readonly" hide-details @update:model-value="set(field.key,String($event??''))" />
     </div>
    </div>
   </div>
   <VRow v-else>
    <VCol v-for="field in visibleFields(section)" :key="field.key" cols="12" :md="field.type==='textarea'?12:6">
     <div v-if="field.type==='multi'" class="rehab-options"><div class="text-subtitle-1 mb-2">{{field.label}}</div><VCheckbox v-for="item in field.items" :key="item" :model-value="checked(field.key,item)" :label="item" :readonly="props.readonly" hide-details density="compact" @update:model-value="toggle(field.key,item,$event)" /></div>
     <AppTextarea v-else-if="field.type==='textarea'" :model-value="scalar(field.key)" :label="field.label" :readonly="props.readonly" rows="3" auto-grow @update:model-value="set(field.key,String($event??''))" />
     <AppSelect v-else-if="field.type==='select'" :model-value="scalar(field.key)" :label="field.label" :items="field.items" :readonly="props.readonly" clearable @update:model-value="set(field.key,String($event??''))" />
     <AppTextField v-else :model-value="scalar(field.key)" :label="field.label" :type="field.type" :min="field.min" :max="field.max" :suffix="field.suffix" :step="field.type==='number'?'any':undefined" :readonly="props.readonly" @update:model-value="set(field.key,String($event??''))" />
    </VCol>
   </VRow>
   <div v-if="['form-13','form-16'].includes(formId)&&section.id==='nutrition'" class="mt-5" aria-live="polite">BMI：{{bmi}} kg/m² <span class="text-body-2">（體重 kg ÷ 身高 m²）</span><p v-if="formId==='form-16'" class="text-body-2 mt-2">原表參考資料：正常分數 18.5–22.9。</p></div>
   <div v-if="formId==='form-13'&&section.id==='skin'" class="mt-5" aria-live="polite">Norton Score：{{norton.total}} / 20（{{norton.answered===5?'全部已填':'暫計'}}；已填 {{norton.answered}} / 5 項）</div>
   <p v-if="formId==='form-16'&&section.id==='cognition'" class="text-body-2 mt-4">原表：已經醫生診斷患有認知障礙症或不能溝通，不需填此項。AMT 只適用於沒有職業治療師的院舍。8–10 分：認知能力正常；4–7 分：認知能力普通；0–3 分：認知能力很差。</p>
   <p v-if="formId==='form-16'&&section.id==='skin'" class="text-body-2 mt-4">原表 Norton Score：12 分或以下，非常高機會產生壓瘡；14 分或以下，很高機會產生壓瘡。</p>
   <p v-if="formId==='form-16'&&section.id==='mental'" class="text-body-2 mt-4">原表備註：多於 8 分有精神抑鬱傾向；8 分或以下無精神抑鬱傾向。</p>
   <div v-if="formId==='form-7'&&section.id==='tinetti'" class="mt-5 text-subtitle-1" aria-live="polite">Tinetti Mobility Score (Balance + Gait)：{{balance.total+gait.total}} / 28 <span class="text-body-2">{{balance.complete&&gait.complete?'（全部項目已完成）':'（暫計；尚有未填項目）'}}</span></div>
   <p v-if="formId==='form-6'&&section.id==='functional'" class="text-body-2 mt-4">原表遊走風險：0–8 低度遊走風險；9–10 存在遊走風險；11 高度遊走風險。</p>
   <p v-if="formId==='form-7'&&section.id==='ambulation'" class="text-body-2 mt-4">原表 TUG 說明：少於 20 秒傾向可獨立活動；30 秒或以上傾向在多項活動中需要他人協助。</p>
  </section>
 </div>
</template>
<style scoped>
.rehab-section,.rehab-options{padding:20px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}
.rehab-section{scroll-margin-block-start:150px}.rehab-options{block-size:100%}
.rehab-nav{position:sticky;inset-block-start:0;z-index:2;background:rgb(var(--v-theme-surface))}
.rehab-table-scroll{overflow-x:auto}.rehab-table{border-collapse:collapse;inline-size:100%;min-inline-size:580px}
.rehab-table th,.rehab-table td{padding:10px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));text-align:start}
.rehab-table th{font-weight:500;min-inline-size:160px}.rehab-table td{min-inline-size:135px}.rehab-table .score-cell{min-inline-size:180px}
.matrix td{min-inline-size:125px}.guidance{white-space:pre-line;line-height:1.8}.rehab-fields :deep(.v-label){white-space:normal;opacity:1}
.ot-assessment .rehab-table th,.ot-assessment .rehab-table td{vertical-align:middle;line-height:1.6}
.ot-assessment .rehab-table thead th{background:rgba(var(--v-theme-on-surface),.04)}
.ot-assessment .matrix th:not(:first-child){text-align:center}
.ot-assessment .rehab-table-scroll{border-radius:6px}
.rehab-group-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:stretch}
.rehab-field-group{display:flex;flex-direction:column;gap:20px;min-inline-size:0;padding:16px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}
.rehab-group-wide{grid-column:1 / -1}
.rehab-group-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start}
.rehab-group-plain{padding:0;border:0}
.rehab-group-control{min-inline-size:0}
.rehab-group-columns > .rehab-control-wide{grid-column:1 / -1}
.rehab-group-label{margin-block-end:8px;font-size:.8125rem;font-weight:500;line-height:1.6}
.rehab-group-control :deep(.app-text-field > .v-label),.rehab-group-control :deep(.app-select > .v-label),.rehab-group-control :deep(.app-textarea > .v-label){display:block;margin-block-end:8px !important;font-weight:500;line-height:1.6 !important}
.rehab-group-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;row-gap:4px}
.rehab-long-options{grid-template-columns:minmax(0,1fr)}
.rehab-group-options :deep(.v-selection-control){align-items:flex-start;min-block-size:30px}
.rehab-group-options :deep(.v-selection-control__wrapper){flex-shrink:0}
.health-section-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,280px);gap:20px;align-items:center}
.health-section-heading > *{min-inline-size:0}
.health-section-heading :deep(.app-text-field > .v-label){display:block;margin-block-end:8px !important;font-weight:500;line-height:1.6 !important}
.functional-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.functional-group{padding:16px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px;min-inline-size:0}
.functional-issue-row{display:grid;grid-template-columns:minmax(120px,.9fr) minmax(0,1.1fr);gap:16px;align-items:end}
.functional-issue-row + .functional-issue-row{margin-block-start:20px}
.functional-checkbox{align-self:end;min-inline-size:0}
.functional-checkbox :deep(.v-selection-control){min-block-size:40px}
.functional-checkbox :deep(.v-selection-control__wrapper){flex-shrink:0}
.functional-checkbox :deep(.v-label){font-size:.8125rem;line-height:1.5}
.functional-detail{min-inline-size:0}
.functional-detail :deep(.v-label){display:block;min-block-size:22px;margin-block-end:6px !important;font-size:.8125rem;line-height:1.6 !important}
@media(max-width:850px){.functional-groups{grid-template-columns:minmax(0,1fr);gap:16px}}
@media(max-width:767px){.rehab-group-grid,.rehab-group-columns,.health-section-heading{grid-template-columns:minmax(0,1fr);gap:16px}.rehab-field-group{padding:14px;gap:16px}.rehab-group-plain{padding:0}}
@media(max-width:400px){.rehab-group-options{grid-template-columns:minmax(0,1fr)}}
@media(max-width:480px){.functional-issue-row{grid-template-columns:minmax(0,1fr);gap:4px}.functional-issue-row + .functional-issue-row{margin-block-start:16px}}
@media(max-width:600px){.rehab-section,.rehab-options{padding:14px}}
</style>
