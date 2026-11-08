<script setup lang="ts">
import { computed } from 'vue'
import { gdsQuestions, summariseGds } from '@/utils/gds-assessment'
import type { GdsAnswer, GdsAssessment } from '@/utils/gds-assessment'
const props = defineProps<{ modelValue: GdsAssessment; readonly?: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: GdsAssessment): void }>()
const summary = computed(() => summariseGds(props.modelValue.answers))
function update<K extends keyof GdsAssessment>(key: K, value: GdsAssessment[K]) {
  if (!props.readonly) emit('update:modelValue', { ...props.modelValue, [key]: value })
}
function answer(index: number, value: unknown) {
  if (value !== 'yes' && value !== 'no' && value !== null) return
  const answers: GdsAnswer[] = [...props.modelValue.answers]
  answers[index] = value
  update('answers', answers)
}
</script>

<template>
  <div class="gds-fields mt-6">
    <section class="gds-group mb-6" aria-labelledby="gds-personal-heading">
      <h5 id="gds-personal-heading" class="text-h5 mb-4">個人資料</h5>
      <VRow><VCol cols="12" sm="6"><AppSelect :model-value="modelValue.gender" :items="['男','女','其他','未提供']" label="性別" :readonly="props.readonly" @update:model-value="update('gender',$event)" /></VCol><VCol cols="12" sm="6"><AppTextField :model-value="modelValue.age" label="年齡" type="number" min="0" step="1" suffix="歲" :readonly="props.readonly" @update:model-value="update('age',String($event))" /></VCol></VRow>
    </section>

    <section class="gds-group mb-6" aria-labelledby="gds-questions-heading">
      <div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-2"><h5 id="gds-questions-heading" class="text-h5">老年人精神抑鬱量度表</h5><VChip color="primary" size="small" variant="tonal">已回答 {{ summary.answered }} / 15</VChip></div>
      <div class="text-body-2 mb-3">Geriatric Depression Scale (GDS) (Short Form)</div>
      <p class="text-body-1 mb-5">請根據過去二星期的情況，每題選擇「是」或「否」。</p>
      <div v-for="(question,index) in gdsQuestions" :key="index" class="gds-question">
        <div :id="`gds-question-${index}`" class="gds-question-label"><VAvatar color="primary" variant="tonal" size="28" class="flex-shrink-0">{{ index+1 }}</VAvatar><span>{{ question.text }}</span></div>
        <VRadioGroup :model-value="modelValue.answers[index]" :aria-labelledby="`gds-question-${index}`" :name="`gds-answer-${index}`" :readonly="props.readonly" inline hide-details class="gds-answer" @update:model-value="answer(index,$event)">
          <VRadio :label="`是（${question.yes} 分）`" value="yes" /><VRadio :label="`否（${question.no} 分）`" value="no" />
        </VRadioGroup>
      </div>
      <div v-if="!props.readonly" class="d-flex justify-end mt-4"><VBtn variant="text" size="small" type="button" :disabled="!summary.answered" @click="update('answers',Array.from({length:15},()=>null))">清除答案</VBtn></div>
    </section>

    <section class="gds-group" aria-labelledby="gds-score-heading" aria-live="polite">
      <div class="d-flex flex-wrap justify-space-between align-center gap-3"><div><h5 id="gds-score-heading" class="text-h5">{{ summary.complete ? '總分' : '暫計分數' }}</h5><div class="text-body-2 mt-1">{{ summary.complete ? '15 題已完成' : `尚有 ${15-summary.answered} 題未回答` }}</div></div><div class="text-h4">{{ summary.score }} <span class="text-body-1">/ 15</span></div></div>
      <VDivider class="my-4" />
      <p class="text-body-2">原表備註：得分多於 8 分顯示有精神抑鬱傾向。</p>
      <VAlert v-if="summary.aboveThreshold" type="warning" variant="tonal" class="mt-4">總分 {{ summary.score }} 分，得分多於 8 分。</VAlert>
      <p v-if="!summary.complete" class="text-body-2 mt-3">完成全部題目後才顯示最終總分；未完成的表格可儲存為 Draft。</p>
    </section>
  </div>
</template>

<style scoped>
.gds-group { padding:20px; border:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); border-radius:6px; }
.gds-question { display:grid; grid-template-columns:minmax(0,1fr) 250px; align-items:center; gap:16px; padding-block:14px; border-block-end:1px solid rgba(var(--v-border-color),var(--v-border-opacity)); }
.gds-question-label { display:flex; gap:12px; align-items:flex-start; line-height:1.7; }
.gds-answer { min-inline-size:0; }
.gds-fields :deep(.v-label) { white-space:normal; opacity:1; }
@media(max-width:700px){.gds-question{grid-template-columns:minmax(0,1fr);gap:8px}.gds-group{padding:16px}}
</style>
