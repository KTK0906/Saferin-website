export type GdsAnswer = 'yes' | 'no' | null
export interface GdsAssessment { gender: string; age: string; answers: GdsAnswer[] }
// Question wording, response keys and >8 threshold transcribed from the supplied GDS form.
export const gdsQuestions = [
  { text: '你對生活基本感到滿意嗎？', yes: 0, no: 1 },
  { text: '你有沒有放棄了很多過往常常參與的活動和興趣嗎？', yes: 1, no: 0 },
  { text: '你感到自己的生活空虛嗎？', yes: 1, no: 0 },
  { text: '你常常感到生活沉悶嗎？', yes: 1, no: 0 },
  { text: '你大部份時間心情都是好的嗎？', yes: 0, no: 1 },
  { text: '你擔心有些不幸的事情將會在你身上發生嗎？', yes: 1, no: 0 },
  { text: '你大部份時間都是快樂的嗎？', yes: 0, no: 1 },
  { text: '你時常感到缺乏幫助？', yes: 1, no: 0 },
  { text: '你是否寧願留在家中，也不願出外做些新的事？', yes: 1, no: 0 },
  { text: '你是否覺你比一般老人家有更多記憶力的問題？', yes: 1, no: 0 },
  { text: '你生存到現在覺得是美好嗎？', yes: 0, no: 1 },
  { text: '你是否覺得自己現時毫無價值？', yes: 1, no: 0 },
  { text: '你是否感到精力充沛？', yes: 0, no: 1 },
  { text: '你是否覺得你現時的處境沒有希望？', yes: 1, no: 0 },
  { text: '你是否覺得大部份人的景況比你好？', yes: 1, no: 0 },
] as const
export const createGdsAssessment = (): GdsAssessment => ({ gender: '', age: '', answers: Array.from({ length: 15 }, () => null) })
export function summariseGds(answers: GdsAnswer[]) {
  let answered = 0, score = 0
  gdsQuestions.forEach((question, index) => {
    const answer = answers[index]
    if (answer === 'yes' || answer === 'no') { answered++; score += question[answer] }
  })
  const complete = answered === gdsQuestions.length
  return { answered, score, complete, aboveThreshold: complete && score > 8 }
}
