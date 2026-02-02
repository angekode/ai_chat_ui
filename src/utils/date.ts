export function prettyFormatNow() : string {
  return prettyFormatFromNativeDate(new Date());
}

function twoDigitsString(n: number): string {
  return n.toString().padStart(2, '0');
}

// apiDate: 2026-01-22 19:17:31.887+01
export function prettyFormatFromApi(apiDate: string): string {
  //const isoFormat = apiDate.replace(' ', 'T') + ':00';   // isoFormat: 2026-01-22T19:17:31.887+01:00
  return prettyFormatFromNativeDate(new Date(apiDate));
}

function prettyFormatFromNativeDate(date: Date): string {
    return twoDigitsString(date.getHours()) + ':' + 
    twoDigitsString(date.getMinutes()) + ' ' + 
    twoDigitsString(date.getDay() + 1) + '/' + 
    twoDigitsString(date.getMonth() + 1) + '/' + 
    date.getFullYear().toString();
}