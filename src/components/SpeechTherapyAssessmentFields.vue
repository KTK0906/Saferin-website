<script setup lang="ts">
import { ref } from 'vue'
import { speechSections, oromotorRows, oromotorColumns, oromotorKey } from '@/utils/speech-assessment'
import type { SpeechAssessment, SpeechField, SpeechValue } from '@/utils/speech-assessment'
const props = defineProps<{modelValue: SpeechAssessment; readonly?: boolean}>()
const emit = defineEmits<{(event:'update:modelValue',value:SpeechAssessment):void}>()
const root = ref<HTMLElement | null>(null)
const shortNames = ['基本資料','現時飲食','認知','溝通','言語聲線','口腔肌能','吞嚥','評估印象','建議','訓練覆評']
// Keep related controls together rather than pairing short inputs with tall checklists.
const sectionGroups: Record<string, string[][]> = {
  'speech-personal': [
    ['gender','age','birthDate'], ['referral','referralOther'], ['medicalHistory'],
  ],
  'speech-cognition': [['orientation'], ['attention','cognitionOther']],
  'speech-communication': [
    ['communicationAssessment','communicationOther'], ['comprehension','expression'],
  ],
  'speech-voice': [
    ['amr'], ['smr'], ['intelligibility','mpt','loudness'], ['voiceQuality','voiceQualityOther'], ['speechOther'],
  ],
  'speech-oromotor': [['dentition'], ['oralHygiene','cough']],
  'speech-swallowing': [
    ['trialLiquid'], ['trialLiquidUtensils'], ['trialSolids','trialSolidsDetails'], ['trialSolidUtensils'], ['oralPhase'], ['pharyngealPhase'],
  ],
  'speech-impression': [['impressionSummary'], ['impression'], ['impressionOther']],
  'speech-followup': [
    ['masa','trainingFrequency','therapist'], ['training'], ['review'], ['reviewDate','reviewDetails'],
  ],
}
const fullWidthFields = new Set(['medicalHistory','speechOther','impressionSummary','impressionOther','safety','recommendationOther'])
function fieldGroups(section: typeof speechSections[number]): SpeechField[][] {
  const groups = sectionGroups[section.id]
  if (!groups) return section.fields.map(f => [f])
  const assigned = new Set(groups.flat())
  return [
    ...groups.map(keys => keys.flatMap(key => section.fields.filter(f => f.key === key))),
    ...section.fields.filter(f => !assigned.has(f.key)).map(f => [f]),
  ]
}
const scalar = (key:string) => typeof props.modelValue[key]==='string' ? props.modelValue[key] as string : ''
const selected = (key:string,value:string) => Array.isArray(props.modelValue[key]) && props.modelValue[key].includes(value)
function update(key:string,value:SpeechValue) { if(!props.readonly)emit('update:modelValue',{...props.modelValue,[key]:value}) }
function toggle(key:string,value:string,checked:unknown) { const values=props.modelValue[key];const list=Array.isArray(values)?values:[];update(key,checked?[...new Set([...list,value])]:list.filter(v=>v!==value)) }
function jump(id:string) { root.value?.querySelector(`[id="${id}"]`)?.scrollIntoView({behavior:'auto',block:'start'}) }
</script>

<template>
  <div ref="root" class="speech-fields mt-6">
    <nav class="speech-nav d-flex flex-wrap gap-2 py-3" aria-label="言語治療評估章節"><VBtn v-for="(section,index) in speechSections" :key="section.id" type="button" size="small" variant="tonal" @click="jump(section.id)">{{ shortNames[index] }}</VBtn></nav>
    <section v-for="section in speechSections" :id="section.id" :key="section.id" class="speech-section my-6" :aria-labelledby="`${section.id}-heading`">
      <h5 :id="`${section.id}-heading`" class="text-h5 mb-5">{{ section.title }}</h5>
      <div v-if="section.oromotor" class="oromotor-scroll mb-6">
        <table class="oromotor-table"><thead><tr><th scope="col">部位</th><th v-for="column in oromotorColumns" :key="column" scope="col">{{ column }}</th></tr></thead><tbody><tr v-for="row in oromotorRows" :key="row"><th scope="row">{{ row }}</th><td v-for="column in oromotorColumns" :key="column"><AppTextField :model-value="scalar(oromotorKey(row,column))" :aria-label="`${row} — ${column}`" :readonly="props.readonly" hide-details @update:model-value="update(oromotorKey(row,column),String($event??''))" /></td></tr></tbody></table>
      </div>
      <div class="speech-grid">
        <div v-for="group in fieldGroups(section)" :key="group[0].key" class="speech-group" :class="{'speech-group-wide': group.length === 1 && fullWidthFields.has(group[0].key)}">
          <div v-for="f in group" :key="f.key" class="speech-control">
            <div v-if="f.type==='multi'" class="speech-options"><div :id="`${f.key}-label`" class="speech-field-label">{{ f.label }}</div><div role="group" :aria-labelledby="`${f.key}-label`"><VCheckbox v-for="option in f.items" :key="option" :model-value="selected(f.key,option)" :label="option" :readonly="props.readonly" hide-details density="compact" @update:model-value="toggle(f.key,option,$event)" /></div></div>
            <AppTextarea v-else-if="f.type==='textarea'" :model-value="scalar(f.key)" :label="f.label" :readonly="props.readonly" rows="3" auto-grow hide-details @update:model-value="update(f.key,String($event??''))" />
            <AppSelect v-else-if="f.type==='select'" :model-value="scalar(f.key)" :items="f.items" :label="f.label" :readonly="props.readonly" clearable hide-details @update:model-value="update(f.key,String($event??''))" />
            <AppTextField v-else :model-value="scalar(f.key)" :label="f.label" :type="f.type" :min="f.min" :max="f.max" :step="f.type==='number'?(f.key==='mpt'?'any':1):undefined" :suffix="f.suffix" :readonly="props.readonly" hide-details @update:model-value="update(f.key,String($event??''))" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.speech-section { padding:20px; border:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); border-radius:6px; scroll-margin-block-start:124px; }
.speech-nav { position:sticky; inset-block-start:0; z-index:2; background:rgb(var(--v-theme-surface)); }
.speech-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; align-items:stretch; }
.speech-group { display:flex; flex-direction:column; gap:20px; min-inline-size:0; padding:16px; border:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); border-radius:6px; }
.speech-group-wide { grid-column:1 / -1; }
.speech-control { min-inline-size:0; }
.speech-field-label { margin-block-end:8px; font-size:0.8125rem; font-weight:500; line-height:1.6; }
.speech-control :deep(.app-text-field > .v-label),.speech-control :deep(.app-select > .v-label),.speech-control :deep(.app-textarea > .v-label) { display:block; margin-block-end:8px !important; font-weight:500; line-height:1.6 !important; }
.speech-options :deep(.v-selection-control) { align-items:flex-start; min-block-size:30px; }
.speech-options :deep(.v-selection-control__wrapper) { flex-shrink:0; }
.speech-fields :deep(.v-label) { white-space:normal; opacity:1; line-height:1.6; }
.oromotor-scroll { overflow-x:auto; }
.oromotor-table { border-collapse:collapse; inline-size:100%; min-inline-size:640px; }
.oromotor-table th,.oromotor-table td { border:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); padding:10px; text-align:start; }
.oromotor-table th { font-weight:500; }
.oromotor-table td { min-inline-size:125px; }
@media(max-width:767px){.speech-grid{grid-template-columns:minmax(0,1fr);gap:16px}.speech-section{padding:14px}.speech-group{padding:14px;gap:16px}}
</style>
