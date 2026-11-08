<script setup lang="ts">
import {computed,onUnmounted,ref,watch} from 'vue'
import {useWindowSize} from '@vueuse/core'
import {useAbility} from '@casl/vue'
import {loadResidentProfile,saveResidentProfile} from '@/utils/resident-profile-service'
import {localDate,residentAge,personalDetails,profilePersonalData} from '@/utils/resident-profile-data'
import type {ProfileBundle} from '@/utils/resident-profile-data'
import {validateResidentData} from '@/utils/resident-forms'
import RehabAssessmentFields from '@/components/RehabAssessmentFields.vue'
import ResidentExtraFields from '@/components/ResidentExtraFields.vue'

const props=defineProps<{modelValue:boolean;elderly?:{id:string}|null}>()
const emit=defineEmits<{'update:modelValue':[value:boolean];saved:[profile:ProfileBundle]}>()
const ability=useAbility()
const allowed=(action:string)=>ability.can(action,'elderly_list')&&ability.rules.some(r=>!r.inverted&&((r.subject==='all'&&r.action==='manage')||(r.subject==='elderly_list'&&r.action===action)))
const canWrite=computed(()=>allowed('read')&&allowed('manage'))
const isEdit=computed(()=>!!props.elderly?.id)
const {width}=useWindowSize()
const saving=ref(false),loading=ref(false),ready=ref(false),errorMessage=ref('')
const panels=ref(['basic','admission'])
function empty():ProfileBundle{return{resident:{id:'',name:'',age:null,gender:'',birth_date:'',admission_date:'',room:'',zone:'',bed:'',resident_number:'',hkid:'',marital_status:'',care_level:'Normal',personal_details:{}},contacts:{},medical:{conditions:[],allergies:[],medications:''}}}
const bundle=ref<ProfileBundle>(empty())
const personal=ref(profilePersonalData(bundle.value.resident))
const age=computed(()=>residentAge(bundle.value.resident))
let generation=0,disposed=false
onUnmounted(()=>{disposed=true;generation++})
watch(()=>[props.modelValue,props.elderly?.id] as const,async([open])=>{
 const current=++generation
 if(!open)return
 ready.value=false;loading.value=true;errorMessage.value='';panels.value=['basic','admission'];bundle.value=empty()
 try{
  if(props.elderly?.id)bundle.value=await loadResidentProfile(props.elderly.id)
  if(disposed||current!==generation)return
  personal.value=profilePersonalData(bundle.value.resident);ready.value=true
 }catch(error:any){if(current===generation)errorMessage.value=error.message||'Unable to load resident profile.'}
 finally{if(current===generation)loading.value=false}
},{immediate:true})
function close(){if(!saving.value)emit('update:modelValue',false)}
async function save(){
 if(saving.value||!ready.value)return
 errorMessage.value=''
 try{
  if(!canWrite.value)throw Error('You do not have permission to edit resident profiles.')
  const resident=bundle.value.resident
  if(!resident.name.trim()||!resident.zone?.trim()||!resident.bed?.trim())throw Error('Please enter name, zone and bed number.')
  if(resident.birth_date&&resident.birth_date>localDate())throw Error('Date of birth cannot be in the future.')
  if(resident.birth_date&&resident.admission_date&&resident.admission_date<resident.birth_date)throw Error('Admission date cannot be before date of birth.')
  const currentAge=age.value
  if(currentAge!==null&&(!Number.isInteger(currentAge)||currentAge<0||currentAge>130))throw Error('Age must be between 0 and 130.')
  const validation=validateResidentData(personal.value.rehab,personal.value.residentExtra,'form-14',false,localDate())
  if(validation)throw Error(validation)
  resident.age=currentAge
  resident.personal_details={...resident.personal_details,...personalDetails(personal.value.rehab,personal.value.residentExtra)}
  saving.value=true
  const result=await saveResidentProfile(bundle.value,!isEdit.value)
  if(disposed)return
  emit('saved',result);emit('update:modelValue',false)
 }catch(error:any){errorMessage.value=error.message||'Unable to save resident profile.'}
 finally{saving.value=false}
}
</script>

<template>
 <Teleport to="body">
 <VNavigationDrawer v-if="modelValue" :model-value="modelValue" temporary location="end" :width="Math.min(width,680)" :style="{zIndex:2600}" class="resident-profile-editor" @update:model-value="value=>{if(!value)close()}">
  <template #prepend><AppDrawerHeaderSection :title="isEdit?'Edit Resident Profile / 修改院友資料':'Add New Elderly / 新增長者'" @cancel="close" /><VDivider /></template>
  <VProgressLinear v-if="loading" indeterminate color="primary" />
  <VCardText>
   <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{errorMessage}}</VAlert>
   <p class="text-body-2 mb-5">院友資料儲存後會在 Profile 共用，建立新表格時自動帶入。其他資料可稍後補充。</p>
   <VForm v-if="ready" id="resident-profile-editor-form" @submit.prevent="save">
    <fieldset :disabled="saving||!canWrite" class="resident-editor-fields">
    <VExpansionPanels v-model="panels" multiple variant="accordion">
     <VExpansionPanel value="basic" title="Basic Information / 基本資料"><VExpansionPanelText><VRow>
      <VCol cols="12"><AppTextField v-model="bundle.resident.name" label="Name / 姓名 *" /></VCol>
      <VCol cols="12" sm="6"><AppSelect v-model="bundle.resident.gender" :items="['男','女','其他','未提供']" label="Sex / 性別" clearable /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.birth_date" type="date" :max="localDate()" label="Date of Birth / 出生日期" /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-if="bundle.resident.birth_date" :model-value="age" label="Age / 年齡" readonly hint="Calculated from date of birth" persistent-hint /><AppTextField v-else v-model.number="bundle.resident.age" type="number" min="0" max="130" label="Age / 年齡（出生日期未知時）" /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.hkid" label="HKID / 身份證號碼" /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.marital_status" label="Marital Status / 婚姻狀況" /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.resident_number" label="Resident Number / 院友編號" /></VCol>
     </VRow></VExpansionPanelText></VExpansionPanel>
     <VExpansionPanel value="admission" title="Admission / 入住資料"><VExpansionPanelText><VRow>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.admission_date" type="date" label="Admission Date / 入住日期" /></VCol>
      <VCol cols="12" sm="6"><AppSelect v-model="bundle.resident.care_level" :items="['Normal','Disabled','Mental Issue','Emergency']" label="Care Level / 照顧級別" /></VCol>
      <VCol cols="12" sm="6"><AppCombobox v-model="bundle.resident.zone" :items="['A','B','C','D']" label="Zone / 區域 *" /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.room" label="Room / 房號" /></VCol>
      <VCol cols="12" sm="6"><AppTextField v-model="bundle.resident.bed" label="Bed Number / 床號 *" /></VCol>
     </VRow></VExpansionPanelText></VExpansionPanel>
     <VExpansionPanel value="contacts" title="Contacts / 聯絡資料"><VExpansionPanelText>
      <template v-for="(label,key) in {primary:'Primary Contact / 主要聯絡人',secondary:'Secondary Contact / 次要聯絡人'}" :key="key">
       <h6 class="text-subtitle-1 mb-3">{{label}}</h6><VRow class="mb-5">
        <VCol cols="12"><AppTextField v-model="bundle.contacts[`${key}_contact`]" label="Name / Contact / 姓名或聯絡資料" /></VCol>
        <VCol cols="12" sm="6"><AppTextField v-model="bundle.contacts[`${key}_relationship`]" label="Relationship / 關係" /></VCol>
        <VCol cols="12" sm="6"><AppTextField v-model="bundle.contacts[`${key}_phone`]" type="tel" label="Phone / 電話" /></VCol>
       </VRow>
      </template>
      <AppTextField v-model="bundle.contacts.doctor_contact" label="Doctor Contact / 醫生聯絡資料" />
     </VExpansionPanelText></VExpansionPanel>
     <VExpansionPanel value="medical" title="Medical Information / 健康資料"><VExpansionPanelText><VRow>
      <VCol cols="12"><AppCombobox v-model="bundle.medical.conditions" :items="[]" multiple chips closable-chips label="Conditions / 病歷" hint="Type an item and press Enter / 輸入後按 Enter" persistent-hint /></VCol>
      <VCol cols="12"><AppCombobox v-model="bundle.medical.allergies" :items="[]" multiple chips closable-chips label="Allergies / 過敏" hint="Type an item and press Enter / 輸入後按 Enter" persistent-hint /></VCol>
      <VCol cols="12"><AppTextarea v-model="bundle.medical.medications" label="Medications / 藥物" rows="3" /></VCol>
     </VRow></VExpansionPanelText></VExpansionPanel>
     <VExpansionPanel value="personal" title="Personal Background & Relatives / 個人背景及親友"><VExpansionPanelText>
      <RehabAssessmentFields v-model="personal.rehab" form-id="form-14" :hidden-sections="['personal']" />
      <ResidentExtraFields v-model="personal.residentExtra" form-id="form-14" />
     </VExpansionPanelText></VExpansionPanel>
    </VExpansionPanels>
    </fieldset>
   </VForm>
  </VCardText>
  <template #append><VDivider /><div class="d-flex justify-end gap-3 pa-4"><VBtn variant="text" :disabled="saving" @click="close">Cancel</VBtn><VBtn v-if="canWrite" type="submit" form="resident-profile-editor-form" :loading="saving" :disabled="!ready||loading">{{isEdit?'Save Changes':'Add Elderly'}}</VBtn></div></template>
 </VNavigationDrawer>
 </Teleport>
</template>

<style scoped>
.resident-profile-editor{block-size:100dvh!important;max-block-size:100dvh;overflow:hidden}
.resident-profile-editor :deep(.v-navigation-drawer__content){flex:1 1 0;min-block-size:0;block-size:auto;overflow-y:auto;overscroll-behavior:contain}
.resident-profile-editor :deep(.v-navigation-drawer__prepend),.resident-profile-editor :deep(.v-navigation-drawer__append){flex:0 0 auto;background:rgb(var(--v-theme-surface))}
.resident-editor-fields{border:0;padding:0;min-inline-size:0}
</style>
