<script setup lang="ts">
import {computed} from 'vue'
import {cornellGroups,cornellSummary} from '@/utils/intake-referral-forms'
import type {IntakeExtra,AppointmentRow} from '@/utils/intake-referral-forms'
const props=defineProps<{modelValue:IntakeExtra;formId:string;readonly?:boolean}>()
const emit=defineEmits<{(e:'update:modelValue',value:IntakeExtra):void}>()
const summary=computed(()=>cornellSummary(props.modelValue.answers))
const cornellScores=[{value:'0',label:'無'},{value:'1',label:'輕微／間中'},{value:'2',label:'嚴重'},{value:'a',label:'不能評估'}]
function answer(index:number,value:unknown){if(props.readonly||!['0','1','2','a'].includes(String(value)))return;const answers=[...props.modelValue.answers];answers[index]=String(value);emit('update:modelValue',{...props.modelValue,answers})}
function add(){if(!props.readonly)emit('update:modelValue',{...props.modelValue,appointments:[...props.modelValue.appointments,{id:crypto.randomUUID(),place:'',date:'',medications:''}]})}
function edit(id:string,key:keyof Omit<AppointmentRow,'id'>,value:string){if(!props.readonly)emit('update:modelValue',{...props.modelValue,appointments:props.modelValue.appointments.map(r=>r.id===id?{...r,[key]:value}:r)})}
function remove(id:string){if(!props.readonly)emit('update:modelValue',{...props.modelValue,appointments:props.modelValue.appointments.filter(r=>r.id!==id)})}
function floor(value:string){if(!props.readonly)emit('update:modelValue',{...props.modelValue,floor:value})}
</script>
<template>
 <div class="intake-extra mt-6">
  <template v-if="formId==='form-17'">
   <section class="intake-section cornell-intro">
    <div class="cornell-intro-heading"><h5 class="text-h5">Cornell Scale for Depression in Dementia</h5><AppTextField :model-value="modelValue.floor" label="樓層" :readonly="props.readonly" hide-details @update:model-value="floor($event)" /></div>
    <p class="mt-5 mb-2">評估院友於評估日前一星期內之情緒表現。</p><p class="text-body-2">0＝無；1＝輕微／間中；2＝嚴重；a＝不能評估。</p>
   </section>
   <section v-for="(group,groupIndex) in cornellGroups" :key="group.title" class="intake-section cornell-section" :aria-labelledby="`cornell-group-${groupIndex}`">
    <h5 :id="`cornell-group-${groupIndex}`" class="text-h5 mb-4">{{group.title}}</h5>
    <p v-if="group.note" class="text-body-2 mb-4">{{group.note}}</p>
    <div class="cornell-column-headings" aria-hidden="true"><span>評估項目</span><span>評分</span></div>
    <div v-for="(question,index) in group.items" :key="index" class="cornell-question">
     <div :id="`cornell-question-${group.offset+index}`" class="cornell-question-label"><span class="cornell-question-number">{{group.offset+index+1}}.</span><span>{{question}}</span></div>
     <VRadioGroup :model-value="modelValue.answers[group.offset+index]" :aria-labelledby="`cornell-question-${group.offset+index}`" :name="`cornell-answer-${group.offset+index}`" inline hide-details :readonly="props.readonly" class="cornell-scores" @update:model-value="answer(group.offset+index,$event)">
      <VRadio v-for="score in cornellScores" :key="score.value" :label="`${score.value} — ${score.label}`" :value="score.value" density="compact" :class="{'cornell-score-selected':modelValue.answers[group.offset+index]===score.value}">
       <template #label><span class="cornell-score-label"><span class="cornell-score-value">{{score.value}}</span><span>{{score.label}}</span></span></template>
      </VRadio>
     </VRadioGroup>
    </div>
   </section>
   <section class="intake-section" aria-live="polite"><div class="d-flex flex-wrap align-center justify-space-between gap-3"><h5 class="text-h5">{{summary.complete?'總分':'可評估項目暫計'}}：{{summary.total}}</h5><span>已填 {{summary.answered}} / 19；不能評估 {{summary.unassessable}} 項</span></div><p class="mt-4">原表備註：整體分數達 8 分或以上，表示有明顯抑鬱徵狀。</p><p v-if="summary.unassessable" class="text-body-2 mt-3">「a」保留為不能評估，不當作 0 分；此處只合計可評估項目。</p><VAlert v-if="summary.aboveThreshold" type="warning" variant="tonal" class="mt-4">總分 {{summary.total}} 分，達原表 8 分或以上門檻。</VAlert></section>
  </template>
  <section v-else-if="formId==='form-20'" class="intake-section"><div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-5"><h5 class="text-h5">覆診地點／日期及服食藥物</h5><VBtn v-if="!props.readonly" type="button" variant="tonal" prepend-icon="tabler-plus" @click="add">新增覆診／藥物紀錄</VBtn></div><p v-if="!modelValue.appointments.length" class="text-center py-5">暫無紀錄</p><div v-for="(row,index) in modelValue.appointments" :key="row.id" class="appointment-row"><div class="d-flex justify-space-between align-center mb-4"><span>紀錄 {{index+1}}</span><VBtn v-if="!props.readonly" icon="tabler-trash" type="button" variant="text" color="error" size="small" :aria-label="`移除紀錄 ${index+1}`" @click="remove(row.id)" /></div><VRow><VCol cols="12" md="6"><AppTextField :model-value="row.place" label="覆診地點" :readonly="props.readonly" @update:model-value="edit(row.id,'place',$event)" /></VCol><VCol cols="12" md="6"><AppTextField :model-value="row.date" label="覆診日期" type="date" :readonly="props.readonly" @update:model-value="edit(row.id,'date',$event)" /></VCol><VCol cols="12"><AppTextarea :model-value="row.medications" label="服食藥物" rows="3" :readonly="props.readonly" @update:model-value="edit(row.id,'medications',$event)" /></VCol></VRow></div></section>
 </div>
</template>
<style scoped>
.intake-section{padding:20px;margin-block:24px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}.appointment-row{padding-block:16px;border-block-start:1px solid rgba(var(--v-border-color),var(--v-border-opacity))}.intake-extra :deep(.v-label){white-space:normal;opacity:1}
.cornell-intro-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(160px,240px);gap:24px;align-items:center}
.cornell-intro-heading > *{min-inline-size:0}
.cornell-intro :deep(.app-text-field > .v-label){display:block;margin-block-end:8px !important;font-weight:500;line-height:1.6 !important}
.cornell-question,.cornell-column-headings{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,432px);gap:24px;align-items:center}
.cornell-column-headings{padding:10px 0;font-size:.8125rem;font-weight:500}
.cornell-column-headings > :last-child{text-align:center}
.cornell-question{padding-block:16px;border-block-start:1px solid rgba(var(--v-border-color),var(--v-border-opacity))}
.cornell-question-label{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:start;line-height:1.7;overflow-wrap:anywhere}
.cornell-question-number{font-weight:600;color:rgb(var(--v-theme-primary))}
.cornell-scores{min-inline-size:0}
.cornell-scores :deep(.v-selection-control-group){display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.cornell-scores :deep(.v-radio){grid-area:auto;min-inline-size:0;max-inline-size:none;min-block-size:60px;justify-content:center;padding:4px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px;margin-inline:0 !important}
.cornell-scores :deep(.v-selection-control__wrapper){flex-shrink:0}
.cornell-scores :deep(.v-label){font-size:.75rem;line-height:1.5}
.cornell-scores :deep(.cornell-score-selected){border-color:rgb(var(--v-theme-primary));background:rgba(var(--v-theme-primary),.08)}
.cornell-score-label{display:flex;flex-direction:column;gap:2px;white-space:nowrap}
.cornell-score-value{font-size:.8125rem;font-weight:600}
@media(max-width:900px){.cornell-question,.cornell-intro-heading{grid-template-columns:minmax(0,1fr);gap:16px}.cornell-column-headings{display:none}}
@media(max-width:600px){.cornell-section,.cornell-intro{padding:14px}.cornell-scores :deep(.v-selection-control-group){grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cornell-scores :deep(.v-radio){justify-content:flex-start;padding-inline:12px}}
</style>
