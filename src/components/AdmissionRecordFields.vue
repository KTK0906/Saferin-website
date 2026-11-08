<script setup lang="ts">
import type { AdmissionRecord, EmergencyVisit, HospitalAdmission } from '@/utils/report-admission-forms'
const props=defineProps<{modelValue:AdmissionRecord;readonly?:boolean}>()
const emit=defineEmits<{(e:'update:modelValue',value:AdmissionRecord):void}>()
function set<K extends keyof AdmissionRecord>(key:K,value:AdmissionRecord[K]){if(!props.readonly)emit('update:modelValue',{...props.modelValue,[key]:value})}
function addVisit(){set('emergency',[...props.modelValue.emergency,{id:crypto.randomUUID(),date:'',reason:''}])}
function addAdmission(){set('admissions',[...props.modelValue.admissions,{id:crypto.randomUUID(),date:'',period:'',hospital:'',diagnosis:''}])}
function editVisit(id:string,key:keyof Omit<EmergencyVisit,'id'>,value:string){set('emergency',props.modelValue.emergency.map(r=>r.id===id?{...r,[key]:value}:r))}
function editAdmission(id:string,key:keyof Omit<HospitalAdmission,'id'>,value:string){set('admissions',props.modelValue.admissions.map(r=>r.id===id?{...r,[key]:value}:r))}
</script>
<template>
  <div class="admission-fields mt-6">
    <section class="admission-section"><h5 class="text-h5 mb-4">基本資料</h5><VRow><VCol cols="12" md="6"><AppTextField :model-value="modelValue.roomBed" label="房號／床號" :readonly="props.readonly" @update:model-value="set('roomBed',$event)" /></VCol><VCol cols="12" md="6"><AppTextField :model-value="modelValue.period" label="時段" placeholder="例如：2026 年 11 月" :readonly="props.readonly" @update:model-value="set('period',$event)" /></VCol></VRow></section>
    <section class="admission-section"><div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-5"><h5 class="text-h5">使用急症室紀錄</h5><VBtn v-if="!props.readonly" type="button" variant="tonal" prepend-icon="tabler-plus" @click="addVisit">新增急症室紀錄</VBtn></div><p class="text-body-2 mb-4">沒有需要入院留醫</p>
      <div v-if="!modelValue.emergency.length" class="text-center py-6 text-medium-emphasis">暫無急症室紀錄</div>
      <div v-for="(r,index) in modelValue.emergency" :key="r.id" class="admission-row"><div class="d-flex justify-space-between align-center mb-3"><span class="text-subtitle-1">急症室紀錄 {{ index+1 }}</span><VBtn v-if="!props.readonly" icon="tabler-trash" :aria-label="`移除急症室紀錄 ${index+1}`" type="button" size="small" variant="text" color="error" @click="set('emergency',modelValue.emergency.filter(row=>row.id!==r.id))" /></div><VRow><VCol cols="12" md="4"><AppTextField :model-value="r.date" type="date" label="日期" :readonly="props.readonly" @update:model-value="editVisit(r.id,'date',$event)" /></VCol><VCol cols="12" md="8"><AppTextarea :model-value="r.reason" label="使用原因" rows="2" :readonly="props.readonly" @update:model-value="editVisit(r.id,'reason',$event)" /></VCol></VRow></div>
    </section>
    <section class="admission-section"><div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-5"><h5 class="text-h5">經急症室入院紀錄</h5><VBtn v-if="!props.readonly" type="button" variant="tonal" prepend-icon="tabler-plus" @click="addAdmission">新增入院紀錄</VBtn></div>
      <div v-if="!modelValue.admissions.length" class="text-center py-6 text-medium-emphasis">暫無入院紀錄</div>
      <div v-for="(r,index) in modelValue.admissions" :key="r.id" class="admission-row"><div class="d-flex justify-space-between align-center mb-3"><span class="text-subtitle-1">入院紀錄 {{ index+1 }}</span><VBtn v-if="!props.readonly" icon="tabler-trash" :aria-label="`移除入院紀錄 ${index+1}`" type="button" size="small" variant="text" color="error" @click="set('admissions',modelValue.admissions.filter(row=>row.id!==r.id))" /></div><VRow><VCol cols="12" md="6"><AppTextField :model-value="r.date" type="date" label="日期" :readonly="props.readonly" @update:model-value="editAdmission(r.id,'date',$event)" /></VCol><VCol cols="12" md="6"><AppTextField :model-value="r.period" label="時段" :readonly="props.readonly" @update:model-value="editAdmission(r.id,'period',$event)" /></VCol><VCol cols="12"><AppTextField :model-value="r.hospital" label="醫院" :readonly="props.readonly" @update:model-value="editAdmission(r.id,'hospital',$event)" /></VCol><VCol cols="12"><AppTextarea :model-value="r.diagnosis" label="診斷" rows="3" :readonly="props.readonly" @update:model-value="editAdmission(r.id,'diagnosis',$event)" /></VCol></VRow></div>
    </section>
  </div>
</template>
<style scoped>
.admission-section{padding:20px;margin-block:24px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}
.admission-row{padding-block:18px;border-block-start:1px solid rgba(var(--v-border-color),var(--v-border-opacity))}
.admission-fields :deep(.v-label){white-space:normal;opacity:1}
</style>
