// Демо-режим: даёт прокликать интерфейс без рабочего прокси/бэкенда.
// Флаг хранится в localStorage; сторы проверяют isDemo() и отдают мок-данные.
const KEY = 'centrinvest-demo'

export const isDemo = (): boolean => {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
export const setDemo = (on: boolean): void => {
  try { on ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export const demoAccounts = [
  { number: '40702810500000012345', currency: 'RUR', balance: 2847500.42, status: 'active' },
  { number: '40702840700000067890', currency: 'USD', balance: 15230.10,   status: 'active' },
  { number: '40702978300000054321', currency: 'EUR', balance: 8400.00,    status: 'active' },
]

export const demoContractors = [
  { id: 'demo-1', name: 'ООО «Ромашка»',        account: '40702810900000011111', bank: 'ПАО Сбербанк',            bic: '044525225', inn: '7701234567' },
  { id: 'demo-2', name: 'ИП Иванов И. И.',       account: '40802810100000022222', bank: 'АО «ТБанк»',              bic: '044525974', inn: '772812345678' },
  // Контрагент в самом Центр-Инвесте (БИК 046015207) → инлайн-комиссия покажет «без комиссии»
  { id: 'demo-3', name: 'ООО «Логистик Плюс»',   account: '40702810300000033333', bank: 'Банк «Центр-инвест»',     bic: '046015207', inn: '6163012345' },
]
