<script setup lang="ts">
import { computed, ref } from 'vue'
import { symptomGroups, functionalGroups, urinaryGroups, bowelGroups } from '@/utils/continence-assessment'
import type { ContinenceAssessment } from '@/utils/continence-assessment'
const props = defineProps<{ modelValue: ContinenceAssessment; readonly?: boolean; assessmentDate: string }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: ContinenceAssessment): void }>()
const data = computed(() => props.modelValue)
const readonly = computed(() => props.readonly ?? false)
const fieldsRoot = ref<HTMLElement | null>(null)
const sections = [
  ['urinary-heading', 'I. 排尿情況'],
  ['results-heading', 'II. 評估結果'], ['urinary-plan-heading', 'III. 排尿照顧計劃'],
  ['bowel-heading', 'IV. 排便情況'], ['bowel-plan-heading', 'V. 排便照顧計劃'], ['followup-heading', '職員及覆評'],
]
function jumpTo(id: string) { fieldsRoot.value?.querySelector(`[id="${id}"]`)?.scrollIntoView({ block: 'start', behavior: 'auto' }) }
function update<K extends keyof ContinenceAssessment>(key: K, value: ContinenceAssessment[K]) { emit('update:modelValue', { ...props.modelValue, [key]: value }) }
function toggle(key: 'symptoms' | 'categories' | 'urinaryPlan' | 'bowelPlan' | 'staffRoles', id: string, value: unknown) {
  const list = props.modelValue[key]
  update(key, value ? [...new Set([...list, id])] : list.filter(item => item !== id))
}
const categories = ['A. 受壓性失禁', 'B. 急切性失禁', 'C. 滿溢性失禁', 'D. 反射性失禁', 'E. 功能性失禁']
</script>

<template>
  <div ref="fieldsRoot" class="continence-fields">
    <nav class="section-shortcuts d-flex flex-wrap gap-2 py-3" aria-label="評估表章節">
      <VBtn v-for="[id,label] in sections" :key="id" type="button" variant="tonal" size="small" @click="jumpTo(id)">{{ label }}</VBtn>
    </nav>
    <section aria-labelledby="urinary-heading" class="assessment-section">
      <h5 id="urinary-heading" class="text-h5 mb-5">I. 排尿情況</h5>
      <VRow>
        <VCol v-for="group in symptomGroups" :key="group.title" cols="12" md="6">
          <div class="assessment-group"><div class="text-subtitle-1 font-weight-medium">{{ group.title }}</div><div class="text-caption mb-3">{{ group.subtitle }}</div>
            <VCheckbox v-for="[id, label] in group.items" :key="id" :model-value="data.symptoms.includes(id)" :label="label" :readonly="readonly" hide-details density="compact" @update:model-value="toggle('symptoms', id, $event)" />
          </div>
        </VCol>
        <VCol cols="12"><div id="functional-heading" class="assessment-group"><div class="text-subtitle-1 font-weight-medium">E. 功能性失禁</div><div class="text-caption mb-3">Functional incontinence</div><VRow>
          <VCol v-for="group in functionalGroups" :key="group.id" cols="12" md="6">
            <VCheckbox :model-value="data.symptoms.includes(group.id)" :label="group.title" :readonly="readonly" class="font-weight-medium" hide-details @update:model-value="toggle('symptoms', group.id, $event)" />
            <div class="ms-6"><VCheckbox v-for="[id, label] in group.items" :key="id" :model-value="data.symptoms.includes(id)" :label="label" :readonly="readonly" hide-details density="compact" @update:model-value="toggle('symptoms', id, $event)" /></div>
          </VCol>
        </VRow><VCheckbox :model-value="data.symptoms.includes('psychological')" label="心理因素影響" :readonly="readonly" hide-details @update:model-value="toggle('symptoms', 'psychological', $event)" /></div></VCol>
      </VRow>
    </section>

    <section class="assessment-section" aria-labelledby="results-heading"><div class="assessment-group"><h5 id="results-heading" class="text-h5 mb-2">II. 評估結果</h5><p class="text-body-2 mb-3">長者尿失禁類別（可選多項）</p><VRow><VCol v-for="category in categories" :key="category" cols="12" sm="6"><VCheckbox :model-value="data.categories.includes(category)" :label="category" :readonly="readonly" hide-details @update:model-value="toggle('categories', category, $event)" /></VCol></VRow></div></section>

    <section class="assessment-section" aria-labelledby="urinary-plan-heading"><h5 id="urinary-plan-heading" class="text-h5 mb-5">III. 排尿照顧計劃</h5><VRow>
      <VCol v-for="group in urinaryGroups" :key="group.id" cols="12" md="6"><div class="assessment-group"><VCheckbox :model-value="data.urinaryPlan.includes(group.id)" :label="group.title" :readonly="readonly" hide-details class="font-weight-medium" @update:model-value="toggle('urinaryPlan', group.id, $event)" /><div class="ms-6"><VCheckbox v-for="[id,label] in group.items" :key="id" :class="['urinal','commode'].includes(id)?'ms-6':''" :model-value="data.urinaryPlan.includes(id)" :label="label" :readonly="readonly" hide-details density="compact" @update:model-value="toggle('urinaryPlan', id, $event)" /></div></div></VCol>
      <VCol cols="12"><VCheckbox :model-value="data.urinaryPlan.includes('other')" label="其他排尿照顧計劃" :readonly="readonly" hide-details @update:model-value="toggle('urinaryPlan','other',$event)" /><AppTextarea v-if="data.urinaryPlan.includes('other')" :model-value="data.urinaryOther" :readonly="readonly" label="請註明" rows="2" class="mt-3" @update:model-value="update('urinaryOther', $event)" /></VCol>
    </VRow></section>

    <section class="assessment-section" aria-labelledby="bowel-heading"><h5 id="bowel-heading" class="text-h5 mb-5">IV. 排便情況</h5><VRow>
      <VCol cols="12" md="6"><AppSelect :model-value="data.stoolShape" :items="['正常','便秘','腹瀉','其他']" label="1. 排便形態" clearable :readonly="readonly" @update:model-value="update('stoolShape', $event || '')" /><AppTextField v-if="data.stoolShape==='其他'" :model-value="data.stoolShapeOther" label="其他排便形態" :readonly="readonly" class="mt-4" @update:model-value="update('stoolShapeOther',$event)" /></VCol>
      <VCol cols="12" md="6">
        <AppSelect :model-value="data.bowelFrequency" :items="[{title:'每天（填寫次數）',value:'daily'},{title:'多於若干天一次（填寫天數）',value:'interval'},'每星期兩至三次','每星期少於一次','每天一次','多於一天一次']" label="2. 排便次數" clearable :readonly="readonly" @update:model-value="update('bowelFrequency',$event || '')" />
        <AppTextField v-if="data.bowelFrequency==='daily' || data.bowelFrequency==='interval'" :model-value="data.bowelFrequencyCount" :label="data.bowelFrequency==='daily'?'每天幾次':'多於幾天一次'" type="number" min="1" step="1" :readonly="readonly" class="mt-4" @update:model-value="update('bowelFrequencyCount',String($event))" />
      </VCol>
      <VCol cols="12" md="6"><AppSelect :model-value="data.laxatives" :items="['沒有','有']" label="3. 使用通便藥物" clearable :readonly="readonly" @update:model-value="update('laxatives',$event || '')" /><AppTextField v-if="data.laxatives==='有'" :model-value="data.laxativeDetails" label="請列出所使用藥物" :readonly="readonly" class="mt-4" @update:model-value="update('laxativeDetails',$event)" /></VCol>
      <VCol cols="12" md="6"><AppSelect :model-value="data.bowelIncontinence" :items="['沒有','有']" label="4. 有否大便失禁" clearable :readonly="readonly" @update:model-value="update('bowelIncontinence',$event || '')" /><AppTextField v-if="data.bowelIncontinence==='有'" :model-value="data.bowelIncontinenceDetails" label="請詳述" :readonly="readonly" class="mt-4" @update:model-value="update('bowelIncontinenceDetails',$event)" /></VCol>
    </VRow></section>

    <section class="assessment-section" aria-labelledby="bowel-plan-heading"><h5 id="bowel-plan-heading" class="text-h5 mb-5">V. 排便照顧計劃</h5><VRow>
      <VCol v-for="group in bowelGroups" :key="group.id" cols="12" md="6"><div class="assessment-group"><VCheckbox :model-value="data.bowelPlan.includes(group.id)" :label="group.title" :readonly="readonly" hide-details class="font-weight-medium" @update:model-value="toggle('bowelPlan',group.id,$event)" />
        <div class="ms-6">
          <template v-if="group.id==='bowel-training'"><VCheckbox :model-value="data.bowelPlan.includes('bowel-training-daily')" label="每日訓練" :readonly="readonly" hide-details @update:model-value="toggle('bowelPlan','bowel-training-daily',$event)" /><AppTextField :model-value="data.trainingTimes" label="每日如廁訓練次數" type="number" min="1" step="1" :readonly="readonly" class="my-3" @update:model-value="update('trainingTimes',String($event))" /></template>
          <VCheckbox v-for="[id,label] in group.items" :key="id" :model-value="data.bowelPlan.includes(id)" :label="label" :readonly="readonly" hide-details density="compact" @update:model-value="toggle('bowelPlan',id,$event)" /><AppTextField v-if="group.id==='bowel-training' && data.bowelPlan.includes('bowel-training-other')" :model-value="data.bowelOther" label="其他如廁訓練" :readonly="readonly" class="mt-3" @update:model-value="update('bowelOther',$event)" /></div>
      </div></VCol>
    </VRow></section>

    <section class="assessment-section" aria-labelledby="followup-heading"><h5 id="followup-heading" class="text-h5 mb-4">負責職員及覆評</h5><div class="text-body-1 mb-2">負責執行照顧計劃職員（可選多項）</div><div class="d-flex flex-wrap gap-x-6"><VCheckbox v-for="r in ['護士／保健員','護理員','物理治療師','其他']" :key="r" :model-value="data.staffRoles.includes(r)" :label="r" :readonly="readonly" hide-details @update:model-value="toggle('staffRoles',r,$event)" /></div><AppTextField v-if="data.staffRoles.includes('其他')" :model-value="data.staffRoleOther" label="其他負責職員" :readonly="readonly" class="mt-4" @update:model-value="update('staffRoleOther',$event)" /><VRow class="mt-3"><VCol cols="12" md="6"><AppTextField :model-value="data.signedName" label="職員簽署及姓名（輸入姓名）" :readonly="readonly" @update:model-value="update('signedName',$event)" /></VCol><VCol cols="12" md="6"><AppTextField :model-value="data.nextAssessment" type="date" label="下次評估日期" :min="assessmentDate" :readonly="readonly" @update:model-value="update('nextAssessment',$event)" /></VCol></VRow></section>
  </div>
</template>

<style scoped>
.assessment-section { padding-block:24px; border-block-start:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); }
.section-shortcuts { position:sticky; inset-block-start:0; z-index:2; background:rgb(var(--v-theme-surface)); }
.continence-fields [id] { scroll-margin-block-start:112px; }
.assessment-group { padding:16px; block-size:100%; border:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); border-radius:6px; }
.continence-fields :deep(.v-label) { white-space:normal; opacity:1; line-height:1.6; }
.continence-fields :deep(.v-selection-control) { align-items:flex-start; padding-block:3px; }
.continence-fields :deep(.v-selection-control__input) { align-self:flex-start; }
</style>
