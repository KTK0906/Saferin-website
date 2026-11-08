<script setup lang="ts">
import {residentFileGroups} from '@/utils/resident-forms'
import type {ResidentExtra,RelativeRow} from '@/utils/resident-forms'
const props=defineProps<{modelValue:ResidentExtra;formId:string;readonly?:boolean}>()
const emit=defineEmits<{(e:'update:modelValue',value:ResidentExtra):void}>()
function presence(value:string){if(!props.readonly)emit('update:modelValue',{...props.modelValue,relativesPresence:value})}
function add(){if(!props.readonly)emit('update:modelValue',{...props.modelValue,relatives:[...props.modelValue.relatives,{id:crypto.randomUUID(),name:'',gender:'',age:'',relationship:'',address:'',phone:''}]})}
function edit(id:string,key:keyof Omit<RelativeRow,'id'>,value:string){if(!props.readonly)emit('update:modelValue',{...props.modelValue,relatives:props.modelValue.relatives.map(r=>r.id===id?{...r,[key]:value}:r)})}
function remove(id:string){if(!props.readonly)emit('update:modelValue',{...props.modelValue,relatives:props.modelValue.relatives.filter(r=>r.id!==id)})}
function file(id:string,value:unknown){if(!props.readonly)emit('update:modelValue',{...props.modelValue,files:{...props.modelValue.files,[id]:String(value||'')}})}
</script>
<template>
 <div class="resident-extra mt-6">
  <section v-if="formId==='form-14'" class="extra-section resident-profile"><h5 class="text-h5 mb-5">7. 親屬／朋友</h5>
   <div class="relative-toolbar mb-5"><AppSelect :model-value="modelValue.relativesPresence" label="有否親屬／朋友" :items="['有','沒有']" :readonly="props.readonly" hide-details @update:model-value="presence($event)" /><VBtn v-if="!props.readonly&&modelValue.relativesPresence!=='沒有'" type="button" variant="tonal" prepend-icon="tabler-plus" @click="add">新增親友</VBtn></div>
   <p v-if="modelValue.relativesPresence==='沒有'">沒有親屬／朋友。</p>
   <template v-else><p v-if="!modelValue.relatives.length" class="text-center py-5">暫無親友資料</p><div v-for="(r,index) in modelValue.relatives" :key="r.id" class="relative-row"><div class="d-flex align-center justify-space-between mb-4"><span class="text-subtitle-1">親友 {{index+1}}</span><VBtn v-if="!props.readonly" icon="tabler-trash" variant="text" color="error" type="button" size="small" :aria-label="`移除親友 ${index+1}`" @click="remove(r.id)" /></div>
    <div class="relative-fields">
     <AppTextField :model-value="r.name" label="姓名" :readonly="props.readonly" hide-details @update:model-value="edit(r.id,'name',String($event??''))" />
     <AppSelect :model-value="r.gender" label="性別" :items="['男','女','其他','未提供']" :readonly="props.readonly" hide-details @update:model-value="edit(r.id,'gender',String($event??''))" />
     <AppTextField :model-value="r.age" label="年齡" type="number" min="0" step="1" :readonly="props.readonly" hide-details @update:model-value="edit(r.id,'age',String($event??''))" />
     <AppTextField :model-value="r.relationship" label="關係" :readonly="props.readonly" hide-details @update:model-value="edit(r.id,'relationship',String($event??''))" />
     <AppTextField :model-value="r.phone" label="電話" type="tel" :readonly="props.readonly" hide-details class="relative-wide" @update:model-value="edit(r.id,'phone',String($event??''))" />
     <AppTextarea :model-value="r.address" label="地址" rows="2" auto-grow :readonly="props.readonly" hide-details class="relative-wide" @update:model-value="edit(r.id,'address',String($event??''))" />
    </div>
   </div></template>
  </section>
  <template v-else-if="formId==='form-15'">
   <section v-for="(group,groupIndex) in residentFileGroups" :key="group.title" class="extra-section file-section" :aria-labelledby="`resident-files-${groupIndex}-heading`">
    <h5 :id="`resident-files-${groupIndex}-heading`" class="text-h5 mb-5">{{group.title}}</h5>
    <div class="file-scroll" tabindex="0" :aria-label="`${group.title}文件清單`">
     <table :aria-labelledby="`resident-files-${groupIndex}-heading`">
      <colgroup><col class="file-order-col"><col><col class="file-reference-col"><col class="file-status-col"></colgroup>
      <thead><tr><th scope="col" class="file-order">文件次序</th><th scope="col">文件名稱</th><th scope="col" class="file-reference">文件編號</th><th scope="col" class="file-status">是否儲存</th></tr></thead>
      <tbody>
       <tr v-for="[id,name,reference] in group.rows" :key="id">
        <th scope="row" class="file-order">{{id}}</th><td class="file-name">{{name}}</td><td class="file-reference">{{reference||'—'}}</td>
        <td class="file-status"><VRadioGroup :model-value="modelValue.files[id]||''" :aria-label="`${name}：是否儲存`" :name="`resident-file-${id}`" :readonly="props.readonly" inline hide-details class="file-choices" @update:model-value="file(id,$event)"><VRadio v-for="choice in ['是','否','N/A']" :key="choice" :label="choice" :value="choice" density="compact" /></VRadioGroup></td>
       </tr>
      </tbody>
     </table>
    </div>
   </section>
  </template>
 </div>
</template>
<style scoped>
.extra-section{padding:20px;margin-block:24px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}.relative-row{padding:16px;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}.resident-extra :deep(.v-label){white-space:normal;opacity:1}
.file-scroll{overflow-x:auto;border:1px solid rgba(var(--v-border-color),var(--v-border-opacity));border-radius:6px}
.file-scroll table{table-layout:fixed;border-collapse:collapse;inline-size:100%;min-inline-size:760px}
.file-order-col{inline-size:88px}.file-reference-col{inline-size:120px}.file-status-col{inline-size:240px}
.file-scroll th,.file-scroll td{padding:12px;vertical-align:middle;text-align:start;border-block-end:1px solid rgba(var(--v-border-color),var(--v-border-opacity));line-height:1.6}
.file-scroll thead th{block-size:48px;background:rgba(var(--v-theme-on-surface),.04);font-size:.8125rem;font-weight:600}
.file-scroll tbody th{font-weight:500}
.file-scroll tbody tr:last-child > *{border-block-end:0}
.file-scroll .file-order,.file-scroll .file-reference,.file-scroll .file-status{text-align:center}
.file-name,.file-reference{overflow-wrap:anywhere}
.file-reference{font-size:.8125rem}
.file-choices :deep(.v-selection-control-group){display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
/* Vuetify assigns grid-area:control to every radio; reset it for separate columns. */
.file-choices :deep(.v-selection-control){grid-area:auto;min-inline-size:0;justify-content:center;margin-inline:0 !important}
.file-choices :deep(.v-selection-control__wrapper){flex-shrink:0}
.file-choices :deep(.v-label){white-space:nowrap;font-size:.8125rem}
.relative-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:end}
.relative-row + .relative-row{margin-block-start:20px}
.relative-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}
.relative-fields > *{min-inline-size:0}
.relative-wide{grid-column:1 / -1}
.resident-profile :deep(.app-text-field > .v-label),.resident-profile :deep(.app-select > .v-label),.resident-profile :deep(.app-textarea > .v-label){display:block;margin-block-end:8px !important;font-weight:500;line-height:1.6 !important}
@media(max-width:767px){.relative-fields{grid-template-columns:minmax(0,1fr);gap:16px}.resident-profile{padding:14px}.relative-row{padding:14px}}
@media(max-width:480px){.relative-toolbar{grid-template-columns:minmax(0,1fr);gap:16px}.relative-toolbar > .v-btn{justify-self:start}}
@media(max-width:767px){.file-section{padding:14px}}
</style>
