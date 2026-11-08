<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch, onMounted, onUnmounted } from 'vue'
import { useAbility } from '@casl/vue'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentSession } from '@/utils/permissions'
import { listResidentForms, getResidentForm, saveResidentForm, deleteResidentForm } from '@/utils/resident-forms-service'
import type { ResidentContext, ResidentFormRow } from '@/utils/resident-forms-service'
import { prefillResidentForm } from '@/utils/resident-form-prefill'
import type { ResidentDemographics } from '@/utils/resident-form-prefill'
import {loadResidentProfile} from '@/utils/resident-profile-service'
import {personalDifferences} from '@/utils/resident-profile-data'
import type {ProfileBundle} from '@/utils/resident-profile-data'
import ElderlyFormDialog from '@/components/ElderlyFormDialog.vue'
import ResidentProfileSummary from '@/components/ResidentProfileSummary.vue'
import { useEventListener, useWindowSize } from '@vueuse/core'
import { createContinenceAssessment } from '@/utils/continence-assessment'
import type { ContinenceAssessment } from '@/utils/continence-assessment'
import { createGdsAssessment, summariseGds } from '@/utils/gds-assessment'
import type { GdsAssessment } from '@/utils/gds-assessment'
import { createSpeechAssessment, validateSpeechAssessment } from '@/utils/speech-assessment'
import type { SpeechAssessment } from '@/utils/speech-assessment'
import { createSpeechCareReport, createAdmissionRecord, validateSpeechCareReport, validateAdmissionRecord } from '@/utils/report-admission-forms'
import type { SpeechCareReport, AdmissionRecord } from '@/utils/report-admission-forms'
import { createRehabData, validateRehab } from '@/utils/rehab-forms'
import type { RehabData } from '@/utils/rehab-forms'
import { createCareReview,validateCareReview } from '@/utils/care-review-forms'
import type { CareReviewData } from '@/utils/care-review-forms'
import { createResidentExtra,validateResidentData } from '@/utils/resident-forms'
import type { ResidentExtra } from '@/utils/resident-forms'
import { createIntakeExtra,cornellSummary } from '@/utils/intake-referral-forms'
import type { IntakeExtra } from '@/utils/intake-referral-forms'
import {createFinalExtra,validateFinalExtra} from '@/utils/final-assessment-forms'
import type {FinalAssessmentExtra} from '@/utils/final-assessment-forms'
const ContinenceAssessmentFields = defineAsyncComponent(() => import('@/components/ContinenceAssessmentFields.vue'))
const GdsAssessmentFields = defineAsyncComponent(() => import('@/components/GdsAssessmentFields.vue'))
const SpeechTherapyAssessmentFields = defineAsyncComponent(() => import('@/components/SpeechTherapyAssessmentFields.vue'))
const SpeechCareReportFields = defineAsyncComponent(() => import('@/components/SpeechCareReportFields.vue'))
const AdmissionRecordFields = defineAsyncComponent(() => import('@/components/AdmissionRecordFields.vue'))
const RehabAssessmentFields = defineAsyncComponent(() => import('@/components/RehabAssessmentFields.vue'))
const CareReviewFields = defineAsyncComponent(() => import('@/components/CareReviewFields.vue'))
const ResidentExtraFields = defineAsyncComponent(() => import('@/components/ResidentExtraFields.vue'))
const IntakeExtraFields = defineAsyncComponent(() => import('@/components/IntakeExtraFields.vue'))
const FinalAssessmentFields = defineAsyncComponent(() => import('@/components/FinalAssessmentFields.vue'))

const props=withDefaults(defineProps<{resident:ResidentContext;showList?:boolean;createOnMount?:boolean}>(),{showList:true,createOnMount:false})
const emit=defineEmits<{(e:'saved',row:ResidentFormRow):void;(e:'close'):void;(e:'profile-updated',profile:ProfileBundle):void}>()
const permissions=useAbility()
// Existing CASL rules use "manage" for write; do not let its wildcard imply delete.
const allowed=(action:string)=>permissions.can(action,'elderly_list')&&permissions.rules.some(rule=>!rule.inverted&&((rule.subject==='all'&&rule.action==='manage')||(rule.subject==='elderly_list'&&rule.action===action)))
const canRead=()=>allowed('read')
const canWrite=()=>canRead()&&allowed('manage')
const canDelete=()=>canRead()&&allowed('delete')
const catalog = [
  '失禁評估及照顧計劃表', '老年人精神抑鬱量度表', '言語治療評估表', '言語治療評估報告及照顧計劃表',
  '使用急症室／入院紀錄表', '治療個人照顧計劃評估報告', '物理治療評估表', '物理治療評估報告及照顧計劃表',
  '社福評估及計劃表', '長者跌倒風險評估及防跌措施', '活動能力平衡評估表', '院友周年個案評估及照顧計劃傳閱表格',
  '院友個人照顧計劃', '院友個人資料表', '院友個人檔案文件列表清單', '院友健康狀況評估表',
  '康乃爾失智症抑鬱量表', '接案撮要', '復康治療部轉介表格', '新入住院友面見',
  '遊走風險評估', '壓瘡風險評估表', '職業治療初步評估表', 'ICP 會議個案摘要',
].map((name, index) => ({ id: `form-${index + 1}`, name, icon: 'tabler-clipboard-list' }))
interface FormRecord { id: string; formId: string; resident: string; date: string; author: string; status: string; notes: string; updatedAt:string; continence?: ContinenceAssessment; gds?: GdsAssessment; speech?: SpeechAssessment; speechCare?: SpeechCareReport; admission?: AdmissionRecord; rehab?: RehabData; careReview?:CareReviewData; residentExtra?:ResidentExtra; intakeExtra?:IntakeExtra;finalExtra?:FinalAssessmentExtra }
interface FormRecord {residentSnapshot?:ResidentDemographics|null}
interface FormRecord {profileSnapshot?:ProfileBundle|null}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const records = ref<FormRecord[]>([])
const selectedType=ref('')
const selected = computed(() => catalog.find(f => f.id === selectedType.value))
const choosing=ref(false)
const loading=ref(false)
const opening=ref(false)
const saving=ref(false)
const deleting=ref(false)
const actorName=ref('')
const editingVersion=ref('')
const profileEditor=ref(false)
const currentProfile=ref<ProfileBundle|null>(null)
const refreshConfirmation=ref(false)
const profileDifferences=computed(()=>selected.value?.id==='form-14'&&mode.value!=='create'&&currentProfile.value?personalDifferences(form.value,currentProfile.value.resident,currentProfile.value):[])
const filterType=ref<string|null>(null)
let loadGeneration=0
let disposed=false
const titleFor=(id:string)=>catalog.find(item=>item.id===id)?.name||id
const mapRow=(row:ResidentFormRow):FormRecord=>({...row.payload,id:row.id,formId:row.form_type,resident:(row.payload?.residentSnapshot as ResidentDemographics|undefined)?.name||props.resident.name,date:row.assessment_date,author:row.completed_by,status:row.status,notes:row.notes,updatedAt:row.updated_at})
function message(error:unknown){return error instanceof Error?error.message:(error as {message?:string})?.message||'Unable to save or load this form. Please try again.'}
async function loadRecords(){
 const generation=++loadGeneration
 errors.value=''
 loading.value=true
 try{if(!canRead())throw new Error('You do not have permission to view forms.');const rows=await listResidentForms(props.resident.id);if(!disposed&&generation===loadGeneration)records.value=rows.map(mapRow)}
 catch(error){if(!disposed&&generation===loadGeneration)errors.value=message(error)}
 finally{if(generation===loadGeneration)loading.value=false}
}
function finish(){if(!props.showList)emit('close')}
function openSelector(){if(!canWrite()||saving.value||opening.value)return;errors.value='';search.value='';choosing.value=true}
function cancelSelector(){choosing.value=false;finish()}
onMounted(()=>{
 if(props.showList)void loadRecords()
 if(props.createOnMount)openSelector()
 void (async()=>{try{const session=await getCurrentSession();if(!session)return;const {data}=await supabase.from('app_users').select('username').eq('id',session.user.id).abortSignal(AbortSignal.timeout(15000)).maybeSingle();actorName.value=data?.username||'';if(drawer.value&&mode.value==='create'&&!form.value.author)form.value.author=actorName.value}catch{/* The author field remains available when profile lookup fails. */}})()
})
onUnmounted(()=>{disposed=true;loadGeneration++})
const search = ref('')
const recordSearch = ref('')
const status = ref<string | null>(null)
const page = ref(1)
const perPage = ref(5)
const drawer = ref(false)
const { width: windowWidth } = useWindowSize()
// Vuetify converts the width prop with Number(); CSS min()/calc() produces NaN.
const wideForm = computed(() => Array.from({length:24},(_,i)=>`form-${i+1}`).includes(selected.value?.id || ''))
const dateLabel=computed(()=>({'form-5':'Record Date / 紀錄日期 *','form-18':'接見日期 *','form-19':'轉介日期 *','form-20':'面見日期 *','form-24':'會議日期 *'}[selected.value?.id||'']||'Assessment Date / 評估日期 *'))
const drawerWidth = computed(() => Math.min(windowWidth.value, wideForm.value ? 980 : 480))
function closeDrawer() { if(saving.value)return;drawer.value=false; errors.value='';finish() }
useEventListener('keydown', (event: KeyboardEvent) => { if (event.key === 'Escape' && drawer.value) closeDrawer() })
const mode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref('')
const deleteTarget = ref<FormRecord | null>(null)
const notice = ref('')
const errors = ref('')
const blank = () => ({ resident: props.resident.name, date: today(), author: actorName.value, status: 'Draft', notes: '', continence: createContinenceAssessment(), gds: createGdsAssessment(), speech: createSpeechAssessment(), speechCare: createSpeechCareReport(), admission: createAdmissionRecord(), rehab: createRehabData(selected.value?.id||''), careReview:createCareReview(selected.value?.id||''), residentExtra:createResidentExtra(), intakeExtra:createIntakeExtra(),finalExtra:createFinalExtra() })
const form = ref<ReturnType<typeof blank> & {residentSnapshot?:ResidentDemographics|null;profileSnapshot?:ProfileBundle|null}>(blank())
const filteredCatalog = computed(() => catalog.filter(f => f.name.toLowerCase().includes(search.value.trim().toLowerCase())))
const filteredRecords = computed(() => records.value.filter(r => (!filterType.value||r.formId===filterType.value) && (!status.value || r.status === status.value) && `${titleFor(r.formId)} ${r.date} ${r.author}`.toLowerCase().includes(recordSearch.value.trim().toLowerCase())))
const visibleRecords = computed(() => filteredRecords.value.slice((page.value-1)*perPage.value, page.value*perPage.value))
watch([recordSearch, status, perPage, filterType], () => { page.value=1 })
watch(() => filteredRecords.value.length, length => { page.value=Math.min(page.value, Math.max(1,Math.ceil(length/perPage.value))) })
watch(()=>[canRead(),canWrite()],([read,write])=>{
 if(!read){records.value=[];drawer.value=false;choosing.value=false;profileEditor.value=false;finish()}
 else if(!write&&drawer.value)mode.value='view'
})
function selectForm(id:string) { selectedType.value=id;choosing.value=false;void openRecord() }
async function openRecord(record?: FormRecord, view=false) {
 if(opening.value||saving.value||!canRead()||(!view&&!canWrite()))return
 errors.value='';opening.value=true
 try {
 if(record){record=mapRow(await getResidentForm(props.resident.id,record.id));selectedType.value=record.formId}
 if(disposed||!selected.value)return
 editingVersion.value=record?.updatedAt||''
  mode.value=view?'view':record?'edit':'create'; editingId.value=record?.id || ''; errors.value=''
  form.value=record ? {resident:record.resident,date:record.date,author:record.author,status:record.status,notes:record.notes,continence:JSON.parse(JSON.stringify({...createContinenceAssessment(),...record.continence})),gds:JSON.parse(JSON.stringify({...createGdsAssessment(),...record.gds})),speech:JSON.parse(JSON.stringify({...createSpeechAssessment(),...record.speech})),speechCare:JSON.parse(JSON.stringify({...createSpeechCareReport(),...record.speechCare})),admission:JSON.parse(JSON.stringify({...createAdmissionRecord(),...record.admission})),rehab:JSON.parse(JSON.stringify({...createRehabData(selected.value?.id||''),...record.rehab})),careReview:JSON.parse(JSON.stringify({...createCareReview(selected.value?.id||''),...record.careReview})),residentExtra:JSON.parse(JSON.stringify({...createResidentExtra(),...record.residentExtra})),intakeExtra:JSON.parse(JSON.stringify({...createIntakeExtra(),...record.intakeExtra})),finalExtra:JSON.parse(JSON.stringify({...createFinalExtra(),...record.finalExtra}))} : blank()
  currentProfile.value=null
  if(record){
   form.value.residentSnapshot=record.residentSnapshot?JSON.parse(JSON.stringify(record.residentSnapshot)):null
   form.value.profileSnapshot=record.profileSnapshot?JSON.parse(JSON.stringify(record.profileSnapshot)):null
   drawer.value=true
   if(record.formId==='form-14')try{currentProfile.value=await loadResidentProfile(props.resident.id)}catch{errors.value='Unable to compare current profile. The saved form is still available.'}
  }
  else {
   drawer.value=false
   const bundle=await loadResidentProfile(props.resident.id)
   if(disposed||!canWrite())return
   currentProfile.value=bundle
   form.value=prefillResidentForm(blank(),bundle.resident,bundle,selected.value.id)
   drawer.value=true
  }
 }catch(error){errors.value=message(error)}finally{opening.value=false}
}
function refreshProfileSnapshot(){
 if(!currentProfile.value||!canWrite()||mode.value==='view')return
 form.value=prefillResidentForm(form.value,currentProfile.value.resident,currentProfile.value,selected.value?.id)
 refreshConfirmation.value=false
}
function onProfileSaved(bundle:ProfileBundle){
 currentProfile.value=bundle;emit('profile-updated',bundle)
 if(mode.value==='create')refreshProfileSnapshot()
 else notice.value='Resident profile updated. This historical form remains unchanged.'
}
async function save() {
  if(!selected.value || mode.value==='view'||saving.value)return
  if(!canWrite()){errors.value='You do not have permission to save forms.';return}
  if(!form.value.resident.trim() || !form.value.date || !form.value.author.trim()){errors.value='Please enter resident, assessment date and completed by.';return}
  if(selected.value.id==='form-1') {
    const a=form.value.continence
    if(a.nextAssessment && a.nextAssessment < form.value.date){errors.value='下次評估日期不能早於評估日期。';return}
    if(a.trainingTimes && (!Number.isInteger(Number(a.trainingTimes)) || Number(a.trainingTimes)<1)){errors.value='每日如廁訓練次數必須是大於 0 的整數。';return}
    if(a.bowelFrequencyCount && (!Number.isInteger(Number(a.bowelFrequencyCount)) || Number(a.bowelFrequencyCount)<1)){errors.value='排便次數／天數必須是大於 0 的整數。';return}
  }
  if(selected.value.id==='form-2') {
    const gds=form.value.gds
    if(gds.age && (!Number.isInteger(Number(gds.age)) || Number(gds.age)<0)){errors.value='年齡必須是 0 或以上的整數。';return}
    if(form.value.status==='Completed' && (!summariseGds(gds.answers).complete || !gds.gender || !gds.age.trim())){errors.value='請填寫性別、年齡及全部 15 題，或將狀態設為 Draft 儲存。';return}
  }
  if(selected.value.id==='form-3') {
    const message=validateSpeechAssessment(form.value.speech,form.value.date)
    if(message){errors.value=message;return}
  }
  if(selected.value.id==='form-4') { const message=validateSpeechCareReport(form.value.speechCare,form.value.date);if(message){errors.value=message;return} }
  if(selected.value.id==='form-5') { const message=validateAdmissionRecord(form.value.admission,form.value.status==='Completed');if(message){errors.value=message;return} }
  if(['form-6','form-7','form-8','form-9','form-13','form-14','form-16','form-18','form-19','form-20','form-21','form-23','form-24'].includes(selected.value.id)) {const message=validateRehab(form.value.rehab,selected.value.id);if(message){errors.value=message;return}}
  if(['form-21','form-22','form-23'].includes(selected.value.id)){const message=validateFinalExtra(form.value.finalExtra,selected.value.id,form.value.status==='Completed');if(message){errors.value=message;return}}
  if(selected.value.id==='form-17'&&form.value.status==='Completed'&&cornellSummary(form.value.intakeExtra.answers).answered!==19){errors.value='請為全部 19 題選擇評分（可選 a＝不能評估），或儲存為 Draft。';return}
  if(['form-13','form-14','form-15','form-16'].includes(selected.value.id)){const message=validateResidentData(form.value.rehab,form.value.residentExtra,selected.value.id,form.value.status==='Completed',form.value.date);if(message){errors.value=message;return}}
  if(['form-10','form-11','form-12'].includes(selected.value.id)){const message=validateCareReview(form.value.careReview,selected.value.id,form.value.status==='Completed');if(message){errors.value=message;return}}
  saving.value=true
  try {
   const {resident,date,author,status,notes,...payload}=form.value
   const row=await saveResidentForm({elderly_id:props.resident.id,form_type:selected.value.id,assessment_date:date,completed_by:author.trim(),status,notes,payload},editingId.value?{id:editingId.value,updatedAt:editingVersion.value}:undefined)
   drawer.value=false;page.value=1;notice.value='Form saved.';emit('saved',row)
   if(props.showList)await loadRecords();else finish()
  }catch(error){errors.value=message(error)}finally{saving.value=false}
}
async function remove() {
 if(!deleteTarget.value||deleting.value||!canDelete())return
 deleting.value=true
 try{await deleteResidentForm(props.resident.id,deleteTarget.value.id,deleteTarget.value.updatedAt);deleteTarget.value=null;notice.value='Form deleted.';await loadRecords()}
 catch(error){errors.value=message(error);deleteTarget.value=null}finally{deleting.value=false}
}
</script>

<template>
  <section class="resident-forms">
    <h5 v-if="showList" class="text-h5 mb-5">Forms · {{ resident.name }}</h5>
    <VAlert v-if="notice" type="success" variant="tonal" closable class="mb-6" @click:close="notice=''">{{ notice }}</VAlert>
    <VAlert v-if="errors&&!drawer" type="error" variant="tonal" class="mb-5">{{errors}}<VBtn v-if="showList" variant="text" size="small" @click="loadRecords">Retry</VBtn></VAlert>
    <VProgressLinear v-if="loading||opening" indeterminate color="primary" aria-label="Loading forms" class="mb-4" />

    <VDialog :model-value="choosing" :max-width="1120" aria-labelledby="form-selector-title" @update:model-value="value=>{if(!value)cancelSelector()}">
     <VCard class="form-selector-card">
      <div class="form-selector-header">
       <div class="form-selector-heading"><h5 id="form-selector-title" class="text-h5">Create Form · {{resident.name}}</h5><VBtn icon="tabler-x" variant="text" aria-label="Close form selection" @click="cancelSelector" /></div>
       <AppTextField v-model="search" placeholder="Search forms / 搜尋表格" aria-label="Search form types" prepend-inner-icon="tabler-search" clearable hide-details @click:clear="search=''" />
      </div>
      <div class="form-selector-body" role="region" aria-label="Form types / 表格種類" tabindex="0">
       <div v-if="filteredCatalog.length" class="form-selector-grid">
          <button v-for="item in filteredCatalog" :key="item.id" class="form-tile" type="button" @click="selectForm(item.id)">
            <VAvatar variant="tonal" color="primary" rounded size="42"><VIcon :icon="item.icon" size="25" /></VAvatar>
            <span class="form-tile-name">{{ item.name }}</span>
            <VIcon icon="tabler-chevron-right" size="18" />
          </button>
       </div>
       <div v-else class="text-center py-12" role="status">No forms match your search.</div>
      </div>
      <div class="form-selector-footer"><VBtn variant="text" @click="cancelSelector">Cancel</VBtn></div>
     </VCard>
    </VDialog>

    <VCard v-if="showList">
      <VCardText><div class="text-subtitle-1 font-weight-medium mb-4">Filters</div><VRow><VCol cols="12" md="6"><AppSelect v-model="filterType" :items="catalog" item-title="name" item-value="id" placeholder="All Forms" clearable /></VCol><VCol cols="12" md="6"><AppSelect v-model="status" :items="['Draft','Completed']" placeholder="All Statuses" clearable /></VCol></VRow></VCardText>
      <VDivider />
      <VCardText class="form-record-toolbar">
        <AppSelect v-model="perPage" :items="[5,10,15,20]" aria-label="Records per page" class="record-page-size" />
        <div class="form-record-actions">
          <AppTextField v-model="recordSearch" placeholder="Search" aria-label="Search records" prepend-inner-icon="tabler-search" class="record-search" />
          <VBtn v-if="canWrite()" prepend-icon="tabler-plus" :disabled="saving||opening" @click="openSelector">Create Form</VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VTable class="text-no-wrap"><thead><tr><th>FORM</th><th>ASSESSMENT DATE</th><th>COMPLETED BY</th><th>STATUS</th><th>UPDATED</th><th>ACTIONS</th></tr></thead><tbody>
        <tr v-for="record in visibleRecords" :key="record.id"><td class="record-form-name">{{ titleFor(record.formId) }}</td><td>{{ record.date }}</td><td>{{ record.author }}</td><td><VChip size="small" variant="tonal" :color="record.status==='Completed'?'success':'warning'">{{ record.status }}</VChip></td><td>{{new Date(record.updatedAt).toLocaleString('en-GB',{timeZone:'Asia/Hong_Kong'})}}</td><td><VBtn icon="tabler-eye" aria-label="View record" variant="text" size="small" :disabled="opening" @click="openRecord(record,true)" /><VBtn v-if="canWrite()" icon="tabler-edit" aria-label="Edit record" variant="text" size="small" :disabled="opening" @click="openRecord(record)" /><VBtn v-if="canDelete()" icon="tabler-trash" aria-label="Delete record" variant="text" color="error" size="small" @click="deleteTarget=record" /></td></tr>
        <tr v-if="!visibleRecords.length"><td colspan="6" class="text-center py-12">{{loading?'Loading forms…':'No forms found for this resident.'}}</td></tr>
      </tbody></VTable>
      <VDivider /><TablePagination v-model:page="page" :items-per-page="perPage" :total-items="filteredRecords.length" />
    </VCard>

    <Teleport to="body"><VNavigationDrawer v-if="drawer&&!profileEditor" :model-value="drawer" location="end" temporary :width="drawerWidth" disable-resize-watcher touchless class="forms-record-drawer" :style="{ position: 'fixed', top: '0', height: '100dvh' }" @update:model-value="value=>{if(!value)closeDrawer()}">
      <template #prepend>
        <div class="d-flex align-center justify-space-between gap-3 pa-5">
          <h5 class="text-h5">{{ mode==='view'?'View Record':mode==='edit'?'Edit Record':'Create Record' }}</h5>
          <VBtn icon="tabler-x" aria-label="Close form" title="Close form" variant="text" size="small" @click="closeDrawer" />
        </div><VDivider />
      </template>
      <VDivider /><VCardText><div class="text-subtitle-1 mb-4">{{ selected?.name }}</div><VAlert v-if="errors" type="error" variant="tonal" class="mb-4">{{ errors }}</VAlert>
        <VForm id="forms-record-editor" @submit.prevent="save">
          <VRow>
            <VCol cols="12" :md="wideForm?6:12"><AppTextField :model-value="form.resident" label="Resident / 長者姓名" readonly /></VCol>
            <VCol cols="12" :md="wideForm?6:12"><AppTextField v-model="form.date" type="date" :label="dateLabel" :readonly="mode==='view'" /></VCol>
            <VCol cols="12" :md="wideForm?6:12"><AppTextField v-model="form.author" label="Completed By / 負責職員 *" :readonly="mode==='view'" /></VCol>
            <VCol cols="12" :md="wideForm?6:12"><AppSelect v-model="form.status" :items="['Draft','Completed']" label="Status / 狀態" :readonly="mode==='view'" /></VCol>
          </VRow>
          <div v-if="selected?.id==='form-14'" class="my-5">
           <p class="text-body-2">院友個人資料表由 Profile 共用資料產生。儲存表格會保留當時資料；修改 Profile 不會自動改動過往表格。</p>
           <div v-if="canWrite()&&mode!=='view'" class="d-flex flex-wrap gap-3 mt-3">
            <VBtn type="button" variant="tonal" prepend-icon="tabler-edit" @click="profileEditor=true">修改院友資料</VBtn>
            <VBtn v-if="mode==='edit'&&currentProfile" type="button" variant="text" @click="refreshConfirmation=true">將目前 Profile 資料帶入此表格</VBtn>
           </div>
           <details v-if="profileDifferences.length" class="mt-4"><summary>與目前 Profile 有 {{profileDifferences.length}} 項差異（未自動覆蓋）</summary><div class="profile-differences mt-3"><table><thead><tr><th>欄位</th><th>此表格</th><th>目前 Profile</th></tr></thead><tbody><tr v-for="difference in profileDifferences" :key="difference.field"><th>{{difference.field}}</th><td>{{difference.saved}}</td><td>{{difference.current}}</td></tr></tbody></table></div></details>
          </div>
          <ResidentProfileSummary v-if="selected?.id==='form-14'&&form.profileSnapshot" :bundle="form.profileSnapshot" show-personal historical class="mt-5" />
          <div v-if="form.residentSnapshot&&!(selected?.id==='form-14'&&form.profileSnapshot)" class="resident-demographics mt-5">
           <div><span>Age / 年齡</span><strong>{{form.residentSnapshot.age??'未記錄'}}</strong></div>
           <div><span>Sex / 性別</span><strong>{{form.residentSnapshot.gender||'未記錄'}}</strong></div>
           <div><span>Zone / 區域</span><strong>{{form.residentSnapshot.zone||'未記錄'}}</strong></div>
           <div><span>Bed / 床號</span><strong>{{form.residentSnapshot.bed||'未記錄'}}</strong></div>
          </div>
          <ContinenceAssessmentFields v-if="selected?.id==='form-1'" v-model="form.continence" :readonly="mode==='view'" :assessment-date="form.date" class="mt-6" />
          <GdsAssessmentFields v-if="selected?.id==='form-2'" v-model="form.gds" :readonly="mode==='view'" />
          <SpeechTherapyAssessmentFields v-if="selected?.id==='form-3'" v-model="form.speech" :readonly="mode==='view'" />
          <SpeechCareReportFields v-if="selected?.id==='form-4'" v-model="form.speechCare" :readonly="mode==='view'" :assessment-date="form.date" />
          <AdmissionRecordFields v-if="selected?.id==='form-5'" v-model="form.admission" :readonly="mode==='view'" />
          <RehabAssessmentFields v-if="selected && ['form-6','form-7','form-8','form-9','form-13','form-14','form-16','form-18','form-19','form-20','form-21','form-23','form-24'].includes(selected.id)&&!(selected.id==='form-14'&&form.profileSnapshot)" v-model="form.rehab" :form-id="selected.id" :readonly="mode==='view'" />
          <CareReviewFields v-if="selected && ['form-10','form-11','form-12'].includes(selected.id)" v-model="form.careReview" :form-id="selected.id" :readonly="mode==='view'" />
          <ResidentExtraFields v-if="selected && ['form-14','form-15'].includes(selected.id)&&!(selected.id==='form-14'&&form.profileSnapshot)" v-model="form.residentExtra" :form-id="selected.id" :readonly="mode==='view'" />
          <IntakeExtraFields v-if="selected && ['form-17','form-20'].includes(selected.id)" v-model="form.intakeExtra" :form-id="selected.id" :readonly="mode==='view'" />
          <FinalAssessmentFields v-if="selected && ['form-21','form-22','form-23'].includes(selected.id)" v-model="form.finalExtra" :form-id="selected.id" :readonly="mode==='view'" />
          <p v-if="selected?.id==='form-18'" class="text-body-2 mt-5">原表註：此表格須於申請人入院前填妥。</p>
          <AppTextarea v-model="form.notes" rows="3" label="Notes / 備註" :readonly="mode==='view'" class="my-6" />
        </VForm>
      </VCardText>
      <template #append>
        <VDivider /><div class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="text" :disabled="saving" @click="closeDrawer">{{ mode==='view'?'Close':'Cancel' }}</VBtn>
          <VBtn v-if="mode!=='view'&&canWrite()" type="submit" form="forms-record-editor" :loading="saving">Save Record</VBtn>
        </div>
      </template>
    </VNavigationDrawer></Teleport>
    <ElderlyFormDialog v-model="profileEditor" :elderly="{id:resident.id}" @saved="onProfileSaved" />
    <VDialog v-model="refreshConfirmation" max-width="460"><VCard title="更新這份表格的資料？"><VCardText>這會以目前 Profile 資料取代這份表格的共用資料。按 Save Record 才會儲存此修改；其他歷史表格不受影響。</VCardText><VCardActions><VSpacer /><VBtn @click="refreshConfirmation=false">Cancel</VBtn><VBtn @click="refreshProfileSnapshot">Update This Form</VBtn></VCardActions></VCard></VDialog>
    <VDialog :model-value="!!deleteTarget" :persistent="deleting" max-width="440" @update:model-value="value => { if(!value) deleteTarget=null }"><VCard title="Delete record?"><VCardText>Delete {{ deleteTarget?titleFor(deleteTarget.formId):'' }} for {{resident.name}}?</VCardText><VCardActions><VSpacer /><VBtn :disabled="deleting" @click="deleteTarget=null">Cancel</VBtn><VBtn color="error" variant="flat" :loading="deleting" @click="remove">Delete</VBtn></VCardActions></VCard></VDialog>
  </section>
</template>

<style scoped>
.profile-differences{overflow-x:auto}.profile-differences table{inline-size:100%;border-collapse:collapse}.profile-differences th,.profile-differences td{padding:10px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));text-align:start;min-inline-size:140px;max-inline-size:340px;overflow-wrap:anywhere}
.resident-demographics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;padding:16px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}
.resident-demographics>div{display:flex;flex-direction:column;gap:6px;min-inline-size:0;overflow-wrap:anywhere}.resident-demographics span{font-size:.8125rem}.resident-demographics strong{font-weight:500}
@media(max-width:600px){.resident-demographics{grid-template-columns:repeat(2,minmax(0,1fr))}}
.form-selector-card{
 display:flex;flex-direction:column;flex-wrap:nowrap;flex:0 0 auto !important;
 block-size:min(900px,calc(100dvh - 48px));max-block-size:calc(100dvh - 48px);
 min-block-size:0;overflow:hidden !important;
}
.form-selector-header,.form-selector-footer{flex:0 0 auto;background:rgb(var(--v-theme-surface));}
.form-selector-header{display:flex;flex-direction:column;gap:16px;padding:20px 24px;border-block-end:1px solid rgba(var(--v-border-color),var(--v-border-opacity));}
.form-selector-heading{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;}
.form-selector-heading h5{min-inline-size:0;line-height:1.5;overflow-wrap:anywhere;}
.form-selector-body{flex:1 1 0;min-block-size:0;overflow-y:auto;overflow-x:hidden;padding:24px;overscroll-behavior:contain;scrollbar-gutter:stable;}
.form-selector-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;}
.form-selector-footer{display:flex;justify-content:flex-end;align-items:center;padding:12px 24px;border-block-start:1px solid rgba(var(--v-border-color),var(--v-border-opacity));}
@media(max-width:959px){.form-selector-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:599px){
 .form-selector-header{padding:16px;gap:12px;}.form-selector-body{padding:16px;}.form-selector-footer{padding:12px 16px;}
 .form-selector-grid{grid-template-columns:minmax(0,1fr);gap:16px;}
 .form-selector-card .form-tile{min-block-size:155px;padding:18px;gap:12px;}
}
.forms-record-drawer {
  block-size:100dvh !important;
  max-block-size:100dvh;
  overflow:hidden;
}
.forms-record-drawer :deep(.v-navigation-drawer__content) {
  flex:1 1 0;
  min-block-size:0;
  block-size:auto;
  overflow-y:auto;
  overflow-x:hidden;
  overscroll-behavior-y:contain;
  touch-action:pan-y;
  scrollbar-gutter:stable;
}
.forms-record-drawer :deep(.v-navigation-drawer__prepend),
.forms-record-drawer :deep(.v-navigation-drawer__append) {
  flex:0 0 auto;
  background:rgb(var(--v-theme-surface));
}
.forms-search { flex: 0 1 280px; min-inline-size: 200px; }
.form-record-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.record-page-size { flex:0 0 80px; max-inline-size:80px; }
.form-record-actions { display:grid; grid-template-columns:220px auto; align-items:center; gap:16px; margin-inline-start:auto; max-inline-size:100%; }
.record-search { min-inline-size:0; }
.record-form-name{white-space:normal;min-inline-size:200px;max-inline-size:340px}
@media(max-width:600px){.form-record-actions{inline-size:100%;grid-template-columns:minmax(0,1fr) auto;}}
@media(max-width:380px){.form-record-actions{grid-template-columns:minmax(0,1fr);}.form-record-actions>.v-btn{justify-self:end;}}
.form-tile { display:flex; flex-direction:column; align-items:flex-start; gap:16px; inline-size:100%; min-block-size:195px; block-size:100%; padding:22px; border:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); border-radius:6px; background:rgb(var(--v-theme-surface)); color:rgba(var(--v-theme-on-surface),var(--v-high-emphasis-opacity)); text-align:start; cursor:pointer; transition:border-color .15s; }
.form-tile:hover, .form-tile:focus-visible { border-color:rgb(var(--v-theme-primary)); }
.form-tile-name { flex:1; font-size:16px; font-weight:500; line-height:1.5; }
@media(prefers-reduced-motion:reduce){.form-tile{transition:none}}
</style>
