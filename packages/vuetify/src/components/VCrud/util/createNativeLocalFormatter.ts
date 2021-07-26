import pad from '../../VDatePicker/util/pad'
import { DatePickerFormatter } from 'vuetify/types'

interface SubstrOptions {
  start?: number
  length: number
}

export const makeIsoDateTimeString = (dateTimeString: string) => {
  if (!dateTimeString) {
    return null
  }

  const trimmedDateTimeString = dateTimeString.trim().split(' ')[0]
  const [dateString, unTrimmedTimeString] = trimmedDateTimeString.split('T')
  const [timeString, timeZoneString] = (unTrimmedTimeString || '00:00:00+00:00').split('+')
  const [hour, minute, second] = (timeString || '00:00:00').split(':')
  const [timezoneHour, timezoneMinute] = (timeZoneString || '00:00').split('')
  const [year, month, date] = dateString.split('-')
  return [pad(year, 4), pad(month || 1), pad(date || 1)].join('-') + 'T' +
          [pad(hour || 0, 2), pad(minute || 0, 2), pad(second || 0, 2)].join(':') + '+' +
          [pad(timezoneHour || 0, 2), pad(timezoneMinute || 0, 2)].join(':')
}

function createNativeLocaleFormatter (
  local: string | undefined,
  options: Intl.DateTimeFormatOptions
): DatePickerFormatter | undefined

function createNativeLocaleFormatter (
  local: string | undefined,
  options: Intl.DateTimeFormatOptions,
  substrOptions: SubstrOptions
): DatePickerFormatter

function createNativeLocaleFormatter (
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
  substrOptions: SubstrOptions = { start: 0, length: 0 }
): DatePickerFormatter | undefined {
  try {
    const intlFormatter = new Intl.DateTimeFormat(locale || undefined, options)
    return (dateString: string) => intlFormatter.format(new Date(`${makeIsoDateTimeString(dateString)}`))
  } catch (e) {
    return (substrOptions.start || substrOptions.length)
      ? (dateString: string) => makeIsoDateTimeString(dateString)?.substr(substrOptions.start || 0, substrOptions.length) ?? ''
      : undefined
  }
}

export default createNativeLocaleFormatter
