export interface ContinenceAssessment {
  symptoms: string[]
  categories: string[]
  urinaryPlan: string[]
  urinaryOther: string
  stoolShape: string
  stoolShapeOther: string
  bowelFrequency: string
  bowelFrequencyCount: string
  laxatives: string
  laxativeDetails: string
  bowelIncontinence: string
  bowelIncontinenceDetails: string
  bowelPlan: string[]
  trainingTimes: string
  bowelOther: string
  staffRoles: string[]
  staffRoleOther: string
  nextAssessment: string
  signedName: string
}
export const createContinenceAssessment = (): ContinenceAssessment => ({
  symptoms: [], categories: [], urinaryPlan: [], urinaryOther: '', stoolShape: '', stoolShapeOther: '',
  bowelFrequency: '', bowelFrequencyCount: '', laxatives: '', laxativeDetails: '', bowelIncontinence: '', bowelIncontinenceDetails: '',
  bowelPlan: [], trainingTimes: '', bowelOther: '', staffRoles: [], staffRoleOther: '', nextAssessment: '', signedName: '',
})
export const symptomGroups = [
  { title: 'A. 受壓性失禁', subtitle: 'Stress incontinence', items: [
    ['stress-cough', '在大笑時、咳嗽時或打噴嚏時會漏尿。'], ['stress-lifting', '在搬運重物時有漏尿情況。'], ['stress-stairs', '在上落床椅時有漏尿現象。'],
  ] },
  { title: 'B. 急切性失禁', subtitle: 'Urge incontinence', items: [
    ['urge-water', '聽到流水聲或觸及凍水時，會產生尿意。'], ['urge-immediate', '在心生尿意，刻不容緩，必須立即解決。'], ['urge-toilet', '因不能及時到廁所小便而失禁。'],
  ] },
  { title: 'C. 滿溢性失禁／溢流性失禁', subtitle: 'Overflow incontinence', items: [
    ['overflow-aware', '能感覺到自己正在漏尿。'], ['overflow-leaking', '常常有尿濕感覺。'], ['overflow-start', '在開始小便時有困難。'], ['overflow-strain', '需要用力才能排尿。'], ['overflow-after', '小便後，還有漏尿的情況發生。'], ['overflow-full', '小便後，仍覺得有尿並未排出。'], ['overflow-residual', '在小便後，留在膀胱內有多於 150 毫升尿液。'],
  ] },
  { title: 'D. 反射性失禁', subtitle: 'Reflex incontinence', items: [
    ['reflex-unaware', '膀胱在不自覺的情況下收縮——排尿開始。'], ['reflex-sudden', '在未有尿意前，小便突然溢出。'],
  ] },
]
export const functionalGroups = [
  { id: 'functional-mobility', title: '活動能力受損', items: [['mobility-bed', '不能郁動，只能臥床。'], ['mobility-sit', '只能坐起及臥床。'], ['mobility-help', '在別人攙扶下才可行走。'], ['mobility-aid', '使用手杖、支架才能走動。']] },
  { id: 'functional-dexterity', title: '動作有欠靈活', items: [['dexterity-urinal', '不能使用尿壺／便盆。'], ['dexterity-clothes', '不能脫下褲子。']] },
  { id: 'functional-communication', title: '溝通障礙', items: [['communication-hearing', '聽覺不靈。'], ['communication-speech', '口齒不清。'], ['communication-vision', '視力不佳。']] },
  { id: 'functional-environment', title: '環境中的限制', items: [['environment-distance', '廁所太遠。'], ['environment-find', '不能找到廁所。'], ['environment-sign', '看不見／沒有廁所指示標引。']] },
]
export const urinaryGroups = [
  { id: 'bladder-training', title: '膀胱訓練（Bladder training）', items: [['habit', '跟隨長者之排尿習慣（Habit training）'], ['timed', '定時性之排尿訓練（Timed voiding）'], ['prompted', '提示式之排尿訓練（Prompted voiding）']] },
  { id: 'products', title: '使用失禁用品', items: [['diaper', '尿片'], ['pad', '尿片芯'], ['pants', '尿片褲']] },
  { id: 'reduce-diapers', title: '減低使用尿片次數', items: [['education', '加強教育員工對長者失禁認識'], ['staff-assist', '安排人手協助院友如廁'], ['toilet-tools', '提供合適如廁工具'], ['urinal', '尿壺'], ['commode', '便椅'], ['near-toilet', '安排接近洗手間之床位']] },
]
export const bowelGroups = [
  { id: 'bowel-training', title: '繼續如廁訓練', items: [['bowel-training-other', '其他']] },
  { id: 'non-drug', title: '給予非藥物治療', items: [['prune', '3 天沒有大便，給予西梅汁'], ['massage', '腹部按摩'], ['exercise', '適量運動']] },
  { id: 'medical-followup', title: '給予醫療跟進', items: [['medication', '按醫療藥物治療'], ['doctor-review', '轉介醫生跟進藥物副作用／評估其他疾病因素或危機']] },
]
