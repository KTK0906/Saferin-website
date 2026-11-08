<script setup lang="ts">
import {computed} from 'vue'
import {wanderingItems,pressureItems,memoryWords,riskSummary,mocaSummary} from '@/utils/final-assessment-forms'
import type {FinalAssessmentExtra} from '@/utils/final-assessment-forms'
const props=defineProps<{modelValue:FinalAssessmentExtra;formId:string;readonly?:boolean}>()
const emit=defineEmits<{(e:'update:modelValue',value:FinalAssessmentExtra):void}>()
const pressure=computed(()=>props.formId==='form-22')
const items=computed(()=>pressure.value?pressureItems:wanderingItems)
const risk=computed(()=>riskSummary(props.modelValue,pressure.value)),moca=computed(()=>mocaSummary(props.modelValue))
function set<K extends keyof FinalAssessmentExtra>(key:K,value:FinalAssessmentExtra[K]){if(!props.readonly)emit('update:modelValue',{...props.modelValue,[key]:value})}
function score(key:string,value:unknown){set('scores',{...props.modelValue.scores,[key]:String(value??'')})}
function array(key:'memoryFirst'|'memorySecond'|'orientation'|'recall',index:number,value:unknown){const values=[...props.modelValue[key]];values[index]=String(value??'');set(key,values)}
function word(index:number,key:'word'|'classification',value:unknown){set('words',props.modelValue.words.map((v,i)=>i===index?{...v,[key]:String(value??'')}:v))}
function na(value:string,on:unknown){set('naReasons',on?[...new Set([...props.modelValue.naReasons,value])]:props.modelValue.naReasons.filter(v=>v!==value))}
const orientationLabels=['日','月','年','星期','地點','地區']
const memoryTrials=['memoryFirst','memorySecond'] as const
const recallPrompts=[['身體的一部分','鼻哥、面孔、手'],['紡織品的一種','牛仔布、棉花、絲絨'],['建築物的一種','教堂、學校、醫院'],['花的一種','玫瑰、雛菊、鬱金香'],['一種顏色','紅色、藍色、綠色']]
const norms=[['65–69','0–3',18,15,13],['65–69','4–6',20,18,14],['65–69','7–9',20,19,13],['65–69','10–12',22,20,20],['65–69','>12',24,23,18],['70–79','0–3',15,14,12],['70–79','4–6',19,16,13],['70–79','7–9',19,17,15],['70–79','10–12',20,18,15],['70–79','>12',21,19,17],['≥80','0–6',13,11,9],['≥80','>6',17,15,15]]
</script>
<template>
 <div class="final-fields mt-6" :class="{'ot-cognitive-fields':formId==='form-23'}">
  <template v-if="formId==='form-21'||formId==='form-22'">
   <section v-if="!pressure" class="final-section"><h5 class="text-h5 mb-4">不適用情況</h5><VCheckbox v-for="reason in ['昏迷狀態 Comatose','不省人事 Stuporous','需要全護理及不能自行活動 Patient dependent in ADL who cannot move without assistance']" :key="reason" :model-value="modelValue.naReasons.includes(reason)" :label="reason" hide-details :readonly="props.readonly" @update:model-value="na(reason,$event)" /></section>
   <section class="final-section"><h5 class="text-h5 mb-4">{{pressure?'The Norton Pressure Sore Risk-assessment Scale':'WANDERING RISK SCALE'}}</h5><div v-for="item in items" :key="item.key" class="my-5"><AppSelect :model-value="modelValue.scores[item.key]||''" :label="item.title" :items="item.options.map(([title,value])=>({title:`${title}（${value} 分）`,value}))" clearable :readonly="props.readonly||risk.na" @update:model-value="score(item.key,$event)" /></div>
    <div aria-live="polite"><h5 class="text-h5">{{risk.na?'不適用':`${risk.complete?'總分':'暫計分數'}：${risk.total}${pressure?' / 20':''}`}}</h5><div v-if="!risk.na" class="text-body-2 mt-2">已填 {{risk.answered}} / {{items.length}} 項 <span v-if="risk.risk">· {{risk.risk}}</span></div></div>
    <template v-if="pressure"><p class="text-body-2 mt-4">原表：20 分為最低風險，5 分為最高風險。</p><p class="text-body-2 mt-2">Greater than 18：Low Risk／低；Between 18 and 14：Medium／中；Between 14 and 10：High／高；Lesser than 10：Very High／非常高。</p><AppSelect :model-value="modelValue.risk" label="患壓瘡風險（人手評定）" :items="['低','中','高','非常高']" :readonly="props.readonly" class="mt-4" @update:model-value="set('risk',$event)" /></template>
    <p v-else class="text-body-2 mt-4">原表：0–8 低遊走風險；9–10 存在遊走風險；11 或以上高遊走風險。中英文版本意思如有出入，以英文版本為準。</p>
   </section><section class="final-section"><AppTextField :model-value="modelValue.assessor" :label="pressure?'Assessor / 評估員（姓名及簽署）':'職業治療師簽署 OT’s Initial（輸入姓名／簡簽）'" :readonly="props.readonly" @update:model-value="set('assessor',$event)" /></section>
  </template>
  <template v-else-if="formId==='form-23'">
   <section class="final-section moca-intro">
    <div><h5 class="text-h5 mb-2">HK-CoCA 5-Min Protocol</h5><p class="text-body-2">Montreal Cognitive Assessment 5-Minute Protocol Hong Kong Version</p></div>
    <AppTextField :model-value="modelValue.educationYears" label="教育年數（供評估人員核對常模）" type="number" min="0" step="1" :readonly="props.readonly" hide-details @update:model-value="set('educationYears',String($event??''))" />
   </section>
   <section class="final-section">
    <h5 class="text-h5 mb-3">1. 記憶</h5><p class="text-body-2 mb-4">讀出詞語再由病者重複，以上步驟做兩次；第二次不計分。</p>
    <div class="table-scroll"><table class="moca-memory-table"><colgroup><col style="width:20%"><col style="width:40%"><col style="width:40%"></colgroup><thead><tr><th scope="col">詞語</th><th scope="col">第一次</th><th scope="col">第二次（不計分）</th></tr></thead><tbody><tr v-for="(text,i) in memoryWords" :key="text"><th scope="row">{{text}}</th><td v-for="key in memoryTrials" :key="key"><AppSelect :model-value="modelValue[key][i]" :items="[{title:'正確',value:'1'},{title:'不正確／未能重複',value:'0'}]" :aria-label="`${text} ${key==='memoryFirst'?'第一次':'第二次'}`" :readonly="props.readonly" hide-details @update:model-value="array(key,i,$event)" /></td></tr></tbody></table></div>
    <p class="moca-score-line">記憶：{{moca.first}} / 5</p>
   </section>
   <section class="final-section">
    <h5 class="text-h5 mb-4">2. 語言流暢度</h5>
    <div class="table-scroll"><table class="moca-fluency-table"><colgroup><col style="width:56px"><col><col style="width:240px"></colgroup><thead><tr><th scope="col">#</th><th scope="col">詞語</th><th scope="col">評估人員分類</th></tr></thead><tbody><tr v-for="(row,i) in modelValue.words" :key="i"><th scope="row">{{i+1}}</th><td><AppTextField :model-value="row.word" :aria-label="`詞語 ${i+1}`" :readonly="props.readonly" hide-details @update:model-value="word(i,'word',$event)" /></td><td><AppSelect :model-value="row.classification" :items="['正確動物','重複詞語','非動物詞語']" :aria-label="`詞語 ${i+1} 分類`" :readonly="props.readonly" hide-details @update:model-value="word(i,'classification',$event)" /></td></tr></tbody></table></div>
    <div class="moca-stats my-4"><div><span>全部詞語</span><strong>{{moca.words}}</strong></div><div><span>重複詞語</span><strong>{{moca.repeat}}</strong></div><div><span>非動物詞語</span><strong>{{moca.nonAnimal}}</strong></div><div><span>總正確答案</span><strong>{{moca.correct}}</strong></div></div>
    <p class="moca-score-line">每個正確動物 0.5 分（最多 9 分）：{{moca.fluency}} / 9</p><VCheckbox :model-value="modelValue.fluencyDone" label="語言流暢度評估已完成，已核對各詞語分類" :readonly="props.readonly" hide-details @update:model-value="set('fluencyDone',!!$event)" />
   </section>
   <section class="final-section">
    <h5 class="text-h5 mb-4">3. 定向</h5><div class="moca-orientation"><AppSelect v-for="(label,i) in orientationLabels" :key="label" :model-value="modelValue.orientation[i]" :items="[{title:'正確（1 分）',value:'1'},{title:'不正確（0 分）',value:'0'}]" :label="label" :readonly="props.readonly" hide-details @update:model-value="array('orientation',i,$event)" /></div><p class="moca-score-line">定向：{{moca.orientation}} / 6</p>
   </section>
   <section class="final-section">
    <h5 class="text-h5 mb-4">4. 延遲記憶</h5><div class="table-scroll"><table class="moca-recall-table"><colgroup><col style="width:80px"><col style="width:240px"><col style="width:160px"><col></colgroup><thead><tr><th scope="col">詞語</th><th scope="col">回憶方式</th><th scope="col">類目提示</th><th scope="col">多項選擇</th></tr></thead><tbody><tr v-for="(word,i) in memoryWords" :key="word"><th scope="row">{{word}}</th><td><AppSelect :model-value="modelValue.recall[i]" :items="['回憶詞語','類目提示','多項選擇','未能回憶']" :aria-label="`${word} 回憶方式`" :readonly="props.readonly" hide-details @update:model-value="array('recall',i,$event)" /></td><td>{{recallPrompts[i][0]}}</td><td>{{recallPrompts[i][1]}}</td></tr></tbody></table></div><p class="moca-score-line">a) 回憶詞語：{{moca.free}} / 5；b) 總回憶：{{moca.totalRecall}} / 5；延遲記憶（a+b）：{{moca.delayed}} / 10</p>
   </section>
   <section class="final-section" aria-live="polite"><h5 class="text-h5 mb-4">{{moca.complete?'總分':'暫計總分'}}：{{moca.total}} / 30</h5><AppSelect :model-value="modelValue.percentile" label="百分比分類（由評估人員核對原表常模）" :items="['>16th','≤16th','≤7th','≤2nd']" :readonly="props.readonly" @update:model-value="set('percentile',$event)" /><details class="mt-5"><summary>Age and education corrected normative data</summary><div class="table-scroll mt-3"><table><thead><tr><th>Age</th><th>Education</th><th>16th</th><th>7th</th><th>2nd</th></tr></thead><tbody><tr v-for="(row,i) in norms" :key="i"><td v-for="(cell,j) in row" :key="j">{{cell}}</td></tr></tbody></table></div><p class="text-body-2 mt-3">Impairment classified when score ≤ age and education corrected percentile cutoff.</p></details><p class="text-caption mt-5">Developed by Wong A and Mok V 2015. Copyrighted by Ziad Nasreddine. 5-Min MoCA Version 20150330.</p></section>
  </template>
 </div>
</template>
<style scoped>
.final-section{padding:20px;margin-block:24px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}.table-scroll{overflow-x:auto}.table-scroll table{border-collapse:collapse;inline-size:100%;min-inline-size:600px}.table-scroll th,.table-scroll td{padding:12px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));text-align:start}.table-scroll td{min-inline-size:160px}.final-fields :deep(.v-label){white-space:normal;opacity:1}
.ot-cognitive-fields .table-scroll{border-radius:6px}
.ot-cognitive-fields .table-scroll table{table-layout:fixed}
.ot-cognitive-fields .table-scroll th,.ot-cognitive-fields .table-scroll td{vertical-align:middle;line-height:1.6;overflow-wrap:anywhere}
.ot-cognitive-fields .table-scroll thead th{background:rgba(var(--v-theme-on-surface),.04);font-size:.8125rem;font-weight:600}
.ot-cognitive-fields .table-scroll tbody th{font-weight:500}
.ot-cognitive-fields .table-scroll td{min-inline-size:0}
.ot-cognitive-fields .table-scroll .moca-recall-table{min-inline-size:760px}
.ot-cognitive-fields .moca-fluency-table th:first-child{text-align:center}
.moca-intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,300px);gap:24px;align-items:center}
.moca-intro > *,.moca-orientation > *{min-inline-size:0}
.ot-cognitive-fields :deep(.app-text-field > .v-label),.ot-cognitive-fields :deep(.app-select > .v-label){display:block;margin-block-end:8px !important;font-weight:500;line-height:1.6 !important}
.moca-orientation{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.moca-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.moca-stats > div{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px;text-align:center}
.moca-stats span{font-size:.8125rem}.moca-stats strong{font-size:1.125rem;font-weight:600}
.moca-score-line{margin-block-start:16px;padding-block:12px;border-block-start:1px solid rgba(var(--v-border-color),var(--v-border-opacity));line-height:1.7}
@media(max-width:767px){.moca-intro{grid-template-columns:minmax(0,1fr);gap:16px}.moca-orientation,.moca-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.ot-cognitive-fields .final-section{padding:14px}}
@media(max-width:480px){.moca-orientation{grid-template-columns:minmax(0,1fr)}}
</style>
