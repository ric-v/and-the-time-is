import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentTime } from '../../utils/timeNow';
import * as ct from 'countries-and-timezones';

// Generate the list dynamically from the library
// Filter to only include canonically supported timezones in the environment + any others the library knows
const allTz = ct.getAllTimezones();
export const timezoneList = (Object.values(allTz) as ct.Timezone[]).map(tz => {
  const countryCode = tz.countries[0];
  const country = countryCode ? ct.getCountry(countryCode) : null;
  
  return {
    code: countryCode || tz.name,
    name: tz.name,
    city: tz.name.split('/').pop()?.replace(/_/g, ' ') || tz.name,
    country: country ? country.name : 'Universal'
  };
});

/**
 * @description Get the timezone name from the timezone code
 * @param req - request object
 * @param res - response object
 */
const timezones = (req: NextApiRequest, res: NextApiResponse) => {
  const searchKey = ((req.query.search as string) || '').toLowerCase();

  // if the search key is not provided, return none
  if (!searchKey) {
    return res.status(200).json([]);
  }

  // filter timezone list by the search key
  res.status(200).json(timezoneList.filter(timezone => {
    const currentTime = getCurrentTime(timezone.name, "%Z %:z %z").toLowerCase();
    const [abbr, offsetLong, offsetShort] = currentTime.split(' ');
    
    return (
      timezone.name.toLowerCase().includes(searchKey) ||
      timezone.city.toLowerCase().includes(searchKey) ||
      timezone.code.toLowerCase().includes(searchKey) ||
      timezone.country.toLowerCase().includes(searchKey) ||
      abbr.includes(searchKey) ||
      (offsetLong && offsetLong.includes(searchKey)) ||
      (offsetShort && offsetShort.includes(searchKey))
    );
  }));
}

export default timezones;
