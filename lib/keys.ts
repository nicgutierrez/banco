/** Chiavi stabili salvate nel database: non rinominare cartelle o id già usati. */
export const unitKey = (subjectId: string, unitId: string) => `${subjectId}/${unitId}`

export const moduleKey = (subjectId: string, unitId: string, moduleId: string) =>
  `${subjectId}/${unitId}/${moduleId}`

export const unitKeyOfModule = (key: string) => key.split('/').slice(0, 2).join('/')
