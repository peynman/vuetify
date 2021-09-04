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
  const trimmedSafeTime = unTrimmedTimeString || '00:00:00+00:00'
  const [year, month, date] = dateString.split('-')

  if ((trimmedSafeTime.includes('+') || trimmedSafeTime.includes('-')) && !trimmedSafeTime.includes('.')) {
    const offsetDirection = trimmedSafeTime.includes('+') ? '+' : '-'
    const [timeString, timeZoneString] = trimmedSafeTime.split(offsetDirection)
    const [hour, minute, second] = (timeString || '00:00:00').split(':')
    const [timezoneHour, timezoneMinute] = (timeZoneString || '00:00').split('')
    return [pad(year, 4), pad(month || 1), pad(date || 1)].join('-') + 'T' +
            [pad(hour || 0, 2), pad(minute || 0, 2), pad(second || 0, 2)].join(':') + '+' +
            [pad(timezoneHour || 0, 2), pad(timezoneMinute || 0, 2)].join(':')
  } else if (unTrimmedTimeString?.includes('.') && unTrimmedTimeString?.includes('Z')) {
    const [timeString, timeZoneString] = (unTrimmedTimeString || '00:00:00.000000Z').split('.')
    const [hour, minute, second] = (timeString || '00:00:00').split(':')
    const timezoneSafeString = timeZoneString || '0000000Z'
    const timeZoneSeconds = parseInt(timezoneSafeString.substr(0, timezoneSafeString.indexOf('Z')))
    const timezoneHour = Math.floor(timeZoneSeconds / 3600)
    const timezoneMinute = Math.abs(timeZoneSeconds / 3600) - Math.floor(Math.abs(timeZoneSeconds / 3600)) * 60
    return [pad(year, 4), pad(month || 1), pad(date || 1)].join('-') + 'T' +
            [pad(hour || 0, 2), pad(minute || 0, 2), pad(second || 0, 2)].join(':') + '+' +
            [pad(timezoneHour || 0, 2), pad(timezoneMinute || 0, 2)].join(':')
  } else {
    return [pad(year, 4), pad(month || 1), pad(date || 1)].join('-') + 'T' +
            [pad(0, 2), pad(0, 2), pad(0, 2)].join(':') + '+' +
            [pad(0, 2), pad(0, 2)].join(':')
  }
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
