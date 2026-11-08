<script setup lang="ts">
import {computed} from 'vue'
import type {ProfileBundle} from '@/utils/resident-profile-data'
import {residentAge,profilePersonalData} from '@/utils/resident-profile-data'
import RehabAssessmentFields from '@/components/RehabAssessmentFields.vue'
import ResidentExtraFields from '@/components/ResidentExtraFields.vue'
const props=defineProps<{bundle:ProfileBundle;showPersonal?:boolean;historical?:boolean}>()
const personal=computed(()=>profilePersonalData(props.bundle.resident))
const basics=computed(()=>[
 ['Name / 姓名',props.bundle.resident.name],['Sex / 性別',props.bundle.resident.gender],
 ['Date of Birth / 出生日期',props.bundle.resident.birth_date],['Age / 年齡',props.historical?props.bundle.resident.age??residentAge(props.bundle.resident):residentAge(props.bundle.resident)],
 ['HKID / 身份證號碼',props.bundle.resident.hkid],['Marital Status / 婚姻狀況',props.bundle.resident.marital_status],
 ['Resident Number / 院友編號',props.bundle.resident.resident_number],['Admission Date / 入住日期',props.bundle.resident.admission_date],
 ['Zone / 區域',props.bundle.resident.zone],['Room / 房號',props.bundle.resident.room],['Bed / 床號',props.bundle.resident.bed],['Care Level / 照顧級別',props.bundle.resident.care_level],
])
</script>
<template>
 <div class="profile-summary">
  <VCard variant="outlined"><VCardTitle class="pt-5">Resident Information / 院友資料</VCardTitle><VCardText><dl class="profile-summary-grid"><div v-for="([label,value]) in basics" :key="String(label)"><dt>{{label}}</dt><dd>{{value===0?0:value||'Not recorded / 未記錄'}}</dd></div></dl></VCardText></VCard>
  <VCard variant="outlined" class="mt-5"><VCardTitle class="pt-5">Medical Information / 健康資料</VCardTitle><VCardText><dl class="profile-summary-grid"><div><dt>Conditions / 病歷</dt><dd>{{bundle.medical.conditions?.join('、')||'Not recorded / 未記錄'}}</dd></div><div><dt>Allergies / 過敏</dt><dd>{{bundle.medical.allergies?.join('、')||'Not recorded / 未記錄'}}</dd></div><div class="full-width"><dt>Medications / 藥物</dt><dd>{{bundle.medical.medications||'Not recorded / 未記錄'}}</dd></div></dl></VCardText></VCard>
  <VCard variant="outlined" class="mt-5"><VCardTitle class="pt-5">Emergency Contacts / 緊急聯絡人</VCardTitle><VCardText><dl class="profile-summary-grid">
   <div v-for="(label,key) in {primary:'Primary / 主要聯絡人',secondary:'Secondary / 次要聯絡人'}" :key="key"><dt>{{label}}</dt><dd>{{bundle.contacts[`${key}_contact`]||'Not recorded / 未記錄'}}</dd><dd v-if="bundle.contacts[`${key}_relationship`]">{{bundle.contacts[`${key}_relationship`]}}</dd><dd v-if="bundle.contacts[`${key}_phone`]">{{bundle.contacts[`${key}_phone`]}}</dd></div>
   <div class="full-width"><dt>Doctor Contact / 醫生聯絡資料</dt><dd>{{bundle.contacts.doctor_contact||'Not recorded / 未記錄'}}</dd></div>
  </dl></VCardText></VCard>
  <VExpansionPanels v-if="showPersonal" class="mt-5"><VExpansionPanel title="Personal Background & Relatives / 個人背景及親友"><VExpansionPanelText>
   <RehabAssessmentFields :model-value="personal.rehab" form-id="form-14" readonly :hidden-sections="['personal']" />
   <ResidentExtraFields :model-value="personal.residentExtra" form-id="form-14" readonly />
  </VExpansionPanelText></VExpansionPanel></VExpansionPanels>
 </div>
</template>
<style scoped>
.profile-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:0}.profile-summary-grid>div{min-inline-size:0;overflow-wrap:anywhere}.profile-summary-grid dt{font-size:.8125rem;opacity:.75;margin-block-end:5px}.profile-summary-grid dd{margin:0;white-space:pre-wrap}.full-width{grid-column:1/-1}@media(max-width:599px){.profile-summary-grid{grid-template-columns:1fr}}
</style>
