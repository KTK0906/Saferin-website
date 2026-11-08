<script setup lang="ts">
import { abilityLabels, abilityLevels, trainingAreas } from '@/utils/report-admission-forms'
import type { SpeechCareReport } from '@/utils/report-admission-forms'
const props=defineProps<{modelValue:SpeechCareReport;readonly?:boolean;assessmentDate:string}>()
const emit=defineEmits<{(e:'update:modelValue',value:SpeechCareReport):void}>()
const trainingKinds = ['individualAreas','groupAreas'] as const
function set<K extends keyof SpeechCareReport>(key:K,value:SpeechCareReport[K]){if(!props.readonly)emit('update:modelValue',{...props.modelValue,[key]:value})}
function ability(index:number,value:unknown){const values=[...props.modelValue.abilities];values[index]=String(value||'');set('abilities',values)}
function toggle(key:'plans'|'individualAreas'|'groupAreas',value:string,checked:unknown){const values=props.modelValue[key];set(key,checked?[...new Set([...values,value])]:values.filter(v=>v!==value))}
</script>
<template>
  <div class="care-report mt-6">
    <section class="care-section"><h5 class="text-h5 mb-4">基本資料及病症</h5><VRow>
      <VCol cols="12" sm="4"><AppTextField :model-value="modelValue.age" type="number" min="0" step="1" label="年齡" :readonly="props.readonly" @update:model-value="set('age',String($event))" /></VCol>
      <VCol cols="12" sm="4"><AppSelect :model-value="modelValue.gender" :items="['男','女','其他','未提供']" label="性別" :readonly="props.readonly" @update:model-value="set('gender',$event)" /></VCol>
      <VCol cols="12" sm="4"><AppTextField :model-value="modelValue.room" label="房號／床號" :readonly="props.readonly" @update:model-value="set('room',$event)" /></VCol>
      <VCol cols="12"><AppTextarea :model-value="modelValue.conditions" label="病症" rows="3" :readonly="props.readonly" @update:model-value="set('conditions',$event)" /></VCol>
    </VRow></section>
    <section class="care-section"><h5 class="text-h5 mb-4">1–6. 能力評估</h5><div v-for="(label,index) in abilityLabels" :key="label" class="ability-row"><div :id="`care-ability-${index}`" class="text-subtitle-1">{{ index+1 }}. {{ label }}</div><VRadioGroup :model-value="modelValue.abilities[index]" :aria-labelledby="`care-ability-${index}`" :name="`care-ability-${index}`" inline hide-details :readonly="props.readonly" @update:model-value="ability(index,$event)"><VRadio v-for="level in abilityLevels" :key="level" :label="level" :value="level" /></VRadioGroup></div></section>
    <section class="care-section"><h5 class="text-h5 mb-4">7–9. 進食及流質建議</h5><VRow>
      <VCol cols="12"><AppSelect :model-value="modelValue.feeding" label="7. 進食方式" :items="['口部進食','非口部進食 及 部分口部進食','非口部進食']" :readonly="props.readonly" @update:model-value="set('feeding',$event)" /></VCol>
      <VCol cols="12" md="6"><AppSelect :model-value="modelValue.meal" label="8. 餐類" :items="['正餐','剪碎餐','免治餐','軟滑餐','糊餐']" :readonly="props.readonly" @update:model-value="set('meal',$event)" /></VCol>
      <VCol cols="12" md="6"><AppSelect :model-value="modelValue.liquid" label="9. 流質稠度" :items="['稀薄流質','IDDSI 稠度 1 (極微杰流質)','IDDSI 稠度 2 (低度杰流質)','IDDSI 稠度 3 (中度杰流質)','IDDSI 稠度 4 (高度杰流質)']" :readonly="props.readonly" @update:model-value="set('liquid',$event)" /></VCol>
    </VRow></section>
    <section class="care-section"><h5 class="text-h5 mb-2">10. MASA</h5><p class="text-body-2 mb-4">Mann Assessment of Swallowing Ability</p><VRow>
      <VCol cols="12" md="6"><AppTextField :model-value="modelValue.previousDate" label="上次評估日期" type="date" :max="assessmentDate" :readonly="props.readonly" @update:model-value="set('previousDate',$event)" /></VCol><VCol cols="12" md="6"><AppTextField :model-value="modelValue.previousMasa" label="上次評估分數" type="number" min="0" max="200" step="1" suffix="/ 200" :readonly="props.readonly" @update:model-value="set('previousMasa',String($event))" /></VCol>
      <VCol cols="12" md="6"><AppTextField :model-value="assessmentDate" label="本次評估日期" type="date" readonly /></VCol><VCol cols="12" md="6"><AppTextField :model-value="modelValue.currentMasa" label="本次評估分數" type="number" min="0" max="200" step="1" suffix="/ 200" :readonly="props.readonly" @update:model-value="set('currentMasa',String($event))" /></VCol>
      <VCol cols="12" md="6"><AppSelect :model-value="modelValue.dysphagia" label="吞嚥障礙（人手評定）" :items="['沒有 178–200','輕度 168–177','中度 139–167','嚴重 < 138']" :readonly="props.readonly" @update:model-value="set('dysphagia',$event)" /></VCol><VCol cols="12" md="6"><AppSelect :model-value="modelValue.aspiration" label="誤吸風險（人手評定）" :items="['較低 170–200','輕度 149–169','中度 < 148','嚴重 < 140']" :readonly="props.readonly" @update:model-value="set('aspiration',$event)" /></VCol>
    </VRow></section>
    <section class="care-section"><h5 class="text-h5 mb-4">11. Royal Brisbane Hospital Outcome Measure for Swallowing</h5><AppTextField :model-value="modelValue.outcomeLevel" label="Level" type="number" min="0" step="1" :readonly="props.readonly" @update:model-value="set('outcomeLevel',String($event))" /></section>
    <section class="care-section"><h5 class="text-h5 mb-4">治療計劃</h5><VRow><VCol cols="12" sm="6" v-for="plan in ['按需要覆檢','定期覆檢','安排個別訓練','安排小組訓練']" :key="plan"><VCheckbox :model-value="modelValue.plans.includes(plan)" :label="plan" hide-details :readonly="props.readonly" @update:model-value="toggle('plans',plan,$event)" /></VCol></VRow>
      <div v-for="kind in trainingKinds" :key="kind" class="mt-4"><div class="text-subtitle-1">{{ kind==='individualAreas'?'個別訓練項目':'小組訓練項目' }}</div><div class="d-flex flex-wrap gap-x-5"><VCheckbox v-for="area in trainingAreas" :key="area" :model-value="modelValue[kind].includes(area)" :label="area" hide-details :readonly="props.readonly" @update:model-value="toggle(kind,area,$event)" /></div></div>
      <AppTextarea :model-value="modelValue.remarks" label="備註" rows="3" class="mt-5" :readonly="props.readonly" @update:model-value="set('remarks',$event)" />
    </section>
    <section class="care-section"><h5 class="text-h5 mb-4">言語治療師確認</h5><VRow><VCol cols="12" md="6"><AppTextField :model-value="modelValue.therapist" label="言語治療師" :readonly="props.readonly" @update:model-value="set('therapist',$event)" /></VCol><VCol cols="12" md="6"><AppTextField :model-value="modelValue.signedDate" label="日期" type="date" :readonly="props.readonly" @update:model-value="set('signedDate',$event)" /></VCol></VRow></section>
  </div>
</template>
<style scoped>
.care-section{padding:20px;margin-block:24px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}
.ability-row{padding-block:14px;border-block-end:1px solid rgba(var(--v-border-color),var(--v-border-opacity))}
.care-report :deep(.v-label){white-space:normal;opacity:1}
</style>
